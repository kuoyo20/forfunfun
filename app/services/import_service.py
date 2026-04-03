import csv
import io
from typing import Optional


def parse_csv(file_content: bytes, encoding: str = "utf-8") -> tuple[list[str], list[dict]]:
    """Parse CSV content, return (headers, rows)."""
    try:
        text = file_content.decode(encoding)
    except UnicodeDecodeError:
        text = file_content.decode("big5", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows = list(reader)
    return headers, rows


def parse_excel(file_content: bytes) -> tuple[list[str], list[dict]]:
    """Parse Excel content, return (headers, rows)."""
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(file_content), read_only=True)
    ws = wb.active
    rows_raw = list(ws.iter_rows(values_only=True))
    if not rows_raw:
        return [], []

    headers = [str(h) if h else f"col_{i}" for i, h in enumerate(rows_raw[0])]
    rows = []
    for row in rows_raw[1:]:
        rows.append({headers[i]: (str(row[i]) if i < len(row) and row[i] is not None else "") for i in range(len(headers))})
    wb.close()
    return headers, rows


def map_and_import(rows: list[dict], mapping: dict, db, user_id: int) -> int:
    """
    Import rows into database using field mapping.
    mapping: {"first_name": "csv_column", "last_name": "csv_column", ...}
    Returns count of imported persons.
    """
    count = 0
    for row in rows:
        first_name = row.get(mapping.get("first_name", ""), "").strip()
        last_name = row.get(mapping.get("last_name", ""), "").strip()
        if not first_name and not last_name:
            continue

        email = row.get(mapping.get("email", ""), "").strip()
        phone = row.get(mapping.get("phone", ""), "").strip()
        notes = row.get(mapping.get("notes", ""), "").strip()
        company_name = row.get(mapping.get("company", ""), "").strip()
        title = row.get(mapping.get("title", ""), "").strip()
        tags_str = row.get(mapping.get("tags", ""), "").strip()

        # Create person
        db.execute(
            "INSERT INTO persons (first_name, last_name, email, phone, notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?)",
            (first_name, last_name, email, phone, notes, user_id, user_id),
        )
        db.commit()
        person_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        # Link to company if provided
        if company_name:
            company = db.execute("SELECT id FROM companies WHERE name = ?", (company_name,)).fetchone()
            if not company:
                db.execute("INSERT INTO companies (name, created_by) VALUES (?, ?)", (company_name, user_id))
                db.commit()
                company_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            else:
                company_id = company["id"]

            db.execute(
                "INSERT INTO roles (person_id, company_id, title, is_current) VALUES (?,?,?,1)",
                (person_id, company_id, title),
            )
            db.commit()

        # Tags
        if tags_str:
            for tag_name in tags_str.replace(";", ",").split(","):
                tag_name = tag_name.strip().lower()
                if not tag_name:
                    continue
                tag = db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,)).fetchone()
                if not tag:
                    db.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                    db.commit()
                    tag_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
                else:
                    tag_id = tag["id"]
                db.execute("INSERT OR IGNORE INTO person_tags (person_id, tag_id) VALUES (?,?)", (person_id, tag_id))

        db.commit()

        db.execute(
            "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
            (user_id, "person", person_id, "create", f"匯入聯絡人: {first_name} {last_name}"),
        )
        db.commit()
        count += 1

    return count
