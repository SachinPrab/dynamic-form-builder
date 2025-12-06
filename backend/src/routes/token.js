// routes/token.js (or wherever your token route lives)

import express from "express";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// POST /oauth/token
router.post("/token", async (req, res) => {
  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "Missing code or code_verifier" });
  }

  try {
    // Exchange authorization code for tokens using PKCE + Confidential client (recommended)
    const tokenResponse = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // This is the proper way for confidential clients
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        code_verifier,
        // DO NOT send client_id or client_secret in body when using Basic Auth header
      }),
    });

    const tokenData = await tokenResponse.json();

    // Log for debugging (you can remove later)
    console.log("Airtable token status:", tokenResponse.status);
    console.log("Airtable token response:", tokenData);

    if (!tokenResponse.ok || tokenData.error) {
      return res.status(tokenResponse.status || 400).json({
        error: tokenData.error || "Token exchange failed",
        details: tokenData,
      });
    }

    // Fetch user profile to get Airtable user ID
    const profileResponse = await fetch("https://api.airtable.com/v0/meta/whoami", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      return res.status(profileResponse.status).json(profileData);
    }

    // Save or update user in MongoDB
    const updatedUser = await User.findOneAndUpdate(
    { airtableUserId: profileData.id },
{
  airtableUserId: profileData.id,
  accessToken: tokenData.access_token,
  refreshToken: tokenData.refresh_token,
  loginTimestamp: new Date(),
},

    );

    res.json({
      success: true,
      user: updatedUser,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;