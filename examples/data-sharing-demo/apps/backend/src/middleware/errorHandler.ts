import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("[Backend Error]", err);

  // Handle validation errors
  if (err.name === "ValidationError") {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: err.message,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};
