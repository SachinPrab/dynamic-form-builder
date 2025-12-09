import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import airtableRouter from "./src/routes/airtable.js";
import tokenRouter from "./src/routes/token.js";
import formRouter from "./src/routes/form.js";
import responseRouter from "./src/routes/responseRouter.js";
import webhookRouter from "./src/routes/webhookRouter.js";

const app = express();

// Environment
const FRONTEND_URL = process.env.FRONTEND_URL || "https://dynamic-form-builder-ab3q.vercel.app";

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", airtableRouter);
app.use("/oauth", tokenRouter);
app.use("/api", formRouter);
app.use("/api/forms", responseRouter);
app.use("/webhooks", webhookRouter);

// Render port binding
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
