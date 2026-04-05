import PptxGenJS from 'pptxgenjs';
import type { PptxData, AiPptxContent } from '@/types';
import bakeryCoverUrl from '@/assets/bakery-cover.png';
import bakeryAccentUrl from '@/assets/bakery-accent.png';
import bakeryIngredientsUrl from '@/assets/bakery-ingredients.png';
import bakeryBgWarmUrl from '@/assets/bakery-bg-warm.jpg';
import bakeryCornerUrl from '@/assets/bakery-corner.png';
import bakeryDividerUrl from '@/assets/bakery-divider.png';

const ROLE_LABELS: Record<string, string> = {
  boss: '老闆 / 經營者',
  chef: '主廚 / 師傅',
  purchaser: '採購 / 總務',
  marketing: '行銷 / 企劃',
};

const C = {
  amber: '92700A', amberDark: '6B5108', amberLight: 'C49A1A',
  gold: 'D4A520', cream: 'FFF8ED', warmWhite: 'FFFDF8',
  parchment: 'FDF6EC', darkText: '3A2D1E', bodyText: '594834',
  muted: '9E8E7A', lightMuted: 'C7B9A8', white: 'FFFFFF',
  cardBg: 'FFF5EB', accentGreen: '4A7C59', accentBlue: '3D6B8E',
};

const FONT = 'Microsoft JhengHei';

async function imageToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function getValueProps(product: string, clientFocus: string): { icon: string; title: string; desc: string }[] {
  const focuses = clientFocus.split('、').filter(Boolean);
  const props: { icon: string; title: string; desc: string }[] = [];

  const mapping: Record<string, { icon: string; title: string; descTpl: string }> = {
    '降低成本': { icon: '💰', title: '成本優化方案', descTpl: `透過穩定供應鏈與量體優勢，提供具競爭力的${product}價格，同時確保品質不妥協。` },
    '提升品質': { icon: '🏆', title: '品質躍升計畫', descTpl: `嚴選歐洲、日本頂級產地${product}，從原料端為您的產品注入世界級品質基因。` },
    '開發新品': { icon: '🧪', title: '新品研發支援', descTpl: `專業技術團隊提供配方建議與樣品測試，協助您以${product}打造市場差異化新品。` },
    '穩定供貨': { icon: '🚚', title: '穩定供應保障', descTpl: `多元產地佈局與安全庫存管理，確保${product}全年穩定供應，不受市場波動影響。` },
    '差異化': { icon: '✨', title: '產品差異化策略', descTpl: `獨家代理與限定產地${product}，為您創造同業無法複製的產品特色與品牌故事。` },
    '品牌故事': { icon: '📖', title: '品牌加值敘事', descTpl: `提供${product}完整產地溯源與品牌故事素材，強化您的品牌深度與消費者信任感。` },
    '比賽用料': { icon: '🥇', title: '競賽級原料供應', descTpl: `提供與世界麵包大賽同等級的${product}，助您在專業競賽中展現最佳實力。` },
    '原廠風味': { icon: '🇫🇷', title: '原廠風味還原', descTpl: `直接從原產地進口正統${product}，完整保留原廠風味特性，讓您的產品忠於經典。` },
  };

  for (const f of focuses) {
    const m = mapping[f];
    if (m) props.push({ icon: m.icon, title: m.title, desc: m.descTpl });
  }

  if (props.length === 0) {
    props.push(
      { icon: '🌟', title: '頂級原料供應', desc: `精選全球優質${product}，為您的產品品質把關。` },
      { icon: '🤝', title: '專業技術支援', desc: '從配方到量產，技術團隊全程協助，為您的成功保駕護航。' },
      { icon: '📦', title: '穩定供應鏈', desc: '完善倉儲與物流系統，確保準時交貨，讓您專注於創作。' },
    );
  }

  return props;
}

type Slide = ReturnType<PptxGenJS['addSlide']>;

