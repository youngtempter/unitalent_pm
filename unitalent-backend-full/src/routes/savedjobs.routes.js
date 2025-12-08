import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/saved-jobs
 * body: { jobId }
 *
 * ✅ Idempotent save with upsert
 * ✅ Handles:
 *  - Already saved (no error)
 *  - Job not found (P2003)
 */
router.post("/", auth, requireRole("STUDENT"), async (req, res) => {
  const jobId = Number(req.body.jobId);

  if (!jobId) {
    return res.status(400).json({ message: "jobId required" });
  }

  try {
    const saved = await prisma.savedJob.upsert({
      where: {
        studentId_jobId: {
          studentId: req.user.id,
          jobId
        }
      },
      update: {},
      create: {
        studentId: req.user.id,
        jobId
      }
    });

    return res.status(201).json(saved);
  } catch (e) {
    // Foreign key violation -> job doesn't exist
    if (e.code === "P2003") {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(500).json({
      message: "Failed to save",
      error: e.message
    });
  }
});

/**
 * DELETE /api/saved-jobs/:jobId
 *
 * ✅ Removes saved job
 * ✅ Handles:
 *  - Not in saved list (P2025)
 */
router.delete("/:jobId", auth, requireRole("STUDENT"), async (req, res) => {
  const jobId = Number(req.params.jobId);

  if (!jobId) {
    return res.status(400).json({ message: "jobId required" });
  }

  try {
    await prisma.savedJob.delete({
      where: {
        studentId_jobId: {
          studentId: req.user.id,
          jobId
        }
      }
    });

    return res.json({ message: "Removed from saved" });
  } catch (e) {
    // Record not found
    if (e.code === "P2025") {
      return res.status(404).json({ message: "Not in saved list" });
    }

    return res.status(500).json({
      message: "Failed to unsave",
      error: e.message
    });
  }
});

/**
 * GET /api/saved-jobs/my
 *
 * ✅ Returns saved jobs of current student
 */
router.get("/my", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const list = await prisma.savedJob.findMany({
      where: { studentId: req.user.id },
      include: { job: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(list);
  } catch (e) {
    return res.status(500).json({
      message: "Failed to load saved jobs",
      error: e.message
    });
  }
});

export default router;
