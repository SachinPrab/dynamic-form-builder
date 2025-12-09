import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET callback - redirect to FRONTEND via API_URL
router.get("/callback", (req, res) => {
  const { code, state } = req.query;
  const FRONTEND_URL = process.env.API_URL || process.env.FRONTEND_URL || "http://localhost:5173"; // frontend host
  const frontendPath = "/oauth/airtable/callback"; // frontend route handled by React Router

  // Redirect to frontend so the SPA can handle the callback
  res.redirect(`${FRONTEND_URL}${frontendPath}?code=${encodeURIComponent(code || "")}&state=${encodeURIComponent(state || "")}`);
});

// Also handle /oauth/airtable/callback coming directly from Airtable for deployments
router.get("/airtable/callback", (req, res) => {
  const { code, state } = req.query;
  const FRONTEND_URL = process.env.API_URL || process.env.FRONTEND_URL || "http://localhost:5173";
  const frontendPath = "/oauth/airtable/callback";

  // If Airtable redirects straight to /oauth/airtable/callback on the backend host,
  // forward the user to the frontend callback route so the SPA can complete the flow.
  res.redirect(`${FRONTEND_URL}${frontendPath}?code=${encodeURIComponent(code || "")}&state=${encodeURIComponent(state || "")}`);
});

// POST token exchange (unchanged)
router.post("/token", async (req, res) => {
  const { code, code_verifier } = req.body;
  
  try {
    if (!code || !code_verifier) return res.status(400).json({ error: "Code and code_verifier are required" });

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CLIENT_ID || process.env.VITE_CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET || process.env.VITE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      code_verifier,
    });

    const tokenResponse = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Airtable token error:", tokenData);
      return res.status(400).json({ error: tokenData.error || "Token exchange failed", details: tokenData });
    }

    const profileResponse = await fetch("https://api.airtable.com/v0/meta/whoami", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    const savedUser = await User.findOneAndUpdate(
      { airtableUserId: profile.id },
      {
        airtableUserId: profile.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        loginTimestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, user: savedUser });
  } catch (err) {
    console.error("Token error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
