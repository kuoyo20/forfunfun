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

// ──────── 通過通知（候選人）────────

export async function sendPassNotification(params: {
  to: string;
  candidateName: string;
  position: string;
  companyName?: string;
}): Promise<boolean> {
  const company = params.companyName ?? "我們";
  return sendMail(params.to, `關於您應徵 ${params.position} 的好消息`, `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.7;">
      <p>${params.candidateName} 您好，</p>

      <p>首先，感謝您撥空參加 <strong>${params.position}</strong> 職位的線上面試。</p>

      <p>很開心通知您，在這次的面試中，您的表現讓${company}印象深刻，我們想邀請您進入下一階段的面試。</p>

      <p>我們的 HR 夥伴將會在近期主動與您聯繫，討論下一輪面試的時間與形式。如果您有任何時間上的偏好或考量，屆時也歡迎跟我們分享。</p>

      <p>再次感謝您的用心準備，期待很快與您再次交流。</p>

      <p style="margin-top: 32px;">
        祝 順心<br>
        <span style="color: #666;">${company} 人資團隊 敬上</span>
      </p>
    </div>
  `);
}

// ──────── 不通過通知（候選人）────────

export async function sendFailNotification(params: {
  to: string;
  candidateName: string;
  position: string;
  companyName?: string;
}): Promise<boolean> {
  const company = params.companyName ?? "我們";
  return sendMail(params.to, `關於您應徵 ${params.position} 的回覆`, `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.7;">
      <p>${params.candidateName} 您好，</p>

      <p>首先，感謝您撥空參加 <strong>${params.position}</strong> 職位的線上面試，也謝謝您在面試中誠懇地分享您的經驗與想法。</p>

      <p>經過內部審慎的討論，我們在多方考量後，這次很遺憾無法進入下一階段的合作。這個決定並不容易，也絕非對您能力的否定 — 每次徵才都會綜合評估當下團隊需求、職位的特定要求與整體契合度，這次很可惜在這些面向上沒能找到最剛好的交集。</p>

      <p>我們由衷欣賞您投入的時間與準備，也相信您的經驗與專業在其他機會中會有很好的發揮。未來如果${company}有更適合您的職缺，也歡迎您再次嘗試，我們會很樂意再次認識您。</p>

      <p>祝福您在接下來的求職路上一切順利，很快找到真正適合的舞台。</p>

      <p style="margin-top: 32px;">
        祝 順心<br>
        <span style="color: #666;">${company} 人資團隊 敬上</span>
      </p>
    </div>
  `);
}

