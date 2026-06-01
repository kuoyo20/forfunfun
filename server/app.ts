import express from "express";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { extractText } from "./parse.js";
import { sendInterviewInvite, sendHRNotification, sendPassNotification, sendFailNotification } from "./email.js";
import { askInterviewer, generateAIReport, extractFromDocs, previewQuestions } from "./ai.js";
import { hrAuth, candidateTokenAuth } from "./auth.js";

// Lazy-init PrismaClient so tests without a real DB can still load the module
let _prisma: PrismaClient | null = null;
function prisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}
const app = express();

// ──────── CORS: production 限制 origin ────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : undefined; // undefined = allow all (dev)

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "10mb" }));

// ──────── Rate limiting ────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "請求過於頻繁，請稍後再試" },
});
app.use(globalLimiter);

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI 請求過於頻繁，請 10 分鐘後再試" },
});

// ──────── AI kill-switch ────────
function aiEnabled(_req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (process.env.AI_ENABLED === "false") {
    res.status(503).json({ error: "AI 功能暫時停用" });
    return;
  }
  next();
}

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

app.post("/api/upload", hrAuth, upload.single("file"), async (req, res) => {
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

app.post("/api/interviews", hrAuth, async (req, res) => {
  const {
    position, difficulty, maxQuestions, timeLimitMin, perQuestionSec, linkValidDays, topics,
    resumeText, jdText, resumeFileName, jdFileName,
    candidateName, candidateEmail,
  } = req.body;

  const validDays = linkValidDays ?? 7;
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  const interview = await prisma().interview.create({
    data: {
      position,
      difficulty,
      maxQuestions: maxQuestions ?? 10,
      timeLimitMin: timeLimitMin ?? 15,
      perQuestionSec: perQuestionSec ?? 180,
      linkValidDays: validDays,
      topics: JSON.stringify(topics ?? []),
      resumeText: resumeText ?? null,
      jdText: jdText ?? null,
      resumeFileName: resumeFileName ?? null,
      jdFileName: jdFileName ?? null,
      candidateName: candidateName ?? null,
      candidateEmail: candidateEmail ?? null,
      expiresAt,
    },
  });

  res.json(interview);
});

// ──────────────── HR：列出所有面試 ────────────────

app.get("/api/interviews", hrAuth, async (_req, res) => {
  const interviews = await prisma().interview.findMany({
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

app.get("/api/interviews/:id", hrAuth, async (req, res) => {
  const interview = await prisma().interview.findUnique({
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

app.get("/api/interview/:token", candidateTokenAuth, async (req, res) => {
  const interview = await prisma().interview.findUnique({
    where: { token: req.params.token },
  });
  if (!interview) {
    res.status(404).json({ error: "無效的面試連結" });
    return;
  }

  // 檢查是否已過期
  if (interview.expiresAt && interview.expiresAt.getTime() < Date.now()) {
    // 自動將狀態更新為 expired（如果尚未完成）
    if (interview.status !== "completed" && interview.status !== "expired") {
      await prisma().interview.update({
        where: { id: interview.id },
        data: { status: "expired" },
      });
    }
    res.status(410).json({ error: "此面試連結已過期" });
    return;
  }

  res.json({
    id: interview.id,
    position: interview.position,
    difficulty: interview.difficulty,
    maxQuestions: interview.maxQuestions,
    timeLimitMin: interview.timeLimitMin,
    perQuestionSec: interview.perQuestionSec,
    topics: JSON.parse(interview.topics),
    status: interview.status,
    candidateName: interview.candidateName,
    resumeText: interview.resumeText,
    jdText: interview.jdText,
  });
});

// ──────────────── 更新面試（存對話/報告） ────────────────

app.put("/api/interviews/:id", hrAuth, async (req, res) => {
  const { status, messages, report, durationSec } = req.body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (messages) data.messages = JSON.stringify(messages);
  if (report) data.report = JSON.stringify(report);
  if (durationSec !== undefined) data.durationSec = durationSec;
  if (status === "completed") data.completedAt = new Date();

  const interview = await prisma().interview.update({
    where: { id: req.params.id },
    data,
  });
  res.json(interview);
});

// ──────────────── 刪除面試 ────────────────

app.delete("/api/interviews/:id", hrAuth, async (req, res) => {
  await prisma().interview.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ──────────────── 寄送邀請 Email ────────────────

app.post("/api/email/send-invite", hrAuth, async (req, res) => {
  const { interviewId } = req.body;

  const interview = await prisma().interview.findUnique({
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
    await prisma().interview.update({
      where: { id: interviewId },
      data: { emailSent: true },
    });
    res.json({ ok: true, link });
  } else {
    res.json({ ok: false, link, message: "Email 發送失敗，但你可以手動複製連結" });
  }
});

// ──────────────── AI：產生下一題 ────────────────

app.post("/api/ai/chat", aiLimiter, aiEnabled, async (req, res) => {
  const { interviewId, messages } = req.body;
  if (!interviewId) {
    res.status(400).json({ error: "Missing interviewId" });
    return;
  }

  const interview = await prisma().interview.findUnique({ where: { id: interviewId } });
  if (!interview || interview.status === "expired") {
    res.status(404).json({ error: "面試不存在或已過期" });
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
    console.error("AI chat error:", (err as Error).message);
    res.status(500).json({ error: "AI 回應失敗" });
  }
});

// ──────────────── AI：產生面試報告 ────────────────

app.post("/api/ai/report", aiLimiter, aiEnabled, async (req, res) => {
  const { interviewId, messages, durationSec } = req.body;

  const interview = await prisma().interview.findUnique({ where: { id: interviewId } });
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

    await prisma().interview.update({
      where: { id: interviewId },
      data: {
        status: "completed",
        messages: JSON.stringify(messages),
        report: JSON.stringify(report),
        durationSec,
        completedAt: new Date(),
      },
    });

    // 自動寄報告通知給 HR（背景執行，不阻擋回應）
    const hrEmail = process.env.HR_NOTIFICATION_EMAIL;
    if (hrEmail) {
      const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
      sendHRNotification({
        hrEmail,
        candidateName: interview.candidateName ?? "候選人",
        position: interview.position,
        score: report.overallScore,
        reportLink: `${baseUrl}/report/${interviewId}`,
      }).catch(() => {});
    }

    res.json(report);
  } catch (err) {
    console.error("AI report error:", (err as Error).message);
    res.status(500).json({ error: "報告產生失敗" });
  }
});

// ──────────────── HR 決策 ────────────────

app.post("/api/interviews/:id/decision", hrAuth, async (req, res) => {
  const { decision, sendEmail = true } = req.body; // "pass" | "fail" | "pending"
  if (!["pass", "fail", "pending"].includes(decision)) {
    res.status(400).json({ error: "無效的決策值" });
    return;
  }

  const existing = await prisma().interview.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }

  const interview = await prisma().interview.update({
    where: { id: req.params.id },
    data: { decision },
  });

  // 自動寄通知給候選人：限 pass/fail，且尚未通知過，且有 email
  let emailSent = false;
  if (
    sendEmail &&
    (decision === "pass" || decision === "fail") &&
    !existing.candidateNotifiedAt &&
    interview.candidateEmail
  ) {
    const emailFn = decision === "pass" ? sendPassNotification : sendFailNotification;
    emailSent = await emailFn({
      to: interview.candidateEmail,
      candidateName: interview.candidateName ?? "您",
      position: interview.position,
      companyName: process.env.COMPANY_NAME,
    });

    if (emailSent) {
      await prisma().interview.update({
        where: { id: req.params.id },
        data: {
          candidateNotifiedAt: new Date(),
          candidateNotifiedDecision: decision,
        },
      });
    }
  }

  res.json({
    ok: true,
    decision: interview.decision,
    emailSent,
    alreadyNotified: !!existing.candidateNotifiedAt,
  });
});

// ──────── 手動重新寄送結果通知 ────────

app.post("/api/interviews/:id/resend-notification", hrAuth, async (req, res) => {
  const interview = await prisma().interview.findUnique({ where: { id: req.params.id } });
  if (!interview) {
    res.status(404).json({ error: "找不到面試" });
    return;
  }
  if (!interview.decision || interview.decision === "pending") {
    res.status(400).json({ error: "尚未做出通過/不通過決策" });
    return;
  }
  if (!interview.candidateEmail) {
    res.status(400).json({ error: "候選人沒有 email" });
    return;
  }

  const emailFn = interview.decision === "pass" ? sendPassNotification : sendFailNotification;
  const sent = await emailFn({
    to: interview.candidateEmail,
    candidateName: interview.candidateName ?? "您",
    position: interview.position,
    companyName: process.env.COMPANY_NAME,
  });

  if (sent) {
    await prisma().interview.update({
      where: { id: req.params.id },
      data: {
        candidateNotifiedAt: new Date(),
        candidateNotifiedDecision: interview.decision,
      },
    });
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: "寄送失敗（可能未設定 SMTP）" });
  }
});

// ──────── HR 備註 ────────

app.put("/api/interviews/:id/note", hrAuth, async (req, res) => {
  const { hrNote } = req.body;
  await prisma().interview.update({
    where: { id: req.params.id },
    data: { hrNote: hrNote ?? null },
  });
  res.json({ ok: true });
});

// ──────────────── 候選人補件上傳 ────────────────

app.post("/api/interview/:token/supplement", candidateTokenAuth, upload.single("file"), async (req, res) => {
  const interview = await prisma().interview.findUnique({
    where: { token: req.params.token },
  });
  if (!interview) {
    res.status(404).json({ error: "無效的面試連結" });
    return;
  }
  if (interview.status !== "completed") {
    res.status(400).json({ error: "面試尚未完成，無法補件" });
    return;
  }

  // 檢查 12 小時內
  const completedAt = interview.completedAt?.getTime() ?? 0;
  const twelveHours = 12 * 60 * 60 * 1000;
  if (Date.now() - completedAt > twelveHours) {
    res.status(410).json({ error: "補件期限已過（完成面試後 12 小時內）" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "未上傳檔案" });
    return;
  }

  const text = await extractText(req.file.buffer, req.file.originalname);

  // 把補充資料存入 supplementText 欄位（附加，不覆蓋）
  const existing = interview.resumeText ?? "";
  const supplementNote = `\n\n--- 補充資料：${req.file.originalname} ---\n${text}`;

  await prisma().interview.update({
    where: { id: interview.id },
    data: { resumeText: existing + supplementNote },
  });

  res.json({
    ok: true,
    fileName: req.file.originalname,
    message: "補充資料已上傳",
  });
});

// ──────────────── 候選人補件頁面資料 ────────────────

app.get("/api/interview/:token/supplement-status", candidateTokenAuth, async (req, res) => {
  const interview = await prisma().interview.findUnique({
    where: { token: req.params.token },
  });
  if (!interview) {
    res.status(404).json({ error: "無效的面試連結" });
    return;
  }

  const completedAt = interview.completedAt?.getTime() ?? 0;
  const twelveHours = 12 * 60 * 60 * 1000;
  const deadline = completedAt + twelveHours;
  const canSupplement = interview.status === "completed" && Date.now() < deadline;

  res.json({
    position: interview.position,
    candidateName: interview.candidateName,
    status: interview.status,
    canSupplement,
    deadline: canSupplement ? new Date(deadline).toISOString() : null,
  });
});

// ──────── AI 抽取履歷 / JD 關鍵資訊 ────────

app.post("/api/ai/extract", hrAuth, aiLimiter, aiEnabled, async (req, res) => {
  const { resumeText, jdText } = req.body;
  try {
    const result = await extractFromDocs({ resumeText, jdText });
    res.json(result);
  } catch (err) {
    console.error("AI extract error:", (err as Error).message);
    res.status(500).json({ error: "抽取失敗" });
  }
});

// ──────── AI 預覽面試題目 ────────

app.post("/api/ai/preview", hrAuth, aiLimiter, aiEnabled, async (req, res) => {
  const { position, difficulty, topics, resumeText, jdText, count } = req.body;
  if (!position || !difficulty) {
    res.status(400).json({ error: "缺少必要欄位" });
    return;
  }
  try {
    const questions = await previewQuestions({
      position,
      difficulty,
      topics: topics ?? [],
      resumeText,
      jdText,
      count: count ?? 5,
    });
    res.json({ questions });
  } catch (err) {
    console.error("AI preview error:", (err as Error).message);
    res.status(500).json({ error: "預覽失敗" });
  }
});

export default app;
