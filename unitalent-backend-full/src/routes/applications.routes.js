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

    // Check if application deadline has passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return res.status(400).json({ message: "Application deadline has passed for this job" });
    }

    const existing = await prisma.application.findFirst({
      where: { jobId, studentId: req.user.id }
    });

    if (existing) {
      return res.status(409).json({ 
        message: "You have already applied to this job. Each student can only apply once per job posting." 
      });
    }

    const app = await prisma.application.create({
      data: {
        jobId,
        studentId: req.user.id
      }
    });

    // Log initial status
    await prisma.applicationLog.create({
      data: {
        applicationId: app.id,
        status: "APPLIED",
        changedBy: req.user.id,
        notes: "Application submitted"
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
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            university: true,
            major: true,
            studyYear: true,
            city: true,
            skills: true,
            github: true,
            linkedin: true,
            portfolio: true
          }
        }
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
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            university: true,
            major: true,
            studyYear: true,
            city: true,
            skills: true,
            github: true,
            linkedin: true,
            portfolio: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: "Failed to load employer applications", error: e.message });
  }
});

/**
 * ✅ STUDENT withdraws application
 * DELETE /api/applications/:id
 */
router.delete("/:id", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (app.studentId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your application" });
    }

    // Only allow withdrawal for certain statuses
    const withdrawableStatuses = ["APPLIED", "IN_REVIEW"];
    if (!withdrawableStatuses.includes(app.status)) {
      return res.status(400).json({ 
        message: `Cannot withdraw application with status: ${app.status}. Only applications with status APPLIED or IN_REVIEW can be withdrawn.` 
      });
    }

    // Delete application (cascade will handle logs)
    await prisma.application.delete({
      where: { id }
    });

    res.json({ message: "Application withdrawn successfully" });
  } catch (e) {
    res.status(500).json({ message: "Failed to withdraw application", error: e.message });
  }
});

/**
 * ✅ EMPLOYER updates application status
 * PATCH /api/applications/:id
 * body: { status, interviewDate? }
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

    const oldStatus = app.status;
    const newStatus = String(status).trim();

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: newStatus,
        interviewDate: interviewDate || app.interviewDate
      }
    });

    // Log status change if it changed
    if (oldStatus !== newStatus) {
      await prisma.applicationLog.create({
        data: {
          applicationId: id,
          status: newStatus,
          changedBy: req.user.id,
          notes: `Status changed from ${oldStatus} to ${newStatus}`
        }
      });
    }

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

    const appBefore = await prisma.application.findUnique({ where: { id } });
    const oldStatus = appBefore?.status || "APPLIED";

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "INTERVIEW",
        interviewDate: interviewDateObj
      }
    });

    // Log status change
    await prisma.applicationLog.create({
      data: {
        applicationId: id,
        status: "INTERVIEW",
        changedBy: req.user.id,
        notes: `Interview scheduled for ${interviewDateObj.toISOString()}`
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to schedule interview", error: e.message });
  }
});

/**
 * ✅ STUDENT cancels interview
 * PATCH /api/applications/:id/interview/cancel
 */
router.patch("/:id/interview/cancel", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app || app.studentId !== req.user.id) {
      return res.status(404).json({ message: "Application not found" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        interviewDate: null,
        status: "APPLIED"
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to cancel interview", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: Get all scheduled interviews
 * GET /api/applications/employer/interviews
 */
router.get("/employer/interviews", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const interviews = await prisma.application.findMany({
      where: {
        interviewDate: { not: null },
        job: { employerId: req.user.id }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            university: true,
            major: true,
            city: true,
            skills: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            workMode: true
          }
        }
      },
      orderBy: { interviewDate: "asc" }
    });

    res.json(interviews);
  } catch (e) {
    res.status(500).json({ message: "Failed to load interviews", error: e.message });
  }
});

/**
 * ✅ STUDENT: Get upcoming interviews count
 * GET /api/applications/my/interviews/upcoming/count
 */
