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
        gpa: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        scheduleJson: true,

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
    gpa,
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
        gpa: nullableTrim(gpa),
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
        gpa: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        scheduleJson: true,

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
        gpa: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        scheduleJson: true,
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
        gpa: true,
        city: true,
        skills: true,
        bio: true,
        github: true,
        linkedin: true,
        portfolio: true,
        scheduleJson: true,
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

/**
 * POST /api/students/me/sync-schedule
 * Sync schedule from SDU portal (requires SDU credentials)
 */
router.post("/me/sync-schedule", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: "Student ID and password are required" });
    }

    // Call Python scraper to get schedule from SDU portal
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

    // Extract schedule JSON from SDU data
    const scheduleJson = sduData?.schedule || null;

    if (!scheduleJson) {
      return res.status(404).json({ message: "No schedule data found in SDU portal" });
    }

    // Update user's schedule
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        scheduleJson: scheduleJson,
      },
      select: {
        scheduleJson: true,
      },
    });

    res.json({ 
      message: "Schedule synced successfully",
      scheduleJson: updated.scheduleJson 
    });
  } catch (e) {
    console.error("Schedule sync error:", e);
    res.status(500).json({ 
      message: "Failed to sync schedule", 
      error: e.message 
    });
  }
});

export default router;
