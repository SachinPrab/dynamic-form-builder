import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET callback - redirect to FRONTEND via API_URL
router.get("/callback", (req, res) => {
  const { code, state } = req.query;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";  // Backend API
  const frontendPath = "/callback";  // Frontend route
  
  // Redirect to frontend via API proxy or directly
  res.redirect(`${API_URL}${frontendPath}?code=${code}&state=${state}`);
});

// POST token exchange (unchanged)
router.post("/token", async (req, res) => {
  const { code, code_verifier } = req.body;
  
  try {
    const tokenResponse = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        code_verifier
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return res.status(400).json({ error: tokenData.error || "Token exchange failed" });
    }

    const profileResponse = await fetch("https://api.airtable.com/v0/meta/whoami", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    const profile = await profileResponse.json();
    const user = await User.findOneAndUpdate(
      { airtableUserId: profile.id },
      { 
        airtableUserId: profile.id, 
        accessToken: tokenData.access_token, 
        refreshToken: tokenData.refresh_token 
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    console.error("Token error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
