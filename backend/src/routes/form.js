// routes/form.js

import express from "express";
import Form from "../models/Form.js";
import User from "../models/User.js";
import Submission from "../models/submissionModel.js"; // Corrected import name convention

const formRouter = express.Router();

// POST /api/form - Create Form from Airtable Table
formRouter.post("/form", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { baseId, tableId, tableName, fields } = req.body;

    if (!baseId || !tableId || !tableName || !fields || fields.length === 0)
      return res.status(400).json({ error: "Missing form data" });

    const questions = fields.map((field) => {
      let rules = null;
      let options = undefined;

      if (field.type === "singleSelect" && field.options?.choices) {
        options = field.options.choices.map((choice) => choice.name);
      }

      if (field.name === "Notes") {
        const statusField = fields.find((f) => f.name === "Status");
        if (statusField) {
          rules = {
            logic: "AND",
            conditions: [
              {
                questionKey: statusField.id,
                operator: "equals",
                value: "In Progress",
              },
            ],
          };
        }
      }

      if (field.name === "Assignee") {
        const statusField = fields.find((f) => f.name === "Status");
        if (statusField) {
          rules = {
            logic: "AND",
            conditions: [
              {
                questionKey: statusField.id,
                operator: "equals",
                value: "In Progress",
              },
            ],
          };
        }
      }

      return {
        questionKey: field.id,
        fieldId: field.id,
        label: field.name,
        type: field.type,
        required: false,
        rules,
        options,
      };
    });

    const form = await Form.create({
      ownerId: userId,
      baseId,
      tableId,
      tableName,
      questions,
    });

    res.json({ success: true, formId: form._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/form/:formId - Fetch Form
formRouter.get("/form/:formId", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ error: "Form not found" });

    res.json({ form });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/form/:formId/submit - Submit Form
formRouter.post("/form/:formId/submit", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { formId } = req.params;
    const { answers } = req.body;

    if (!userId || !answers) {
      return res.status(400).json({ error: "Missing required data" });
    }

    const user = await User.findById(userId);
    const form = await Form.findById(formId);

    if (!user || !form) {
      return res.status(404).json({ error: "User or Form not found" });
    } // REMOVED OLD LOGIC: No longer need to check/initialize form.submissions array
    const accessToken = user.accessToken;
    const baseId = form.baseId;
    const tableName = form.tableName;

    const collaboratorEmailMap = {
      sachin: "sachprab543@gmail.com",
    };

    const airtableFields = {}; // For simple fields (Name, Status, Notes)
    const complexFields = {}; // For complex fields (Assignee, Attachments)

    for (const [questionKey, answerValue] of Object.entries(answers)) {
      const question = form.questions.find(
        (q) => q.questionKey === questionKey
      );

      if (
        question &&
        answerValue !== "" &&
        answerValue !== null &&
        answerValue !== undefined
      ) {
        let cleanValue = answerValue; // Clean up quotes from frontend
        if (typeof cleanValue === "string") {
          while (
            cleanValue.length > 1 &&
            cleanValue.startsWith('"') &&
            cleanValue.endsWith('"')
          ) {
            cleanValue = cleanValue.substring(1, cleanValue.length - 1);
          }
        } // Handle Collaborator field
        if (
          question.type === "multipleCollaborators" ||
          question.type === "singleCollaborator"
        ) {
          if (typeof cleanValue === "string" && cleanValue) {
            const mapKey = cleanValue.toLowerCase();
            const mappedEmail = collaboratorEmailMap[mapKey];
            if (mappedEmail) {
              complexFields[question.label] = { email: mappedEmail };
            } else {
              console.warn(
                `Collaborator name "${cleanValue}" not found in map. Field will be skipped.`
              );
            }
            continue; // Skip final assignment
          }
        } // Handle Multiple Select fields
        else if (
          question.type === "multipleSelects" &&
          typeof cleanValue === "string"
        ) {
          cleanValue = [cleanValue];
        } // Handle Attachments field
        else if (question.type === "multipleAttachments") {
          if (typeof cleanValue === "string" && cleanValue.startsWith("http")) {
            complexFields[question.label] = [{ url: cleanValue }];
          } else {
            console.warn(`Attachments field received invalid data. Skipping.`);
          }
          continue; // Skip final assignment
        }

        if (cleanValue !== null) {
          airtableFields[question.label] = cleanValue;
        }
      }
    } // Check if any fields were successfully processed

    if (
      Object.keys(airtableFields).length === 0 &&
      Object.keys(complexFields).length === 0
    ) {
      return res.status(400).json({
        error: "No valid answers provided for submission.",
      });
    } // Merge simple fields and complex fields into the final payload
    const finalAirtablePayload = {
      ...airtableFields,
      ...complexFields,
    };
    console.log(
      "Airtable Payload Fields:",
      JSON.stringify(finalAirtablePayload, null, 2)
    );

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          records: [{ fields: finalAirtablePayload }],
        }),
      }
    );

    const airtableData = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error("Airtable API Error:", airtableData); // ✅ CORRECTION: Save failed submission to the dedicated Submission collection
      await Submission.create({
        formId: formId,
        answers: answers,
        status: "Failed",
        submissionId: null, // No Airtable ID on failure
      }).catch((saveErr) =>
        console.error("Error saving failed submission:", saveErr)
      );
      return res.status(airtableRes.status).json({
        error:
          airtableData.error?.message || "Failed to submit record to Airtable",
        details: airtableData,
      });
    } // 🚀 CORRECTION: Save successful submission to the dedicated Submission collection

    await Submission.create({
      formId: formId,
      answers: answers,
      status: "Success",
      submissionId: airtableData.records[0].id,
    });

    res.json({ success: true, recordId: airtableData.records[0].id });
  } catch (err) {
    console.error("Server error during submission:", err);
    res.status(500).json({ error: "Server error during form submission" });
  }
});

export default formRouter;
