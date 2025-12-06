import express from "express";
import { getFormResponses } from "../controllers/formController.js";

const responseRouter = express.Router();

// GET /forms/:formId/responses
responseRouter.get("/:formId/responses", getFormResponses);

export default responseRouter;
