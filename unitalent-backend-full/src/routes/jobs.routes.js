import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

// ----------------------
// GET /api/jobs
// Public list of jobs with search/filter support
// Query params: q, location, type, workMode, minSalary, maxSalary
// ----------------------
router.get("/", async (req, res) => {
  try {
    const { q, location, type, workMode, minSalary, maxSalary } = req.query;

    const where = {};

    // Keyword search across title and description
    if (q) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location.trim(), mode: "insensitive" };
    }

    if (type) {
      where.type = type.trim();
    }

    if (workMode) {
      where.workMode = workMode.trim();
    }

    // Salary filtering (basic string matching for now)
    // Note: If salary is stored as string like "120 000 ₸ / month",
    // we do simple contains check. For numeric parsing, would need migration.
    if (minSalary || maxSalary) {
      // For now, we'll skip numeric salary filtering since it's stored as string
      // This can be enhanced later with proper numeric field or parsing
    }

    const jobs = await prisma.job.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        employer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ message: "Failed to load jobs", error: e.message });
  }
});

// ----------------------
// POST /api/jobs
// Create job (EMPLOYER)
// ----------------------
router.post("/", auth, requireRole("EMPLOYER"), async (req, res) => {
  const { title, description, location, salary, type, workMode, requirements } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title & description required" });
  }

  try {
    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        salary: salary?.trim() || null,
        type: type?.trim() || null,
        workMode: workMode?.trim() || null,
        requirements: requirements?.trim() || null,
        employerId: req.user.id,
      },
    });

    return res.status(201).json(job);
  } catch (e) {
    console.error("POST /api/jobs error", e);
    return res.status(500).json({ message: "Failed to create job" });
  }
});

// ----------------------
// GET /api/jobs/my
// Employer's own jobs
// ----------------------
router.get("/my", auth, requireRole("EMPLOYER"), async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { employerId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

// ----------------------
// GET /api/jobs/:id
// Load single job for editing (EMPLOYER only)
// ----------------------
router.get("/:id", auth, requireRole("EMPLOYER"), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        salary: true,
        type: true,
        workMode: true,
        requirements: true,
        employerId: true,
      },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.employerId !== req.user.id) {
      return res.status(403).json({ message: "You can view only your own jobs" });
    }

    return res.json(job);
  } catch (e) {
    console.error("GET /api/jobs/:id error", e);
    return res.status(500).json({ message: "Failed to load job" });
  }
});

// ----------------------
// PATCH /api/jobs/:id
// Update job (EMPLOYER only)
// ----------------------
router.patch("/:id", auth, requireRole("EMPLOYER"), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  const { title, description, location, salary, type, workMode, requirements } = req.body;

  try {
    const existing = await prisma.job.findUnique({
      where: { id },
      select: { id: true, employerId: true },
    });

    if (!existing)
      return res.status(404).json({ message: "Job not found" });

    if (existing.employerId !== req.user.id) {
      return res.status(403).json({ message: "You can edit only your own jobs" });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        location: location?.trim() || null,
        salary: salary?.trim() || null,
        type: type?.trim() || null,
        workMode: workMode?.trim() || null,
        requirements: requirements?.trim() || null,
      },
    });

    return res.json(job);
  } catch (e) {
    console.error("PATCH /api/jobs/:id error", e);
    return res.status(500).json({ message: "Failed to update job" });
  }
});

// ----------------------
// 🚀 NEW: DELETE /api/jobs/:id
// Delete job (EMPLOYER only)
// ----------------------
router.delete("/:id", auth, requireRole("EMPLOYER"), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      select: { employerId: true },
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employerId !== req.user.id) {
      return res.status(403).json({
        message: "You can delete only your own jobs",
      });
    }

    // Cascade deletion of applications if referential actions set in schema
    await prisma.job.delete({ where: { id } });

    return res.json({ message: "Job deleted successfully" });
  } catch (e) {
    console.error("DELETE /api/jobs/:id error", e);
    return res.status(500).json({ message: "Failed to delete job" });
  }
});

export default router;
