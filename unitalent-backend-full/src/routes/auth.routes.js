import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

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

export default router;
