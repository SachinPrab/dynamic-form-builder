// models/submissionModel.js

import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  submissionId: { type: String, required: false }, // Stores the Airtable record ID
  answers: { type: Object, required: true },
  status: { type: String, default: "submitted" },
  // ✅ New field to flag deletion
  deletedInAirtable: { type: Boolean, default: false }, 
}, {
  timestamps: true,
});

export default mongoose.model("Submission", submissionSchema);