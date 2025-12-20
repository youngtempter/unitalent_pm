import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const { studentId, jobId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId required" });
    }

    const student = await prisma.user.findUnique({
      where: { id: Number(studentId) },
      select: { id: true, role: true }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ message: "Target user is not a student" });
    }

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: Number(jobId) },
        select: { id: true, employerId: true }
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.employerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: not your job" });
      }
    }

    const invitation = await prisma.invitation.create({
      data: {
        employerId: req.user.id,
        studentId: Number(studentId),
        jobId: jobId ? Number(jobId) : null
      }
    });

    res.status(201).json(invitation);
  } catch (e) {
    res.status(500).json({ message: "Failed to create invitation", error: e.message });
  }
});

router.get("/my", auth, requireRole("STUDENT"), async (req, res) => {
  try {
    const list = await prisma.invitation.findMany({
      where: { studentId: req.user.id },
      include: {
        employer: { select: { id: true, email: true, firstName: true, lastName: true } },
        job: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Failed to load invitations", error: e.message });
  }
});

export default router;