router.get("/my/interviews/upcoming/count", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const now = new Date();
    const count = await prisma.application.count({
      where: {
        studentId: req.user.id,
        interviewDate: { gte: now }
      }
    });

    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "Failed to count upcoming interviews", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: Get upcoming interviews count
 * GET /api/applications/employer/interviews/upcoming/count
 */
router.get("/employer/interviews/upcoming/count", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const now = new Date();
    const count = await prisma.application.count({
      where: {
        interviewDate: { gte: now },
        job: { employerId: req.user.id }
      }
    });

    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "Failed to count upcoming interviews", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: Get hiring funnel stats
 * GET /api/applications/employer/funnel
 */
router.get("/employer/funnel", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const whereBase = { job: { employerId: req.user.id } };

    // Total applications received (all statuses)
    const applicationsReceived = await prisma.application.count({
      where: whereBase
    });

    // In review: status = APPLIED OR IN_REVIEW
    const inReview = await prisma.application.count({
      where: {
        ...whereBase,
        status: { in: ["APPLIED", "IN_REVIEW"] }
      }
    });

    // Interviews: status = INTERVIEW OR interviewDate IS NOT NULL
    const interviews = await prisma.application.count({
      where: {
        ...whereBase,
        OR: [
          { status: "INTERVIEW" },
          { interviewDate: { not: null } }
        ]
      }
    });

    // Offers made: status = OFFERED
    const offersMade = await prisma.application.count({
      where: {
        ...whereBase,
        status: "OFFERED"
      }
    });

    res.json({
      applicationsReceived,
      inReview,
      interviews,
      offersMade
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to load funnel stats", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: Send offer to applicant
 * PATCH /api/applications/:id/offer
 */
router.patch("/:id/offer", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid application id" });
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

    const appBefore = await prisma.application.findUnique({ where: { id } });
    const oldStatus = appBefore?.status || "APPLIED";

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "OFFERED"
      }
    });

    // Log status change
    await prisma.applicationLog.create({
      data: {
        applicationId: id,
        status: "OFFERED",
        changedBy: req.user.id,
        notes: "Job offer sent to applicant"
      }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Failed to send offer", error: e.message });
  }
});

/**
 * ✅ EMPLOYER: Bulk update applications
 * PATCH /api/applications/bulk
 * body: { applicationIds: [1,2,3], status: "REJECTED" } or { ids: [1,2,3], status: "REJECTED" }
 */
router.patch("/bulk", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const { applicationIds, ids, status } = req.body;
    
    // Accept both applicationIds and ids for compatibility
    const idArray = applicationIds || ids;

    if (!Array.isArray(idArray) || idArray.length === 0) {
      return res.status(400).json({ message: "No applications selected" });
    }

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const validApplicationIds = idArray.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
    
    if (validApplicationIds.length === 0) {
      return res.status(400).json({ message: "No applications selected" });
    }

    // Verify all applications belong to this employer
    const apps = await prisma.application.findMany({
      where: {
        id: { in: validApplicationIds }
      },
      include: { job: true }
    });

    const invalidApps = apps.filter(app => app.job.employerId !== req.user.id);
    if (invalidApps.length > 0) {
      return res.status(403).json({ message: "Some applications do not belong to you" });
    }

    // Update all applications
    const updated = await prisma.application.updateMany({
      where: {
        id: { in: validApplicationIds }
      },
      data: {
        status: String(status).trim()
      }
    });

    // Log status changes for each application
    const logPromises = apps.map(app => {
      if (app.status !== status) {
        return prisma.applicationLog.create({
          data: {
            applicationId: app.id,
            status: String(status).trim(),
            changedBy: req.user.id,
            notes: `Bulk status update from ${app.status} to ${status}`
          }
        });
      }
      return Promise.resolve();
    });

    await Promise.all(logPromises);

    res.json({ 
      message: `Updated ${updated.count} application(s)`,
      count: updated.count 
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to bulk update", error: e.message });
  }
});

/**
 * ✅ Get application status history
 * GET /api/applications/:id/logs
 */
router.get("/:id/logs", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check permissions: student can see their own, employer can see their job's applications
    const isStudent = req.user.role === "STUDENT" && app.studentId === req.user.id;
    const isEmployer = req.user.role === "EMPLOYER" && app.job.employerId === req.user.id;

    if (!isStudent && !isEmployer) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const logs = await prisma.applicationLog.findMany({
      where: { applicationId: id },
      include: {
        application: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: "Failed to load logs", error: e.message });
  }
});

export default router;
