/**
 * Express server for Data Sharing demo backend
 * Handles webhooks from Keyring and serves frontend API
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { webhookRouter } from "./routes/webhooks";
import { sessionRouter } from "./routes/sessions";
import { errorHandler } from "./middleware/errorHandler";
import { partnerRouter } from "./routes/partner";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8001;

// Security middleware
app.use(helmet());

// CORS - allow frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Request logging
app.use(morgan("dev"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "data-sharing-backend",
  });
});

// API routes
app.use("/webhooks", webhookRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/partner", partnerRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhooks/keyring`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});

export default app;
