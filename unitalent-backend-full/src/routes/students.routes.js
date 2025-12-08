import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

// helper: trim string, empty -> null, non-string -> undefined (so Prisma ignores)
const nullableTrim = (v) => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? null : t;
};

/**
 * GET /api/students/me
 * Returns current student profile
 */
router.get("/me", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        firstName: true,
        lastName: true,

        // ✅ your new fields
        phone: true,
        university: true,
        major: true,
        studyYear: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,

        createdAt: true,
      },
    });

    if (!me) return res.status(404).json({ message: "Student not found" });

    res.json(me);
  } catch (e) {
    res.status(500).json({ message: "Failed to load profile", error: e.message });
  }
});

/**
 * PUT /api/students/me
 * Updates current student profile
 */
router.put("/me", auth, requireRole("STUDENT"), async (req, res) => {
  const {
    firstName,
    lastName,
    username,

    phone,
    university,
    major,
    studyYear,
    city,
    skills,
    bio,
    github,
    linkedin,
    portfolio,
  } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: nullableTrim(firstName),
        lastName: nullableTrim(lastName),
        username: nullableTrim(username),

        phone: nullableTrim(phone),
        university: nullableTrim(university),
        major: nullableTrim(major),
        studyYear: nullableTrim(studyYear),
        city: nullableTrim(city),
        skills: nullableTrim(skills),
        bio: nullableTrim(bio),
        github: nullableTrim(github),
        linkedin: nullableTrim(linkedin),
        portfolio: nullableTrim(portfolio),
      },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        firstName: true,
        lastName: true,

        phone: true,
        university: true,
        major: true,
        studyYear: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,

        createdAt: true,
      },
    });

    res.json(updated);
  } catch (e) {
    // ✅ handle unique conflict for username
    if (e.code === "P2002") {
      return res.status(409).json({ message: "Username already taken" });
    }
    res.status(500).json({ message: "Failed to update profile", error: e.message });
  }
});

/**
 * GET /api/students/:id
 * Get student profile by ID (EMPLOYER only)
 */
router.get("/:id", auth, requireRole("EMPLOYER", "ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const student = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        university: true,
        major: true,
        studyYear: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        createdAt: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ message: "User is not a student" });
    }

    res.json(student);
  } catch (e) {
    res.status(500).json({ message: "Failed to load student profile", error: e.message });
  }
});

/**
 * GET /api/students
 * Search students (EMPLOYER only)
 * Query params: q, city, studyYear, major, university
 */
router.get("/", auth, requireRole("EMPLOYER", "ADMIN"), async (req, res) => {
  try {
    const { q, city, studyYear, major, university } = req.query;

    const where = {
      role: "STUDENT",
    };

    // Keyword search across name, skills, major, university
    if (q) {
      const searchTerm = q.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { username: { contains: searchTerm, mode: "insensitive" } },
        { skills: { contains: searchTerm, mode: "insensitive" } },
        { major: { contains: searchTerm, mode: "insensitive" } },
        { university: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = { contains: city.trim(), mode: "insensitive" };
    }

    if (studyYear) {
      where.studyYear = { contains: studyYear.trim(), mode: "insensitive" };
    }

    if (major) {
      where.major = { contains: major.trim(), mode: "insensitive" };
    }

    if (university) {
      where.university = { contains: university.trim(), mode: "insensitive" };
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        university: true,
        major: true,
        studyYear: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit results
    });

    res.json(students);
  } catch (e) {
    res.status(500).json({ message: "Failed to search students", error: e.message });
  }
});

export default router;
