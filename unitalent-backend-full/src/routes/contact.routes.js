import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!message || String(message).trim().length < 10) {
    return res.status(400).json({ message: "Message should be at least 10 characters." });
  }

  // MVP storage: log to server. Swap with DB or email later.
  console.log("[CONTACT]", {
    name: String(name).trim(),
    email: String(email).trim(),
    message: String(message).trim()
  });

  return res.status(201).json({ message: "Thanks! We received your message." });
});

export default router;



