import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import invitationsRoutes from "./routes/invitations.routes.js";
import studentsRoutes from "./routes/students.routes.js";
import employersRoutes from "./routes/employers.routes.js"; 
import savedJobsRoutes from "./routes/savedjobs.routes.js";
import contactRoutes from "./routes/contact.routes.js";


const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
  : true;

app.use(cors({ origin: origins, credentials: true }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/employers", employersRoutes); 
app.use("/api/saved-jobs", savedJobsRoutes);
app.use("/api/contact", contactRoutes);


export default app;
