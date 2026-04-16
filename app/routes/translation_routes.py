"""Real-time speech translation routes with WebSocket support."""
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from deep_translator import GoogleTranslator
import json

router = APIRouter(tags=["translation"])
templates = Jinja2Templates(directory="app/templates")

# Supported languages for translation
SUPPORTED_LANGUAGES = {
    "zh-TW": "繁體中文",
    "zh-CN": "簡體中文",
    "en": "English",
    "ja": "日本語",
    "ko": "한국어",
    "fr": "Français",
    "de": "Deutsch",
    "es": "Español",
    "pt": "Português",
    "it": "Italiano",
    "ru": "Русский",
    "ar": "العربية",
    "th": "ไทย",
    "vi": "Tiếng Việt",
    "id": "Bahasa Indonesia",
    "ms": "Bahasa Melayu",
    "hi": "हिन्दी",
    "nl": "Nederlands",
    "pl": "Polski",
    "tr": "Türkçe",
    "uk": "Українська",
    "sv": "Svenska",
    "da": "Dansk",
    "fi": "Suomi",
    "no": "Norsk",
    "el": "Ελληνικά",
    "he": "עברית",
    "cs": "Čeština",
    "ro": "Română",
    "hu": "Magyar",
}

# Map Web Speech API language codes to deep-translator codes
SPEECH_TO_TRANSLATOR = {
    "zh-TW": "zh-TW",
    "zh-CN": "zh-CN",
    "en": "en",
    "ja": "ja",
    "ko": "ko",
    "fr": "fr",
    "de": "de",
    "es": "es",
    "pt": "pt",
    "it": "it",
    "ru": "ru",
    "ar": "ar",
    "th": "th",
    "vi": "vi",
    "id": "id",
    "ms": "ms",
    "hi": "hi",
    "nl": "nl",
    "pl": "pl",
    "tr": "tr",
    "uk": "uk",
    "sv": "sv",
    "da": "da",
    "fi": "fi",
    "no": "no",
    "el": "el",
    "he": "iw",
    "cs": "cs",
    "ro": "ro",
    "hu": "hu",
}

# Web Speech API recognition language codes (BCP 47)
SPEECH_RECOGNITION_CODES = {
    "zh-TW": "zh-TW",
    "zh-CN": "zh-CN",
    "en": "en-US",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "fr": "fr-FR",
    "de": "de-DE",
    "es": "es-ES",
    "pt": "pt-BR",
    "it": "it-IT",
    "ru": "ru-RU",
    "ar": "ar-SA",
    "th": "th-TH",
    "vi": "vi-VN",
    "id": "id-ID",
    "ms": "ms-MY",
    "hi": "hi-IN",
    "nl": "nl-NL",
    "pl": "pl-PL",
    "tr": "tr-TR",
    "uk": "uk-UA",
    "sv": "sv-SE",
    "da": "da-DK",
    "fi": "fi-FI",
    "no": "nb-NO",
    "el": "el-GR",
    "he": "he-IL",
    "cs": "cs-CZ",
    "ro": "ro-RO",
    "hu": "hu-HU",
}


@router.get("/translation")
async def translation_page(request: Request):
    """Render the real-time translation page."""
    return templates.TemplateResponse(request=request, name="translation.html", context={
        "request": request,
        "languages": SUPPORTED_LANGUAGES,
        "speech_codes": SPEECH_RECOGNITION_CODES,
    })


@router.websocket("/ws/translate")
async def translate_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time translation."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            text = msg.get("text", "").strip()
            source_lang = msg.get("source", "en")
            target_lang = msg.get("target", "zh-TW")
            is_final = msg.get("is_final", False)

            if not text:
                continue

            src_code = SPEECH_TO_TRANSLATOR.get(source_lang, source_lang)
            tgt_code = SPEECH_TO_TRANSLATOR.get(target_lang, target_lang)

            try:
                translator = GoogleTranslator(source=src_code, target=tgt_code)
                translated = translator.translate(text)
                await websocket.send_text(json.dumps({
                    "original": text,
                    "translated": translated or "",
                    "is_final": is_final,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                }))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "error": str(e),
                    "original": text,
                    "is_final": is_final,
                }))

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
