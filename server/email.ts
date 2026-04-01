import nodemailer from "nodemailer";

interface InviteParams {
  to: string;
  candidateName: string;
  position: string;
  link: string;
}

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

export async function sendInterviewInvite(params: InviteParams): Promise<boolean> {
  const transporter = createTransport();

  // Log to console for demo purposes
  console.log("\n══════════════════════════════════════");
  console.log("📧 面試邀請信");
  console.log(`收件人: ${params.to}`);
  console.log(`候選人: ${params.candidateName}`);
  console.log(`職位: ${params.position}`);
  console.log(`面試連結: ${params.link}`);
  console.log("══════════════════════════════════════\n");

  if (!transporter) {
    console.log("⚠️  未設定 SMTP，跳過實際寄信（連結已產生）");
    return false;
  }

  try {
    const fromAddr = process.env.SMTP_FROM ?? process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"AI 面試系統" <${fromAddr}>`,
      to: params.to,
      subject: `面試邀請：${params.position}`,
      html: `
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
          <p style="color: #666; font-size: 14px;">
            此連結為您專屬，請勿分享給他人。
          </p>
        </div>
      `,
    });

    console.log("✅ Email 已成功寄出！");
    return true;
  } catch (err) {
    console.error("❌ Email 寄送失敗:", err);
    return false;
  }
}
