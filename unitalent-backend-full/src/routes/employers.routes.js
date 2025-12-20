import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/employers/me
 */
router.get("/me", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const employer = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        bin: true,
        companySize: true,
        city: true,
        industry: true,
      },
    });

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.json(employer);
  } catch (e) {
    console.error("GET /api/employers/me error:", e);
    res.status(500).json({ message: "Failed to load employer profile" });
  }
});

/**
 * PUT /api/employers/me
 */
router.put("/me", auth, requireRole("EMPLOYER"), async (req, res) => {
  try {
    const { firstName, lastName, bin, companySize, city, industry } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        bin: bin?.trim() || null,
        companySize: companySize?.trim() || null,
        city: city?.trim() || null,
        industry: industry?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        bin: true,
        companySize: true,
        city: true,
        industry: true,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error("PUT /api/employers/me error:", e);
    res.status(500).json({ message: "Failed to save employer profile" });
  }
});

export default router;
