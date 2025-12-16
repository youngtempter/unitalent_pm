import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ✅ include username in safe user
const safeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username ?? null,
  role: user.role,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null
});

const buildAuthResponse = (user) => ({
  token: signToken(user),
  user: safeUser(user)
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isStrongPassword = (pwd = "") => {
  const str = String(pwd);
  return (
    str.length >= 8 &&
    /[A-Z]/.test(str) &&
    /[a-z]/.test(str) &&
    /[0-9]/.test(str)
  );
};

const passwordErrorMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number.";

const emailErrorMessage = "Invalid email format.";

// -----------------------------
// STUDENT REGISTER
// POST /api/auth/register
// -----------------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: emailErrorMessage });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: passwordErrorMessage });
    }

    // ✅ check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // ✅ check username uniqueness (only if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username: username || null,
        password: hash,
        role: "STUDENT", // force
        firstName,
        lastName
      }
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (e) {
    return res.status(500).json({ message: "Register error", error: e.message });
  }
});

// -----------------------------
// STUDENT LOGIN
// POST /api/auth/login
// -----------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role !== "STUDENT") {
      return res.status(403).json({ message: "Use employer login" });
    }

    return res.json(buildAuthResponse(user));
  } catch (e) {
    return res.status(500).json({ message: "Login error", error: e.message });
  }
});

// -----------------------------
// EMPLOYER REGISTER
// POST /api/auth/employer/register
// -----------------------------
router.post("/employer/register", async (req, res) => {
  try {
    // You can accept extra fields safely even if not used
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: emailErrorMessage });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: passwordErrorMessage });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: "EMPLOYER", // force
        firstName,
        lastName
        // username intentionally omitted for employers
      }
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (e) {
    return res.status(500).json({ message: "Employer register error", error: e.message });
  }
});

// -----------------------------
// EMPLOYER LOGIN
// POST /api/auth/employer/login
// -----------------------------
router.post("/employer/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role !== "EMPLOYER") {
      return res.status(403).json({ message: "This account is not an employer" });
    }

    return res.json(buildAuthResponse(user));
  } catch (e) {
    return res.status(500).json({ message: "Employer login error", error: e.message });
  }
});

// -----------------------------
// CHANGE CREDENTIALS
// PATCH /api/auth/me/credentials
// Auth required (any role)
// -----------------------------
router.patch("/me/credentials", auth, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    if (!newEmail && !newPassword) {
      return res.status(400).json({ message: "At least one of newEmail or newPassword must be provided" });
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Wrong current password" });
    }

    // Prepare update data
    const updateData = {};

    // Validate and set new email if provided
    if (newEmail) {
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: emailErrorMessage });
      }

      // Check email uniqueness
      const existingEmail = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(409).json({ message: "Email already used" });
      }

      updateData.email = newEmail.trim();
    }

    // Validate and set new password if provided
    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ message: passwordErrorMessage });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Return fresh token + updated user
    return res.json(buildAuthResponse(updatedUser));
  } catch (e) {
    return res.status(500).json({ message: "Failed to update credentials", error: e.message });
  }
});

// -----------------------------
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// Public endpoint
// -----------------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: emailErrorMessage });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: email.trim() } });

    // For security, don't reveal if email exists or not
    // Always return success message
    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });

    // Create new password reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // TODO: Send email with reset link
    // For now, we'll log it to console (in production, use email service)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5500"}/reset-password.html?token=${token}`;
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    // In production, send email here:
    // await sendPasswordResetEmail(user.email, resetUrl);

    return res.json({ 
      message: "If an account with that email exists, a password reset link has been sent." 
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return res.status(500).json({ message: "Failed to process password reset request", error: e.message });
  }
});

// -----------------------------
// VERIFY RESET TOKEN
// GET /api/auth/reset-password/:token
// Public endpoint
// -----------------------------
router.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Find valid, unused token
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    if (!reset) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (reset.used) {
      return res.status(400).json({ message: "This reset token has already been used" });
    }

    if (new Date() > reset.expiresAt) {
      return res.status(400).json({ message: "This reset token has expired" });
    }

    // Token is valid
    return res.json({ 
      valid: true,
      email: reset.user.email,
      role: reset.user.role
    });
  } catch (e) {
    console.error("Verify reset token error:", e);
    return res.status(500).json({ message: "Failed to verify reset token", error: e.message });
  }
});

// -----------------------------
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// Public endpoint
// -----------------------------
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: passwordErrorMessage });
    }

    // Find valid, unused token
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!reset) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (reset.used) {
      return res.status(400).json({ message: "This reset token has already been used" });
    }

    if (new Date() > reset.expiresAt) {
      return res.status(400).json({ message: "This reset token has expired" });
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hash }
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true }
    });

    // Return auth response so user can be logged in automatically
    return res.json(buildAuthResponse(updatedUser));
  } catch (e) {
    console.error("Reset password error:", e);
    return res.status(500).json({ message: "Failed to reset password", error: e.message });
  }
});

