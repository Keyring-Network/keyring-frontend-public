/**
 * Partner routes for frontend API
 * Allows frontend to query partner info
 */

import { Router, Request, Response } from "express";
import { sessionStore } from "../services/sessionStore";

const router: Router = Router();

/**
 * GET /api/partner/
 * Get partner info
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const keyringApiUrl = process.env.KEYRING_API_URL;
    const keyringApiKey = process.env.KEYRING_API_KEY;

    if (!keyringApiUrl || !keyringApiKey) {
      return res.status(500).json({
        error: "Server configuration error: Missing Keyring API credentials",
      });
    }

    const response = await fetch(`${keyringApiUrl}/data-sharing/partner`, {
      method: "GET",
      headers: {
        "x-api-key": keyringApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Keyring API error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Error fetching partner info:", error);
    return res.status(500).json({
      error: "Failed to fetch partner information",
    });
  }
});

export { router as partnerRouter };