function addFooter(pptx: PptxGenJS, slide: Slide, light = false) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 4.95, w: '100%', h: 0.45,
    fill: { color: light ? '000000' : C.amber, transparency: light ? 70 : 92 },
  });
  slide.addText('苗林行 Miaolin Foods ─ 讓品味與食俱進 ｜ 為客戶的成功創造最大價值', {
    x: 0, y: 5.0, w: '100%', h: 0.35,
    fontSize: 8, fontFace: FONT, color: light ? C.lightMuted : C.muted, align: 'center',
  });
}

function addTopBar(pptx: PptxGenJS, slide: Slide) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.gold } });
}

function addSectionTitle(pptx: PptxGenJS, slide: Slide, title: string) {
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.4, w: 0.08, h: 0.55, fill: { color: C.amber } });
  slide.addText(title, {
    x: 0.75, y: 0.35, w: 8, h: 0.65,
    fontSize: 26, fontFace: FONT, color: C.amberDark, bold: true,
  });
}

// ── Slide builders ──

function buildCoverSlide(pptx: PptxGenJS, data: PptxData, coverImg: string) {
  const s = pptx.addSlide();
  s.background = { data: coverImg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '1A1408', transparency: 35 } });
  addTopBar(pptx, s);
  s.addText('苗林行 Miaolin Foods', { x: 0.8, y: 0.5, w: 5, h: 0.45, fontSize: 14, fontFace: FONT, color: C.gold, bold: true, italic: true });
  s.addText(`致 ${data.clientName}`, { x: 0.8, y: 1.4, w: 8.4, h: 0.6, fontSize: 20, fontFace: FONT, color: C.lightMuted });
  s.addText('合作提案', { x: 0.8, y: 1.9, w: 8.4, h: 1.2, fontSize: 48, fontFace: FONT, color: C.white, bold: true });
  s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.05, w: 2.5, h: 0.06, fill: { color: C.gold } });
  s.addText(`產品：${data.product}`, { x: 0.8, y: 3.3, w: 8.4, h: 0.4, fontSize: 16, fontFace: FONT, color: C.cream });
  addFooter(pptx, s, true);
}

function buildAboutSlide(pptx: PptxGenJS, cornerImg: string) {
  const s = pptx.addSlide();
  s.background = { color: C.warmWhite };
  addTopBar(pptx, s);
  s.addImage({ data: cornerImg, x: 8.0, y: 3.3, w: 2, h: 2, transparency: 25 });
  addSectionTitle(pptx, s, '關於苗林行');

  const items = [
    { icon: '🌍', title: '全球頂級食材供應商', desc: '代理歐洲、日本等地一流烘焙原料品牌，為台灣烘焙產業引進世界級食材。' },
    { icon: '🔬', title: '專業技術支援團隊', desc: '擁有豐富烘焙應用經驗的技術顧問，從配方開發到量產穩定，全程陪伴。' },
    { icon: '📦', title: '穩定高效供應鏈', desc: '完善倉儲與冷鏈物流系統，確保食材新鮮度與準時交付。' },
    { icon: '🤝', title: '共創成功的夥伴', desc: '不只是供應商，更是與您並肩成長的事業夥伴。客戶成功，就是苗林的成功。' },
  ];

  items.forEach((item, i) => {
    const y = 1.2 + i * 0.9;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 8.4, h: 0.75, fill: { color: C.cardBg }, rectRadius: 0.1, line: { color: 'F0E0C8', width: 1 } });
    s.addText(item.icon, { x: 0.75, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 22, align: 'center', valign: 'middle' });
    s.addText(item.title, { x: 1.35, y: y + 0.05, w: 3, h: 0.35, fontSize: 14, fontFace: FONT, color: C.amberDark, bold: true, valign: 'middle' });
    s.addText(item.desc, { x: 1.35, y: y + 0.38, w: 7.4, h: 0.32, fontSize: 11, fontFace: FONT, color: C.bodyText, valign: 'top' });
  });
  addFooter(pptx, s);
}

