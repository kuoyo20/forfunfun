import re
from typing import Optional


def extract_card_info(text: str) -> dict:
    """
    Extract structured info from OCR text of a business card.
    Returns dict with: first_name, last_name, email, phone, company, title
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    result = {
        "first_name": "",
        "last_name": "",
        "email": "",
        "phone": "",
        "company": "",
        "title": "",
    }

    used_lines = set()

    # Extract email
    for i, line in enumerate(lines):
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', line)
        if emails:
            result["email"] = emails[0]
            used_lines.add(i)
            break

    # Extract phone
    phone_patterns = [
        r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
        r'\d{4}[-\s]?\d{3,4}[-\s]?\d{3,4}',
        r'0\d{1,2}[-\s]?\d{4}[-\s]?\d{4}',
    ]
    for i, line in enumerate(lines):
        for pattern in phone_patterns:
            phones = re.findall(pattern, line)
            if phones:
                result["phone"] = phones[0].strip()
                used_lines.add(i)
                break
        if result["phone"]:
            break

    # Extract company (lines with common suffixes or keywords)
    company_keywords = ["公司", "股份", "有限", "企業", "集團", "科技", "銀行", "基金",
                        "Inc", "LLC", "Corp", "Ltd", "Co.", "Company", "Group", "Tech"]
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

    # Extract title (common title keywords)
    title_keywords = ["總經理", "經理", "主任", "總監", "董事", "執行長", "副總", "協理", "處長",
                      "CEO", "CTO", "CFO", "COO", "VP", "Director", "Manager", "Engineer",
                      "President", "Founder", "Partner", "Consultant", "顧問", "工程師", "設計師"]
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

    # Name: first unused line that is short (likely a name)
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        if len(line) <= 20 and not re.search(r'[./@]', line):
            # Try to split Chinese name or western name
            parts = line.split()
            if len(parts) >= 2:
                result["last_name"] = parts[0]
                result["first_name"] = " ".join(parts[1:])
            else:
                # Chinese name: first char is last name
                if re.match(r'[\u4e00-\u9fff]', line) and len(line) >= 2:
                    result["last_name"] = line[0]
                    result["first_name"] = line[1:]
                else:
                    result["first_name"] = line
            used_lines.add(i)
            break

    return result


def ocr_image(image_path: str) -> str:
    """Run OCR on an image file. Returns extracted text."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(image_path)
        # Try Chinese + English
        text = pytesseract.image_to_string(img, lang="chi_tra+eng")
        if not text.strip():
            text = pytesseract.image_to_string(img, lang="eng")
        return text
    except ImportError:
        return "[Error] pytesseract 未安裝。請安裝 tesseract-ocr 和 pytesseract。"
    except Exception as e:
        return f"[Error] OCR 失敗: {str(e)}"
