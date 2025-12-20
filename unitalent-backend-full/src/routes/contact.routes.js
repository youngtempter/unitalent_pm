import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    const nameTrimmed = name ? String(name).trim() : "";
    if (!nameTrimmed || nameTrimmed.length < 2) {
      return res.status(400).json({ message: "Name is required and must be at least 2 characters." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailTrimmed = email ? String(email).trim() : "";
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const messageTrimmed = message ? String(message).trim() : "";
    if (!messageTrimmed || messageTrimmed.length < 10) {
      return res.status(400).json({ message: "Message should be at least 10 characters." });
    }

    const savedMessage = await prisma.contactMessage.create({
      data: {
        name: nameTrimmed,
        email: emailTrimmed,
        message: messageTrimmed
      }
    });

    console.log("Contact message saved successfully:", { id: savedMessage.id, email: emailTrimmed });

    return res.status(201).json({ ok: true, message: "Message received" });
  } catch (e) {
    console.error("Contact form error:", e);
    console.error("Error details:", {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    
    if (e.code === 'P2002') {
      return res.status(409).json({ message: "A message with this email already exists." });
    }
    if (e.code === 'P2025') {
      return res.status(404).json({ message: "Database record not found." });
    }
    if (e.message && e.message.includes('Unknown model')) {
      return res.status(500).json({ 
        message: "Database configuration error. Please ensure Prisma client is generated." 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to save message. Please try again.",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

export default router;