// -----------------------------
// SDU PORTAL LOGIN
// POST /api/auth/sdu-login
// Public endpoint - logs in via SDU portal and creates/updates user
// -----------------------------
router.post("/sdu-login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: "Student ID and password are required" });
    }

    // Call Python scraper to get user data from SDU portal
    const SDU_SCRAPER_URL = process.env.SDU_SCRAPER_URL || "http://localhost:5000";
    
    let sduData;
    try {
      const formData = new URLSearchParams();
      formData.append("student_id", studentId);
      formData.append("password", password);

      const scraperResponse = await fetch(`${SDU_SCRAPER_URL}/get-user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!scraperResponse.ok) {
        if (scraperResponse.status === 401 || scraperResponse.status === 502) {
          return res.status(401).json({ message: "Invalid SDU credentials or portal unavailable" });
        }
        throw new Error(`SDU scraper returned ${scraperResponse.status}`);
      }

      sduData = await scraperResponse.json();
    } catch (e) {
      console.error("Error calling SDU scraper:", e);
      return res.status(502).json({ 
        message: "Failed to connect to SDU portal. Please try again later." 
      });
    }

    // Check if we got valid data (login was successful)
    // If login failed, the scraper might return data with null/empty values
    if (!sduData || (!sduData.fullname && !sduData.program_class)) {
      return res.status(401).json({ 
        message: "Invalid SDU credentials. Please check your student ID and password." 
      });
    }

    // Parse SDU data
    const fullname = sduData?.fullname || "";
    const programClass = sduData?.program_class || "";
    const contactNumber = sduData?.contact_number || null;
    // Extract grand_gpa from SDU data (can be string, number, or null/undefined)
    const grandGpa = sduData?.grand_gpa !== undefined && sduData?.grand_gpa !== null 
      ? String(sduData.grand_gpa) 
      : null;

    // Extract schedule JSON from SDU data
    const scheduleJson = sduData?.schedule || null;

    // Extract transcript HTML from SDU data
    const transcriptHtml = sduData?.transcript_print_html || null;

    // Extract birth city from SDU data
    const birthCity = sduData?.birth_city || null;

    // Parse fullname into firstName and lastName
    const nameParts = fullname.trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(" ") || null;

    // Extract course/year from program_class (e.g., "Computer Science 3 course" -> "3")
    let studyYear = null;
    if (programClass) {
      const yearMatch = programClass.match(/(\d+)\s*course/i);
      if (yearMatch) {
        studyYear = yearMatch[1];
      }
    }

    // Extract major/program (everything before the year)
    let major = null;
    if (programClass) {
      // Clean extraction: <major> - <digit> course
      const regex = /^(.+?)\s*-\s*\d+\s*course/i;
      const match = programClass.match(regex);
    
      if (match) {
        major = match[1].trim();
      } else {
        // fallback: remove "<digit> course" if present
        const fallback = programClass.replace(/\d+\s*course/i, "").trim();
        major = fallback.replace(/-\s*$/, "").trim();
      }
    }
    

    // Generate email from student ID (assuming format like student_id@sdu.edu.kz)
    // If student ID doesn't look like email, construct it
    let email = studentId.includes("@") ? studentId : `${studentId}@sdu.edu.kz`;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    // Generate a random password for new users (they'll need to reset it later)
    // For existing users, keep their current password
    let passwordHash;
    if (!user) {
      // Generate a secure random password
      const randomPassword = crypto.randomBytes(16).toString("hex");
      passwordHash = await bcrypt.hash(randomPassword, 10);
    } else {
      // Keep existing password
      passwordHash = user.password;
    }

    // Prepare user data
    const userData = {
      email,
      password: passwordHash,
      role: "STUDENT",
      firstName,
      lastName,
      phone: contactNumber,
      university: "SDU",
      major,
      studyYear,
      gpa: grandGpa, // Save grand_gpa from SDU portal
      scheduleJson: scheduleJson, // Save schedule JSON from SDU portal
      transcriptHtml: transcriptHtml, // Save transcript HTML from SDU portal
      city: birthCity, // Save birth city from SDU portal
    };

    // Create or update user
    if (user) {
      // Update existing user with latest SDU data
      // Always update GPA, schedule, and city from SDU portal when logging in via SDU
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: contactNumber || user.phone,
          university: "SDU",
          major: major || user.major,
          studyYear: studyYear || user.studyYear,
          gpa: grandGpa, // Always update GPA from SDU portal grand_gpa
          scheduleJson: scheduleJson || user.scheduleJson, // Update schedule if available, otherwise keep existing
          transcriptHtml: transcriptHtml || user.transcriptHtml, // Update transcript if available, otherwise keep existing
          city: birthCity || user.city, // Update city from SDU portal if available, otherwise keep existing
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({ data: userData });
    }

    // Return auth response
    return res.json(buildAuthResponse(user));
  } catch (e) {
    console.error("SDU login error:", e);
    return res.status(500).json({ 
      message: "SDU login failed", 
      error: e.message 
    });
  }
});

export default router;
