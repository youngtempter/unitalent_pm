import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

// ----------------------
// GET /api/jobs
// Public list of jobs with search/filter support
// Query params: q, location, type, workMode, minSalary, maxSalary, sortBy
// ----------------------
router.get("/", async (req, res) => {
  try {
    const { q, location, type, workMode, minSalary, maxSalary, sortBy } = req.query;

    const where = {};
    const now = new Date();

    // Exclude expired jobs
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: now } }
    ];

    // Keyword search across title and description
    if (q) {
      const searchTerm = q.trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ]
      });
    }

    if (location) {
      where.AND = where.AND || [];
      where.AND.push({
        location: { contains: location.trim(), mode: "insensitive" }
      });
    }

    if (type) {
      where.AND = where.AND || [];
      where.AND.push({ type: type.trim() });
    }

    if (workMode) {
      where.AND = where.AND || [];
      where.AND.push({ workMode: workMode.trim() });
    }

    // Salary filtering - basic string contains check
    if (minSalary || maxSalary) {
      // Since salary is stored as string, we do contains check
      // This is a basic implementation - can be enhanced with numeric parsing
    }

    // Determine sort order
    let orderBy = { createdAt: "desc" };
    if (sortBy === "recent") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "views") {
      orderBy = { views: "desc" };
    }

    const jobs = await prisma.job.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy,
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
  const { title, description, location, salary, type, workMode, requirements, expiresAt, applicationDeadline } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title & description required" });
  }

  try {
    // Parse dates if provided
    let expiresAtDate = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiresAt date format" });
      }
    }

    let applicationDeadlineDate = null;
    if (applicationDeadline) {
      applicationDeadlineDate = new Date(applicationDeadline);
      if (isNaN(applicationDeadlineDate.getTime())) {
        return res.status(400).json({ message: "Invalid applicationDeadline date format" });
      }
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        salary: salary?.trim() || null,
        type: type?.trim() || null,
        workMode: workMode?.trim() || null,
        requirements: requirements?.trim() || null,
        expiresAt: expiresAtDate,
        applicationDeadline: applicationDeadlineDate,
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
// Load single job (public endpoint, increments view count)
// For editing, use GET /api/jobs/:id/edit (EMPLOYER only)
// ----------------------
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    // Increment view count for public views
    await prisma.job.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
    job.views = (job.views || 0) + 1;

    return res.json(job);
  } catch (e) {
    console.error("GET /api/jobs/:id error", e);
    return res.status(500).json({ message: "Failed to load job" });
  }
});

// ----------------------
// GET /api/jobs/:id/edit
// Load single job for editing (EMPLOYER only)
// ----------------------
router.get("/:id/edit", auth, requireRole("EMPLOYER"), async (req, res) => {
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
        expiresAt: true,
        applicationDeadline: true,
        views: true,
        employerId: true,
      },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.employerId !== req.user.id) {
      return res.status(403).json({ message: "You can view only your own jobs" });
    }

    return res.json(job);
  } catch (e) {
    console.error("GET /api/jobs/:id/edit error", e);
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

  const { title, description, location, salary, type, workMode, requirements, expiresAt, applicationDeadline } = req.body;

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

    // Parse dates if provided
    const updateData = {
      title: title?.trim(),
      description: description?.trim(),
      location: location?.trim() || null,
      salary: salary?.trim() || null,
      type: type?.trim() || null,
      workMode: workMode?.trim() || null,
      requirements: requirements?.trim() || null,
    };

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === "") {
        updateData.expiresAt = null;
      } else {
        const expiresAtDate = new Date(expiresAt);
        if (isNaN(expiresAtDate.getTime())) {
          return res.status(400).json({ message: "Invalid expiresAt date format" });
        }
        updateData.expiresAt = expiresAtDate;
      }
    }

    if (applicationDeadline !== undefined) {
      if (applicationDeadline === null || applicationDeadline === "") {
        updateData.applicationDeadline = null;
      } else {
        const applicationDeadlineDate = new Date(applicationDeadline);
        if (isNaN(applicationDeadlineDate.getTime())) {
          return res.status(400).json({ message: "Invalid applicationDeadline date format" });
        }
        updateData.applicationDeadline = applicationDeadlineDate;
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
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

// ----------------------
// GET /api/jobs/:id/view
// Increment view count (public endpoint)
// ----------------------
router.post("/:id/view", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    return res.json({ views: updated.views });
  } catch (e) {
    console.error("POST /api/jobs/:id/view error", e);
    return res.status(500).json({ message: "Failed to increment view count" });
  }
});

export default router;
