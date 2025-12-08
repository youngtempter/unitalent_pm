import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    // Validation: name required, min 2 chars
    const nameTrimmed = name ? String(name).trim() : "";
    if (!nameTrimmed || nameTrimmed.length < 2) {
      return res.status(400).json({ message: "Name is required and must be at least 2 characters." });
    }

    // Validation: email required, valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailTrimmed = email ? String(email).trim() : "";
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Validation: message required, min 10 chars
    const messageTrimmed = message ? String(message).trim() : "";
    if (!messageTrimmed || messageTrimmed.length < 10) {
      return res.status(400).json({ message: "Message should be at least 10 characters." });
    }

    // Save to database
    await prisma.contactMessage.create({
      data: {
        name: nameTrimmed,
        email: emailTrimmed,
        message: messageTrimmed
      }
    });

    return res.status(201).json({ ok: true, message: "Message received" });
  } catch (e) {
    console.error("Contact form error:", e);
    return res.status(500).json({ message: "Failed to save message. Please try again." });
  }
});

export default router;



