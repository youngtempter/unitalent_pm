import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

export default router;
