"""LINE Notify integration.

Users obtain a personal token from https://notify-bot.line.me/my/
and paste it into their settings. We POST messages to their token.
"""
import urllib.request
import urllib.parse


def send_line_notify(token: str, message: str) -> bool:
    """Send a message via LINE Notify. Returns True on success."""
    if not token:
        return False
    try:
        data = urllib.parse.urlencode({"message": message}).encode("utf-8")
        req = urllib.request.Request(
            "https://notify-api.line.me/api/notify",
            data=data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False


def notify_user(db, user_id: int, message: str) -> bool:
    """Look up user's token and send notification."""
    row = db.execute("SELECT line_notify_token FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row or not row["line_notify_token"]:
        return False
    return send_line_notify(row["line_notify_token"], message)
