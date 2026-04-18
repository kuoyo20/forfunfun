import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { extractText } from "./parse.js";
import { sendInterviewInvite } from "./email.js";
import { askInterviewer, generateAIReport } from "./ai.js";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 檔案上傳：使用 memory storage（serverless 友善）
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".txt"];
    const name = file.originalname.toLowerCase();
    const ok = allowed.some((ext) => name.endsWith(ext));
    cb(null, ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ──────────────── 檔案上傳 ────────────────

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "未上傳檔案或格式不支援" });
    return;
  }
  const text = await extractText(req.file.buffer, req.file.originalname);
  res.json({
    fileName: req.file.originalname,
    text,
  });
});

// ──────────────── 建立面試 ────────────────

app.post("/api/interviews", async (req, res) => {
  const {
    position, difficulty, maxQuestions, timeLimitMin, topics,
    resumeText, jdText, resumeFileName, jdFileName,
    candidateName, candidateEmail,
  } = req.body;

  const interview = await prisma.interview.create({
    data: {
      position,
      difficulty,
      maxQuestions: maxQuestions ?? 10,
      timeLimitMin: timeLimitMin ?? 15,
      topics: JSON.stringify(topics ?? []),
      resumeText: resumeText ?? null,
      jdText: jdText ?? null,
      resumeFileName: resumeFileName ?? null,
      jdFileName: jdFileName ?? null,
      candidateName: candidateName ?? null,
      candidateEmail: candidateEmail ?? null,
    },
  });

  res.json(interview);
});

// ──────────────── HR：列出所有面試 ────────────────

app.get("/api/interviews", async (_req, res) => {
  const interviews = await prisma.interview.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(
    interviews.map((i) => ({
      ...i,
      topics: JSON.parse(i.topics),
      report: i.report ? JSON.parse(i.report) : null,
    }))
  );
});

// ──────────────── HR：取得單一面試 ────────────────

app.get("/api/interviews/:id", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.params.id },
  });
  if (!interview) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }
  res.json({
    ...interview,
    topics: JSON.parse(interview.topics),
    messages: interview.messages ? JSON.parse(interview.messages) : [],
    report: interview.report ? JSON.parse(interview.report) : null,
  });
});

// ──────────────── 候選人：透過 token 取得面試 ────────────────

app.get("/api/interview/:token", async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { token: req.params.token },
  });
  if (!interview) {
    res.status(404).json({ error: "無效的面試連結" });
    return;
  }
  res.json({
    id: interview.id,
    position: interview.position,
    difficulty: interview.difficulty,
    maxQuestions: interview.maxQuestions,
    timeLimitMin: interview.timeLimitMin,
    topics: JSON.parse(interview.topics),
    status: interview.status,
    candidateName: interview.candidateName,
    resumeText: interview.resumeText,
    jdText: interview.jdText,
  });
});

// ──────────────── 更新面試（存對話/報告） ────────────────

app.put("/api/interviews/:id", async (req, res) => {
  const { status, messages, report, durationSec } = req.body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (messages) data.messages = JSON.stringify(messages);
  if (report) data.report = JSON.stringify(report);
  if (durationSec !== undefined) data.durationSec = durationSec;
  if (status === "completed") data.completedAt = new Date();

  const interview = await prisma.interview.update({
    where: { id: req.params.id },
    data,
  });
  res.json(interview);
});

// ──────────────── 刪除面試 ────────────────

app.delete("/api/interviews/:id", async (req, res) => {
  await prisma.interview.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ──────────────── 寄送邀請 Email ────────────────

app.post("/api/email/send-invite", async (req, res) => {
  const { interviewId } = req.body;

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });
  if (!interview) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }
  if (!interview.candidateEmail) {
    res.status(400).json({ error: "候選人沒有 email" });
    return;
  }

  const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const link = `${baseUrl}/interview/${interview.token}`;

  const sent = await sendInterviewInvite({
    to: interview.candidateEmail,
    candidateName: interview.candidateName ?? "候選人",
    position: interview.position,
    link,
  });

  if (sent) {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { emailSent: true },
    });
    res.json({ ok: true, link });
  } else {
    res.json({ ok: false, link, message: "Email 發送失敗，但你可以手動複製連結" });
  }
});

// ──────────────── AI：產生下一題 ────────────────

app.post("/api/ai/chat", async (req, res) => {
  const { interviewId, messages } = req.body;

  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }

  try {
    const reply = await askInterviewer({
      config: {
        position: interview.position,
        difficulty: interview.difficulty,
        topics: JSON.parse(interview.topics),
        maxQuestions: interview.maxQuestions,
        timeLimitMin: interview.timeLimitMin,
      },
      messages,
      resumeText: interview.resumeText,
      jdText: interview.jdText,
    });
    res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "AI 回應失敗" });
  }
});

// ──────────────── AI：產生面試報告 ────────────────

app.post("/api/ai/report", async (req, res) => {
  const { interviewId, messages, durationSec } = req.body;

  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }

  try {
    const report = await generateAIReport({
      config: {
        position: interview.position,
        difficulty: interview.difficulty,
        topics: JSON.parse(interview.topics),
        maxQuestions: interview.maxQuestions,
        timeLimitMin: interview.timeLimitMin,
      },
      messages,
      durationSec,
      resumeText: interview.resumeText,
      jdText: interview.jdText,
    });

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "completed",
        messages: JSON.stringify(messages),
        report: JSON.stringify(report),
        durationSec,
        completedAt: new Date(),
      },
    });

    res.json(report);
  } catch (err) {
    console.error("AI report error:", err);
    res.status(500).json({ error: "報告產生失敗" });
  }
});

export default app;
