import re
import json
import base64
from app.config import ANTHROPIC_API_KEY


def scan_card_vision(image_path: str) -> dict:
    """Use Claude Vision to extract structured business card info directly from image."""
    if not ANTHROPIC_API_KEY:
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        with open(image_path, "rb") as f:
            image_data = base64.standard_b64encode(f.read()).decode("utf-8")

        ext = image_path.rsplit(".", 1)[-1].lower()
        media_type = {
            "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png", "gif": "image/gif", "webp": "image/webp",
        }.get(ext, "image/jpeg")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": """這是一張名片照片。請提取以下資訊並以 JSON 格式回傳：
{
  "first_name": "完整姓名（中文優先，如有英文名也包含）",
  "last_name": "",
  "email": "電子郵件",
  "phone": "電話號碼（保留原始格式）",
  "company": "公司/組織名稱",
  "title": "職稱",
  "website": "網站",
  "address": "地址"
}

規則：
- first_name 放完整姓名，last_name 留空
- 如果有中文名和英文名，格式為「中文名 English Name」
- 找不到的欄位填空字串
- 只回傳 JSON，不要其他文字"""
                    }
                ],
            }],
        )

        text = response.content[0].text.strip()
        # Extract JSON from response (handle markdown code blocks)
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        result = json.loads(text)
        # Ensure all expected keys exist
        for key in ["first_name", "last_name", "email", "phone", "company", "title", "website", "address"]:
            if key not in result:
                result[key] = ""
        return result

    except Exception as e:
        print(f"[Claude Vision] Error: {e}")
        return None


def extract_card_info(text: str) -> dict:
    """Extract structured info from OCR text of a business card (fallback)."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    result = {
        "first_name": "", "last_name": "", "email": "", "phone": "",
        "company": "", "title": "", "website": "", "address": "",
    }

    used_lines = set()

    for i, line in enumerate(lines):
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', line)
        if emails:
            result["email"] = emails[0]
            used_lines.add(i)
            break

    phone_patterns = [
        r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
        r'\d{4}[-\s]?\d{3,4}[-\s]?\d{3,4}',
        r'0\d{1,2}[-\s]?\d{4}[-\s]?\d{4}',
        r'(?:TEL|tel|Tel|電話|전화)[:\s]*([+\d\s\-().]+)',
    ]
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        for pattern in phone_patterns:
            phones = re.findall(pattern, line)
            if phones:
                result["phone"] = phones[0].strip() if isinstance(phones[0], str) else phones[0]
                used_lines.add(i)
                break
        if result["phone"]:
            break

    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        urls = re.findall(r'(?:https?://)?(?:www\.)?[\w.-]+\.\w{2,}(?:/\S*)?', line)
        if urls and '@' not in urls[0]:
            result["website"] = urls[0]
            used_lines.add(i)
            break

    company_keywords = [
        "公司", "股份", "有限", "企業", "集團", "科技", "銀行", "基金", "協會", "事務所", "工作室",
        "Inc", "LLC", "Corp", "Ltd", "Co.", "Company", "Group", "Tech", "Solutions", "Partners",
        "株式会社", "有限会社", "合同会社", "社団法人",
        "주식회사", "유한회사",
    ]
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        for kw in company_keywords:
            if kw.lower() in line.lower():
                result["company"] = line
                used_lines.add(i)
                break
        if result["company"]:
            break

    title_keywords = [
        "總經理", "經理", "主任", "總監", "董事", "執行長", "副總", "協理", "處長", "組長",
        "顧問", "工程師", "設計師", "教授", "醫師", "律師", "會計師", "秘書", "助理",
        "CEO", "CTO", "CFO", "COO", "CIO", "VP", "Director", "Manager", "Engineer",
        "President", "Founder", "Partner", "Consultant", "Analyst", "Designer",
        "Professor", "Doctor", "Attorney",
        "社長", "部長", "課長", "係長", "取締役", "代表",
        "대표", "이사", "부장", "과장", "차장",
    ]
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        for kw in title_keywords:
            if kw.lower() in line.lower():
                result["title"] = line
                used_lines.add(i)
                break
        if result["title"]:
            break

    address_keywords = ["市", "區", "路", "街", "巷", "弄", "號", "樓",
                        "Road", "St.", "Ave", "Blvd", "Floor",
                        "丁目", "番地", "ビル"]
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        for kw in address_keywords:
            if kw in line and len(line) > 5:
                result["address"] = line
                used_lines.add(i)
                break
        if result["address"]:
            break

    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        if len(line) <= 20 and not re.search(r'[./@]', line):
            result["first_name"] = line.strip()
            result["last_name"] = ""
            used_lines.add(i)
            break

    return result


def ocr_image(image_path: str) -> str:
    """Run OCR on an image file with multi-language support (Tesseract fallback)."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(image_path)

        lang_attempts = [
            "chi_tra+eng",
            "chi_sim+eng",
            "jpn+eng",
            "kor+eng",
            "eng",
        ]

        best_text = ""
        for lang in lang_attempts:
            try:
                text = pytesseract.image_to_string(img, lang=lang)
                if len(text.strip()) > len(best_text.strip()):
                    best_text = text
                if len(text.strip()) > 20:
                    break
            except Exception:
                continue

        return best_text if best_text.strip() else "[Error] OCR 無法辨識文字，請嘗試更清晰的圖片。"
    except ImportError:
        return "[Error] pytesseract 未安裝。請安裝 tesseract-ocr 和 pytesseract。"
    except Exception as e:
        return f"[Error] OCR 失敗: {str(e)}"
