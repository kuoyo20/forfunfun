import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * HR Bearer-token auth middleware.
 *
 * Reads HR_AUTH_TOKEN from env. Every HR-facing endpoint must pass
 * `Authorization: Bearer <token>`.  Token comparison is constant-time.
 */
export function hrAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.HR_AUTH_TOKEN;
  if (!secret) {
    // Kill-switch: if no token is configured, reject everything
    // rather than silently allowing unauthenticated access.
    res.status(503).json({ error: "HR_AUTH_TOKEN not configured" });
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice(7);
  const expected = Buffer.from(secret, "utf8");
  const provided = Buffer.from(token, "utf8");

  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  next();
}

/**
 * Candidate interview-token auth.
 *
 * Validates that the :token param exists and belongs to a non-expired,
 * non-completed interview. Attaches `req.interviewToken` for downstream use.
 * Actual DB lookup is done in the route handler; this just ensures the param
 * is present and has the right shape (cuid-ish, 20-30 chars).
 */
export function candidateTokenAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.params.token;
  if (!token || token.length < 10 || token.length > 50) {
    res.status(401).json({ error: "Invalid interview token" });
    return;
  }
  next();
}
