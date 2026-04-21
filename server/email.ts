import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = createTransport();

  console.log(`\n📧 ${subject}`);
  console.log(`   收件人: ${to}`);

  if (!transporter) {
    console.log("   ⚠️  未設定 SMTP，跳過寄信\n");
    return false;
  }

  try {
    const fromAddr = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"AI 面試系統" <${fromAddr}>`,
      to,
      subject,
      html,
    });
    console.log("   ✅ 已寄出\n");
    return true;
  } catch (err) {
    console.error("   ❌ 寄送失敗:", err, "\n");
    return false;
  }
}

// ──────── 寄送面試邀請給候選人 ────────

export async function sendInterviewInvite(params: {
  to: string;
  candidateName: string;
  position: string;
  link: string;
}): Promise<boolean> {
  return sendMail(params.to, `面試邀請：${params.position}`, `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>面試邀請</h2>
      <p>${params.candidateName} 您好，</p>
      <p>感謝您應徵 <strong>${params.position}</strong> 職位。</p>
      <p>請點擊以下連結開始線上面試：</p>
      <p style="margin: 24px 0;">
        <a href="${params.link}"
           style="background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          開始面試
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">此連結為您專屬，請勿分享給他人。</p>
    </div>
  `);
}

// ──────── 面試完成，通知 HR ────────

export async function sendHRNotification(params: {
  hrEmail: string;
  candidateName: string;
  position: string;
  score: number;
  reportLink: string;
}): Promise<boolean> {
  const scoreColor = params.score >= 80 ? "#16a34a" : params.score >= 60 ? "#ca8a04" : "#dc2626";

  return sendMail(params.hrEmail, `面試完成：${params.candidateName} — ${params.position}（${params.score} 分）`, `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>面試已完成</h2>
      <p>候選人 <strong>${params.candidateName}</strong> 已完成 <strong>${params.position}</strong> 的面試。</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${params.score}</span>
        <p style="color: #666; font-size: 14px;">總分</p>
      </div>
      <p style="margin: 24px 0;">
        <a href="${params.reportLink}"
           style="background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          查看完整報告
        </a>
      </p>
    </div>
  `);
}
