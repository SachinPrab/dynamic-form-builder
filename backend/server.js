// backend/server.js
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import airtableRouter from "./src/routes/airtable.js";
import tokenRouter from "./src/routes/token.js";
import formRouter from "./src/routes/form.js";
import responseRouter from "./src/routes/responseRouter.js";
import webhookRouter from "./src/routes/webhookRouter.js";
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", airtableRouter); // /api/bases, /api/tables, etc.
app.use("/oauth", tokenRouter);  // /oauth/token
app.use("/api", formRouter);      // /api/form
app.use("/api/forms", responseRouter); // /api/responses
app.use("/webhooks", webhookRouter); // /webhooks/airtable
// Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
