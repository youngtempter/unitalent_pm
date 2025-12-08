import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * ✅ STUDENT applies to a job
 * POST /api/applications
 * body: { jobId }
 */
router.post("/", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const jobId = Number(req.body.jobId);

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existing = await prisma.application.findFirst({
      where: { jobId, studentId: req.user.id }
    });

    if (existing) {
      return res.status(409).json({ message: "You already applied to this job" });
    }

    const app = await prisma.application.create({
      data: {
        jobId,
        studentId: req.user.id
      }
    });

    res.status(201).json(app);
  } catch (e) {
    res.status(500).json({ message: "Failed to apply", error: e.message });
  }
});

/**
 * ✅ EMPLOYER reads applicants for a specific job
 * GET /api/applications?jobId=123
 */
router.get("/", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const jobId = Number(req.query.jobId);

    if (!jobId) {
      return res.status(400).json({ message: "jobId query param is required" });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, employerId: true, title: true }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your job" });
    }

    const apps = await prisma.application.findMany({
      where: { jobId },
      include: {
        job: true,
        student: { select: { id: true, email: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: "Failed to load applications", error: e.message });
  }
});

/**
 * ✅ STUDENT: my applications
 * GET /api/applications/my
 */
router.get("/my", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      where: { studentId: req.user.id },
      include: { job: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: "Failed to load my applications", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: all applications across my jobs
 * GET /api/applications/employer/my
 */
router.get("/employer/my", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      where: { job: { employerId: req.user.id } },
      include: {
        job: true,
        student: { select: { id: true, email: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: "Failed to load employer applications", error: e.message });
  }
});

/**
 * ✅ EMPLOYER updates application status
 * PATCH /api/applications/:id
 * body: { status }
 */
router.patch("/:id", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, interviewDate } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (app.job.employerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your application" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: String(status).trim(),
        interviewDate: interviewDate || app.interviewDate // Add interview date if provided
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to update status", error: e.message });
  }
});

/**
 * ✅ EMPLOYER schedules an interview
 * PATCH /api/applications/:id/interview
 * body: { interviewDate }
 */
router.patch("/:id/interview", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { interviewDate } = req.body;

    if (!id || !interviewDate) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (app.job.employerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your application" });
    }

    // Validate interviewDate format
    const interviewDateObj = new Date(interviewDate);
    if (isNaN(interviewDateObj)) {
      return res.status(400).json({ message: "Invalid interview date" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "INTERVIEW",
        interviewDate: interviewDateObj
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to schedule interview", error: e.message });
  }
});

export default router;
