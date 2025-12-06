// controllers/formController.js

import Submission from "../models/submissionModel.js";

export const getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({ error: "Missing formId" });
    }

    const submissions = await Submission.find(
      { formId },
      {
        _id: 1,
        createdAt: 1,
        status: 1,
        answers: 1
      }
    ).sort({ createdAt: -1 });

    const compact = submissions.map(sub => ({
      submissionId: sub._id,
      createdAt: sub.createdAt,
      status: sub.status || "submitted",
      preview: getPreview(sub.answers),
    }));

    res.json({ responses: compact });

  } catch (error) {
    console.error("GET /responses error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


function getPreview(answers) {
  if (!answers) return "";
  const keys = Object.keys(answers);
  const values = keys.map(k => answers[k]).slice(0, 2); // pick first 2 answers
  return values.join(" | ");
}
