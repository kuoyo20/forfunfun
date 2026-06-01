import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

let app: Express;
const VALID_TOKEN = "test-secret-token-12345";

beforeAll(async () => {
  process.env.HR_AUTH_TOKEN = VALID_TOKEN;
  process.env.AI_ENABLED = "false"; // don't burn Anthropic credits in tests
  // Dynamic import so env vars are set before app initializes
  const mod = await import("../server/app.js");
  app = mod.default;
});

describe("A) 無 auth → 401", () => {
  it("GET /api/interviews without auth → 401", async () => {
    const res = await request(app).get("/api/interviews");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing|Invalid/);
  });

  it("POST /api/ai/chat without auth → 401 or 503", async () => {
    // AI endpoints don't require hrAuth (candidate uses them), but
    // AI_ENABLED=false → 503
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ interviewId: "test", messages: [] });
    // Should be 503 because AI_ENABLED=false
    expect(res.status).toBe(503);
    expect(res.body.error).toContain("AI");
  });

  it("POST /api/upload without auth → 401", async () => {
    const res = await request(app).post("/api/upload");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/interviews/fake without auth → 401", async () => {
    const res = await request(app).delete("/api/interviews/fake");
    expect(res.status).toBe(401);
  });
});

describe("B) 錯 auth → 401", () => {
  it("GET /api/interviews with wrong token → 401", async () => {
    const res = await request(app)
      .get("/api/interviews")
      .set("Authorization", "Bearer wrong-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid/);
  });

  it("POST /api/interviews with wrong token → 401", async () => {
    const res = await request(app)
      .post("/api/interviews")
      .set("Authorization", "Bearer nope")
      .send({ position: "test" });
    expect(res.status).toBe(401);
  });
});

describe("C) 對 auth → passes middleware (not 401)", () => {
  it("GET /api/interviews with valid token passes auth (may 500 without DB, but NOT 401)", async () => {
    const res = await request(app)
      .get("/api/interviews")
      .set("Authorization", `Bearer ${VALID_TOKEN}`);
    // Without a real DB, Prisma throws → 500. The key assertion:
    // valid auth must NOT return 401.
    expect(res.status).not.toBe(401);
  });

  it("POST /api/upload with valid token + no file → 400 (not 401)", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${VALID_TOKEN}`);
    expect(res.status).toBe(400); // "未上傳檔案" — auth passed
  });
});

describe("D) 檔案大小限制", () => {
  it("POST /api/upload >10MB → rejected (not 200)", async () => {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, "a");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .attach("file", bigBuffer, "big.txt");
    expect([400, 413, 500]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});