function buildNeedsSlide(pptx: PptxGenJS, data: PptxData, bgImg: string, dividerImg: string) {
  const s = pptx.addSlide();
  s.background = { color: C.parchment };
  addTopBar(pptx, s);
  s.addImage({ data: bgImg, x: 0, y: 0, w: 10, h: 5.63, transparency: 88 });
  addSectionTitle(pptx, s, `我們理解 ${data.clientName} 的需求`);

  const focuses = data.clientFocus.split('、').filter(Boolean);
  if (focuses.length > 0) {
    s.addText('您目前關注的重點：', { x: 0.75, y: 1.2, w: 5, h: 0.4, fontSize: 14, fontFace: FONT, color: C.muted });
    const chipColors = ['E8F0E0', 'FFF0D8', 'E0ECF5', 'F5E8F0', 'E8F5F0', 'F5F0E0', 'F0E0E0', 'E0F0F5'];
    const chipTextColors = ['3A6B2A', '8B6914', '2A5A7B', '7B2A6B', '2A7B5A', '6B5A2A', '7B3A3A', '2A6B7B'];
    focuses.forEach((focus, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 0.75 + col * 2.2, y = 1.7 + row * 0.65;
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.0, h: 0.48, fill: { color: chipColors[i % chipColors.length] }, rectRadius: 0.24, line: { color: chipTextColors[i % chipTextColors.length], width: 1, transparency: 60 } });
      s.addText(`✦ ${focus}`, { x, y, w: 2.0, h: 0.48, fontSize: 13, fontFace: FONT, color: chipTextColors[i % chipTextColors.length], bold: true, align: 'center', valign: 'middle' });
    });
  }
  s.addImage({ data: dividerImg, x: 1, y: 3.0, w: 7.5, h: 0.2, transparency: 50 });
  s.addText('我們將針對以上需求，提供量身定做的解決方案。', { x: 0.75, y: 3.4, w: 8, h: 0.5, fontSize: 15, fontFace: FONT, color: C.bodyText, italic: true });
  addFooter(pptx, s);
}

function buildValueSlides(pptx: PptxGenJS, data: PptxData, accentImg: string, cornerImg: string) {
  const valueProps = getValueProps(data.product, data.clientFocus);
  const VP_PER_SLIDE = 3;

  const buildBatch = (batch: typeof valueProps, title: string, decorImg: string) => {
    const s = pptx.addSlide();
    s.background = { color: C.warmWhite };
    addTopBar(pptx, s);
    s.addImage({ data: decorImg, x: 8.5, y: 3.8, w: 1.3, h: 1.3, transparency: 30 });
    addSectionTitle(pptx, s, title);

    batch.forEach((vp, i) => {
      const y = 1.2 + i * 1.2;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 8.5, h: 1.0, fill: { color: C.white }, rectRadius: 0.12, line: { color: 'E8DCC8', width: 1 }, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.06 } });
      s.addShape(pptx.ShapeType.ellipse, { x: 0.8, y: y + 0.15, w: 0.65, h: 0.65, fill: { color: C.cardBg } });
      s.addText(vp.icon, { x: 0.8, y: y + 0.15, w: 0.65, h: 0.65, fontSize: 22, align: 'center', valign: 'middle' });
      s.addText(vp.title, { x: 1.65, y: y + 0.08, w: 7.2, h: 0.4, fontSize: 16, fontFace: FONT, color: C.amberDark, bold: true });
      s.addText(vp.desc, { x: 1.65, y: y + 0.48, w: 7.2, h: 0.45, fontSize: 12, fontFace: FONT, color: C.bodyText, lineSpacingMultiple: 1.3 });
    });
    addFooter(pptx, s);
  };

  buildBatch(valueProps.slice(0, VP_PER_SLIDE), '我們能為您創造的價值', accentImg);
  if (valueProps.length > VP_PER_SLIDE) {
    buildBatch(valueProps.slice(VP_PER_SLIDE), '更多合作優勢', cornerImg);
  }
}

