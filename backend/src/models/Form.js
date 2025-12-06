// models/Form.js
import mongoose from "mongoose";

const ConditionSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  operator: {
    type: String,
    enum: ["equals", "notEquals", "contains"],
    required: true,
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

const ConditionalRulesSchema = new mongoose.Schema({
  logic: { type: String, enum: ["AND", "OR"], required: true },
  conditions: [ConditionSchema],
});

const QuestionSchema = new mongoose.Schema({
  questionKey: { type: String, required: true }, // internal identifier (Airtable field id)
  fieldId: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true }, // Airtable type
  required: { type: Boolean, default: false },
  rules: { type: ConditionalRulesSchema, default: null }, // 🎯 FIX: Added options to store select choices
  options: { type: [String], default: undefined },
});

const FormSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    baseId: { type: String, required: true },
    tableId: { type: String, required: true },
    tableName: { type: String, required: true }, // 🎯 FIX: Store table name for Airtable POST
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Form", FormSchema);
