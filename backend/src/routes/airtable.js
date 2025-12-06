// airtable.js
import express from "express";
import User from "../models/User.js";

const airtableRouter = express.Router();

airtableRouter.get("/test", (req, res) => {
  res.json({ message: "Airtable router is working!" });
});

// GET /api/bases
airtableRouter.get("/bases", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized – no user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = user.accessToken;

    const response = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Failed to fetch bases",
        details: data,
      });
    }

    res.json({ bases: data.bases });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/bases/:baseId/tables
airtableRouter.get("/bases/:baseId/tables", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { baseId } = req.params;

    if (!userId || !baseId) {
      return res.status(401).json({ error: "Unauthorized or missing baseId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = user.accessToken;

    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Failed to fetch tables",
        details: data,
      });
    }

    res.json({ tables: data.tables });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/bases/:baseId/tables/:tableId/fields
airtableRouter.get(
  "/bases/:baseId/tables/:tableId/fields",
  async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];
      const { baseId, tableId } = req.params; // Basic validation

      if (!userId || !baseId || !tableId) {
        return res.status(400).json({
          error: "Missing userId, baseId, or tableId",
        });
      } // Fetch user from DB

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const accessToken = user.accessToken; // Fetch full table metadata

      const metaRes = await fetch(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const metaData = await metaRes.json(); // Airtable returned HTML? (token invalid or endpoint wrong)

      if (!metaRes.ok || !metaData?.tables) {
        return res.status(metaRes.status || 500).json({
          error: "Failed to retrieve table metadata",
          details: metaData,
        });
      } // Find the selected table

      const table = metaData.tables.find((t) => t.id === tableId);

      if (!table) {
        return res.status(404).json({ error: "Table not found in base" });
      } // FIX: Ensure critical 'options' metadata is included for the client

      const fields = table.fields.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        description: f.description || "", // 🎯 FIX: Explicitly include the options object
        options: f.options,
      }));

      return res.json({ fields });
    } catch (err) {
      console.error("Error fetching Airtable fields:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default airtableRouter;