function buildProductSlide(pptx: PptxGenJS, data: PptxData, bgImg: string) {
  const s = pptx.addSlide();
  s.background = { data: bgImg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.white, transparency: 30 } });
  addTopBar(pptx, s);
  addSectionTitle(pptx, s, `為什麼選擇苗林行的${data.product}？`);

  const reasons = [
    { num: '01', title: '嚴選產地', desc: '直接與歐洲、日本頂級原料廠合作，每批原料皆有完整品質檢驗報告。' },
    { num: '02', title: '技術賦能', desc: '專業烘焙技術團隊提供配方優化、新品開發、技術培訓等全方位支援。' },
    { num: '03', title: '穩定供應', desc: '專業倉儲管理與安全庫存制度，確保全年穩定供貨，從不讓您斷料。' },
    { num: '04', title: '共同成長', desc: '定期市場趨勢分享與新品資訊，助您掌握產業脈動、領先同業。' },
  ];

  reasons.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 4.6, y = 1.3 + row * 1.7;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.3, h: 1.4, fill: { color: C.white }, rectRadius: 0.12, line: { color: 'E8DCC8', width: 1 }, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.06 } });
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.15, y: y + 0.15, w: 0.55, h: 0.45, fill: { color: C.amber }, rectRadius: 0.08 });
    s.addText(r.num, { x: x + 0.15, y: y + 0.15, w: 0.55, h: 0.45, fontSize: 16, fontFace: FONT, color: C.white, bold: true, align: 'center', valign: 'middle' });
    s.addText(r.title, { x: x + 0.85, y: y + 0.15, w: 3.2, h: 0.45, fontSize: 16, fontFace: FONT, color: C.amberDark, bold: true, valign: 'middle' });
    s.addText(r.desc, { x: x + 0.2, y: y + 0.7, w: 3.9, h: 0.55, fontSize: 11, fontFace: FONT, color: C.bodyText, lineSpacingMultiple: 1.3 });
  });
  addFooter(pptx, s);
}

