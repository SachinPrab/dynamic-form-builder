// routes/webhookRouter.js

import express from "express";
import { handleAirtableWebhook } from "../controllers/webhookController.js";

const webhookRouter = express.Router();

// POST /webhooks/airtable
webhookRouter.post("/airtable", handleAirtableWebhook);

export default webhookRouter;