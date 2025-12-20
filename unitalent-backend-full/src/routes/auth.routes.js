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

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

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
        role: "STUDENT",
        firstName,
        lastName
      }
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (e) {
    return res.status(500).json({ message: "Register error", error: e.message });
  }
});

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

router.post("/employer/register", async (req, res) => {
  try {
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
        role: "EMPLOYER",
        firstName,
        lastName
      }
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (e) {
    console.error("Employer register error:", e);
    console.error("Error details:", {
      name: e.name,
      code: e.code,
      message: e.message,
      meta: e.meta
    });
    
    // Handle Prisma-specific errors
    if (e.code === 'P2002') {
      const field = e.meta?.target?.[0] || "field";
      return res.status(409).json({ 
        message: `${field} already exists`,
        field: field
      });
    }
    
    if (e.code === 'P2025') {
      return res.status(404).json({ message: "Database record not found." });
    }
    
    if (e.message && e.message.includes('Unknown model')) {
      return res.status(500).json({ 
        message: "Database configuration error. Please run: npx prisma generate" 
      });
    }
    
    return res.status(500).json({ 
      message: "Employer register error", 
      error: process.env.NODE_ENV === 'development' ? e.message : undefined,
      code: e.code || undefined
    });
  }
});

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

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Wrong current password" });
    }

    const updateData = {};

    if (newEmail) {
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: emailErrorMessage });
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(409).json({ message: "Email already used" });
      }

      updateData.email = newEmail.trim();
    }

    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ message: passwordErrorMessage });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return res.json(buildAuthResponse(updatedUser));
  } catch (e) {
    return res.status(500).json({ message: "Failed to update credentials", error: e.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: emailErrorMessage });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim() } });

    if (!user) {
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5500"}/reset-password.html?token=${token}`;
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    return res.json({ 
      message: "If an account with that email exists, a password reset link has been sent." 
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return res.status(500).json({ message: "Failed to process password reset request", error: e.message });
  }
});

router.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

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

    const hash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hash }
    });

    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true }
    });

    return res.json(buildAuthResponse(updatedUser));
  } catch (e) {
    console.error("Reset password error:", e);
    return res.status(500).json({ message: "Failed to reset password", error: e.message });
  }
});

router.post("/sdu-login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: "Student ID and password are required" });
    }

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

    if (!sduData || (!sduData.fullname && !sduData.program_class)) {
      return res.status(401).json({ 
        message: "Invalid SDU credentials. Please check your student ID and password." 
      });
    }

    const fullname = sduData?.fullname || "";
    const programClass = sduData?.program_class || "";
    const contactNumber = sduData?.contact_number || null;
    const grandGpa = sduData?.grand_gpa !== undefined && sduData?.grand_gpa !== null 
      ? String(sduData.grand_gpa) 
      : null;

    const scheduleJson = sduData?.schedule || null;
    const transcriptHtml = sduData?.transcript_print_html || null;
    const birthCity = sduData?.birth_city || null;

    const nameParts = fullname.trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(" ") || null;

    let studyYear = null;
    if (programClass) {
      const yearMatch = programClass.match(/(\d+)\s*course/i);
      if (yearMatch) {
        studyYear = yearMatch[1];
      }
    }

    let major = null;
    if (programClass) {
      const regex = /^(.+?)\s*-\s*\d+\s*course/i;
      const match = programClass.match(regex);
    
      if (match) {
        major = match[1].trim();
      } else {
        const fallback = programClass.replace(/\d+\s*course/i, "").trim();
        major = fallback.replace(/-\s*$/, "").trim();
      }
    }

    let email = studentId.includes("@") ? studentId : `${studentId}@sdu.edu.kz`;

    let user = await prisma.user.findUnique({ where: { email } });

    let passwordHash;
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      passwordHash = await bcrypt.hash(randomPassword, 10);
    } else {
      passwordHash = user.password;
    }

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
      gpa: grandGpa,
      scheduleJson: scheduleJson,
      transcriptHtml: transcriptHtml,
      city: birthCity,
    };

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: contactNumber || user.phone,
          university: "SDU",
          major: major || user.major,
          studyYear: studyYear || user.studyYear,
          gpa: grandGpa,
          scheduleJson: scheduleJson || user.scheduleJson,
          transcriptHtml: transcriptHtml || user.transcriptHtml,
          city: birthCity || user.city,
        }
      });
    } else {
      user = await prisma.user.create({ data: userData });
    }

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