function buildAiSlides(pptx: PptxGenJS, ai: AiPptxContent, cornerImg: string, bgImg: string, accentImg: string) {
  // Success Cases
  if (ai.successCases?.length) {
    const s = pptx.addSlide();
    s.background = { color: C.warmWhite };
    addTopBar(pptx, s);
    s.addImage({ data: cornerImg, x: 8.2, y: 3.5, w: 1.8, h: 1.8, transparency: 30 });
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.4, w: 0.08, h: 0.55, fill: { color: C.amber } });
    s.addText('合作實績', { x: 0.75, y: 0.35, w: 5, h: 0.65, fontSize: 28, fontFace: FONT, color: C.amberDark, bold: true });
    s.addText('以下為苗林行與同業合作的成功經驗', { x: 0.75, y: 0.95, w: 7, h: 0.35, fontSize: 12, fontFace: FONT, color: C.muted });

    ai.successCases.forEach((sc, i) => {
      const y = 1.45 + i * 1.2;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 9, h: 1.05, fill: { color: C.white }, rectRadius: 0.1, line: { color: 'E8DCC8', width: 1 }, shadow: { type: 'outer', blur: 3, offset: 2, color: '000000', opacity: 0.05 } });
      s.addShape(pptx.ShapeType.roundRect, { x: 0.65, y: y + 0.1, w: 1.6, h: 0.35, fill: { color: C.cardBg }, rectRadius: 0.06 });
      s.addText(sc.brand, { x: 0.65, y: y + 0.1, w: 1.6, h: 0.35, fontSize: 10, fontFace: FONT, color: C.amberDark, bold: true, align: 'center', valign: 'middle' });
      s.addText(sc.industry, { x: 2.4, y: y + 0.1, w: 1.5, h: 0.35, fontSize: 9, fontFace: FONT, color: C.muted, valign: 'middle' });
      s.addText(`挑戰：${sc.challenge}`, { x: 0.7, y: y + 0.5, w: 2.8, h: 0.45, fontSize: 10, fontFace: FONT, color: C.bodyText, valign: 'top' });
      s.addText(`解方：${sc.solution}`, { x: 3.6, y: y + 0.5, w: 2.8, h: 0.45, fontSize: 10, fontFace: FONT, color: C.bodyText, valign: 'top' });
      s.addText(`✦ ${sc.result}`, { x: 6.5, y: y + 0.5, w: 2.8, h: 0.45, fontSize: 10, fontFace: FONT, color: C.accentGreen, bold: true, valign: 'top' });
    });
    addFooter(pptx, s);
  }

  // ROI Analysis
  if (ai.roiAnalysis?.metrics?.length) {
    const s = pptx.addSlide();
    s.background = { color: C.parchment };
    addTopBar(pptx, s);
    s.addImage({ data: bgImg, x: 0, y: 0, w: 10, h: 5.63, transparency: 90 });
    addSectionTitle(pptx, s, ai.roiAnalysis.title || '導入效益分析');

    const metrics = ai.roiAnalysis.metrics;
    const cols = Math.min(metrics.length, 4);
    const cardW = (8.8 - (cols - 1) * 0.3) / cols;

    metrics.forEach((m, i) => {
      const x = 0.6 + i * (cardW + 0.3), y = 1.3;
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: cardW, h: 2.8, fill: { color: C.white }, rectRadius: 0.12, line: { color: 'E8DCC8', width: 1 }, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.06 } });
      s.addText(m.value, { x, y: y + 0.3, w: cardW, h: 0.8, fontSize: 32, fontFace: FONT, color: C.amber, bold: true, align: 'center', valign: 'middle' });
      s.addText(m.label, { x: x + 0.15, y: y + 1.15, w: cardW - 0.3, h: 0.4, fontSize: 14, fontFace: FONT, color: C.amberDark, bold: true, align: 'center' });
      s.addShape(pptx.ShapeType.rect, { x: x + cardW * 0.2, y: y + 1.6, w: cardW * 0.6, h: 0.04, fill: { color: C.gold, transparency: 50 } });
      s.addText(m.description, { x: x + 0.15, y: y + 1.75, w: cardW - 0.3, h: 0.9, fontSize: 10, fontFace: FONT, color: C.bodyText, align: 'center', lineSpacingMultiple: 1.3 });
    });
    addFooter(pptx, s);
  }

  // Promo Offer
  if (ai.promoOffer) {
    const s = pptx.addSlide();
    s.background = { color: C.warmWhite };
    addTopBar(pptx, s);
    s.addImage({ data: accentImg, x: 8.3, y: 3.5, w: 1.5, h: 1.5, transparency: 25 });
    addSectionTitle(pptx, s, ai.promoOffer.title || '專屬合作方案');

    ai.promoOffer.items.forEach((item, i) => {
      const y = 1.2 + i * 0.75;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 8.5, h: 0.6, fill: { color: C.cardBg }, rectRadius: 0.1, line: { color: 'F0E0C8', width: 1 } });
      s.addText(item.icon, { x: 0.75, y, w: 0.5, h: 0.6, fontSize: 20, align: 'center', valign: 'middle' });
      s.addText(item.text, { x: 1.35, y, w: 7.5, h: 0.6, fontSize: 14, fontFace: FONT, color: C.bodyText, valign: 'middle' });
    });

    const deadlineY = 1.2 + ai.promoOffer.items.length * 0.75 + 0.3;
    s.addShape(pptx.ShapeType.roundRect, { x: 2, y: deadlineY, w: 6, h: 0.5, fill: { color: 'FFF0D8' }, rectRadius: 0.25, line: { color: C.gold, width: 1 } });
    s.addText(`⏰ ${ai.promoOffer.deadline}`, { x: 2, y: deadlineY, w: 6, h: 0.5, fontSize: 13, fontFace: FONT, color: C.amberDark, bold: true, align: 'center', valign: 'middle' });
    s.addText(ai.promoOffer.cta, { x: 1, y: deadlineY + 0.7, w: 8, h: 0.5, fontSize: 16, fontFace: FONT, color: C.amber, bold: true, align: 'center', italic: true });
    addFooter(pptx, s);
  }
}

