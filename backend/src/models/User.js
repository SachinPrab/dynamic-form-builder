
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  airtableUserId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  loginTimestamp: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
