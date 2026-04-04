import re


def extract_card_info(text: str) -> dict:
    """Extract structured info from OCR text of a business card."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    result = {
        "first_name": "", "last_name": "", "email": "", "phone": "",
        "company": "", "title": "", "website": "", "address": "",
    }

    used_lines = set()

    # Extract email
    for i, line in enumerate(lines):
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', line)
        if emails:
            result["email"] = emails[0]
            used_lines.add(i)
            break

    # Extract phone (TW, JP, KR, international formats)
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

    # Extract website/URL
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        urls = re.findall(r'(?:https?://)?(?:www\.)?[\w.-]+\.\w{2,}(?:/\S*)?', line)
        if urls and '@' not in urls[0]:
            result["website"] = urls[0]
            used_lines.add(i)
            break

    # Extract company (multi-language keywords)
    company_keywords = [
        # Chinese
        "公司", "股份", "有限", "企業", "集團", "科技", "銀行", "基金", "協會", "事務所", "工作室",
        # English
        "Inc", "LLC", "Corp", "Ltd", "Co.", "Company", "Group", "Tech", "Solutions", "Partners",
        # Japanese
        "株式会社", "有限会社", "合同会社", "社団法人",
        # Korean
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

    # Extract title (multi-language)
    title_keywords = [
        # Chinese
        "總經理", "經理", "主任", "總監", "董事", "執行長", "副總", "協理", "處長", "組長",
        "顧問", "工程師", "設計師", "教授", "醫師", "律師", "會計師", "秘書", "助理",
        # English
        "CEO", "CTO", "CFO", "COO", "CIO", "VP", "Director", "Manager", "Engineer",
        "President", "Founder", "Partner", "Consultant", "Analyst", "Designer",
        "Professor", "Doctor", "Attorney",
        # Japanese
        "社長", "部長", "課長", "係長", "取締役", "代表",
        # Korean
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

    # Extract address (look for common address patterns)
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

    # Name: first unused line that is short
    for i, line in enumerate(lines):
        if i in used_lines:
            continue
        if len(line) <= 20 and not re.search(r'[./@]', line):
            parts = line.split()
            if len(parts) >= 2:
                result["last_name"] = parts[0]
                result["first_name"] = " ".join(parts[1:])
            else:
                # CJK name: first char is last name
                if re.match(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3]', line) and len(line) >= 2:
                    result["last_name"] = line[0]
                    result["first_name"] = line[1:]
                else:
                    result["first_name"] = line
            used_lines.add(i)
            break

    return result


def ocr_image(image_path: str) -> str:
    """Run OCR on an image file with multi-language support."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(image_path)

        # Try multiple language combinations
        lang_attempts = [
            "chi_tra+eng",   # Traditional Chinese + English
            "chi_sim+eng",   # Simplified Chinese + English
            "jpn+eng",       # Japanese + English
            "kor+eng",       # Korean + English
            "eng",           # English only (fallback)
        ]

        best_text = ""
        for lang in lang_attempts:
            try:
                text = pytesseract.image_to_string(img, lang=lang)
                if len(text.strip()) > len(best_text.strip()):
                    best_text = text
                if len(text.strip()) > 20:
                    break  # Good enough result
            except Exception:
                continue

        return best_text if best_text.strip() else "[Error] OCR 無法辨識文字，請嘗試更清晰的圖片。"
    except ImportError:
        return "[Error] pytesseract 未安裝。請安裝 tesseract-ocr 和 pytesseract。"
    except Exception as e:
        return f"[Error] OCR 失敗: {str(e)}"