function buildNextStepsSlide(pptx: PptxGenJS, data: PptxData, accentImg: string) {
  const s = pptx.addSlide();
  s.background = { color: C.parchment };
  addTopBar(pptx, s);
  s.addImage({ data: accentImg, x: 8.3, y: 3.6, w: 1.5, h: 1.5, transparency: 25 });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.4, w: 0.08, h: 0.55, fill: { color: C.amber } });
  s.addText('合作下一步', { x: 0.75, y: 0.35, w: 8, h: 0.65, fontSize: 28, fontFace: FONT, color: C.amberDark, bold: true });

  const steps = [
    { step: '1', title: '免費樣品體驗', desc: `提供${data.product}試用樣品，讓您親自感受品質差異。` },
    { step: '2', title: '技術顧問到府', desc: '由專業技術團隊協助測試與配方調整，確保完美導入。' },
    { step: '3', title: '客製化報價', desc: '根據您的用量與需求，提供最具競爭力的合作方案。' },
    { step: '4', title: '長期夥伴關係', desc: '持續提供技術支援、新品資訊與市場趨勢，共同成長。' },
  ];

  steps.forEach((st, i) => {
    const y = 1.2 + i * 0.9;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.7, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: C.amber } });
    s.addText(st.step, { x: 0.7, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 18, fontFace: FONT, color: C.white, bold: true, align: 'center', valign: 'middle' });
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.rect, { x: 0.93, y: y + 0.55, w: 0.04, h: 0.35, fill: { color: C.gold, transparency: 40 } });
    }
    s.addText(st.title, { x: 1.4, y: y + 0.02, w: 7, h: 0.35, fontSize: 16, fontFace: FONT, color: C.amberDark, bold: true });
    s.addText(st.desc, { x: 1.4, y: y + 0.35, w: 7, h: 0.35, fontSize: 12, fontFace: FONT, color: C.bodyText });
  });
  addFooter(pptx, s);
}

function buildClosingSlide(pptx: PptxGenJS, data: PptxData, ingredientsImg: string) {
  const s = pptx.addSlide();
  s.background = { data: ingredientsImg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '1A1408', transparency: 38 } });
  addTopBar(pptx, s);
  s.addText('苗林行', { x: 0.8, y: 1.0, w: 8.4, h: 0.8, fontSize: 42, fontFace: FONT, color: C.white, bold: true, align: 'center' });
  s.addText('Miaolin Foods', { x: 0.8, y: 1.7, w: 8.4, h: 0.45, fontSize: 18, fontFace: FONT, color: C.lightMuted, align: 'center', italic: true });
  s.addShape(pptx.ShapeType.rect, { x: 3.5, y: 2.3, w: 3, h: 0.05, fill: { color: C.gold } });
  s.addText('讓品味與食俱進', { x: 1, y: 2.55, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.cream, align: 'center', bold: true });
  s.addText(`期待與 ${data.clientName} 攜手共創卓越`, { x: 1.5, y: 3.3, w: 7, h: 0.5, fontSize: 16, fontFace: FONT, color: C.lightMuted, align: 'center' });
  s.addText('品味敏銳 · 品質堅持 · 品格不遺餘力', { x: 1.5, y: 3.9, w: 7, h: 0.4, fontSize: 13, fontFace: FONT, color: C.muted, align: 'center', italic: true });
}

// ── Main export ──

export async function generatePptx(data: PptxData) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '苗林行 Miaolin Foods';
  pptx.subject = `${data.clientName} 合作提案`;
  pptx.title = `苗林行 × ${data.clientName} 合作提案`;

  const [coverImg, accentImg, ingredientsImg, bgWarmImg, cornerImg, dividerImg] = await Promise.all([
    imageToBase64(bakeryCoverUrl),
    imageToBase64(bakeryAccentUrl),
    imageToBase64(bakeryIngredientsUrl),
    imageToBase64(bakeryBgWarmUrl),
    imageToBase64(bakeryCornerUrl),
    imageToBase64(bakeryDividerUrl),
  ]);

  buildCoverSlide(pptx, data, coverImg);
  buildAboutSlide(pptx, cornerImg);
  buildNeedsSlide(pptx, data, bgWarmImg, dividerImg);
  buildValueSlides(pptx, data, accentImg, cornerImg);
  buildProductSlide(pptx, data, bgWarmImg);
  if (data.aiContent) buildAiSlides(pptx, data.aiContent, cornerImg, bgWarmImg, accentImg);
  buildNextStepsSlide(pptx, data, accentImg);
  buildClosingSlide(pptx, data, ingredientsImg);

  await pptx.writeFile({ fileName: `苗林行×${data.clientName}_合作提案.pptx` });
}
