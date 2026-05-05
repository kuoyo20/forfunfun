import csv
import io

COMPANY_SIGNS = ['公司', '股份', '有限', '集團', '企業', '機構', '協會', '學院', '大學', '醫院', '研究院', '基金會', 'ltd', 'corp', 'inc', 'llc', 'co.']

def looks_like_company(val):
    v = (val or '').lower()
    return any(k in v for k in COMPANY_SIGNS)


def parse_csv(file_content: bytes, encoding: str = "utf-8") -> tuple[list[str], list[dict]]:
    try:
        text = file_content.decode(encoding)
    except UnicodeDecodeError:
        text = file_content.decode("big5", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows = list(reader)
    return headers, rows


def parse_excel(file_content: bytes) -> tuple[list[str], list[dict]]:
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


def find_duplicates(rows: list[dict], mapping: dict, db) -> list[dict]:
    """Check for potential duplicates. Returns list of {row_index, existing_person} dicts."""
    dupes = []
    for i, row in enumerate(rows):
        email = row.get(mapping.get("email", ""), "").strip()
        first_name = row.get(mapping.get("first_name", ""), "").strip()

        if email:
            existing = db.execute(
                "SELECT id, first_name, last_name, email FROM persons WHERE email = ?", (email,)
            ).fetchone()
            if existing:
                dupes.append({"row_index": i, "match_field": "email", "existing": dict(existing),
                              "new_name": first_name})
                continue

        if first_name:
            existing = db.execute(
                "SELECT id, first_name, last_name, email FROM persons WHERE first_name = ?",
                (first_name,),
            ).fetchone()
            if existing:
                dupes.append({"row_index": i, "match_field": "name", "existing": dict(existing),
                              "new_name": first_name})

    return dupes


def map_and_import(rows: list[dict], mapping: dict, db, user_id: int, skip_indices: set = None) -> tuple[int, int]:
    """
    Import rows into database using field mapping.
    Returns (imported_count, skipped_count).
    """
    if skip_indices is None:
        skip_indices = set()
    count = 0
    skipped = 0
    for i, row in enumerate(rows):
        if i in skip_indices:
            skipped += 1
            continue

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

        # last_name is now english_name in the new model
        db.execute(
            "INSERT INTO persons (first_name, last_name, email, phone, notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?)",
            (first_name, last_name, email, phone, notes, user_id, user_id),
        )
        db.commit()
        person_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

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
            (user_id, "person", person_id, "create", f"匯入聯絡人: {first_name}"),
        )
        db.commit()
        count += 1

    return count, skipped


def smart_import(rows: list[dict], mapping: dict, db, user_id: int) -> tuple[int, int, list]:
    """
    Import with auto-merge: same name + company → merge (keep longer/complete values).
    Returns (new_count, merged_count, merge_log).
    """
    new_count = 0
    merged_count = 0
    merge_log = []

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

        # Check for existing person with same name + company
        existing = None
        if first_name:
            candidates = db.execute(
                "SELECT p.* FROM persons p WHERE LOWER(TRIM(p.first_name)) = ?",
                (first_name.lower(),)
            ).fetchall()
            for c in candidates:
                if company_name:
                    c_role = db.execute("""
                        SELECT c.name FROM roles r JOIN companies c ON c.id = r.company_id
                        WHERE r.person_id = ? AND LOWER(c.name) = ?
                    """, (c["id"], company_name.lower())).fetchone()
                    if c_role:
                        existing = c
                        break
                elif not company_name and len(candidates) == 1:
                    existing = candidates[0]
                    break

        if existing:
            # Merge: update fields with longer/more complete values
            updates = {}
            for field, new_val in [("email", email), ("phone", phone), ("notes", notes)]:
                old_val = existing[field] or ""
                if new_val and len(new_val) > len(old_val):
                    updates[field] = new_val

            if updates:
                set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
                db.execute(
                    f"UPDATE persons SET {set_clause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    list(updates.values()) + [user_id, existing["id"]]
                )
                db.commit()

            merged_count += 1
            merge_log.append({"name": first_name, "company": company_name})
        else:
            # New person
            db.execute(
                "INSERT INTO persons (first_name, last_name, email, phone, notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?)",
                (first_name, last_name, email, phone, notes, user_id, user_id),
            )
            db.commit()
            person_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

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
                (user_id, "person", person_id, "create", f"匯入聯絡人: {first_name}"),
            )
            db.commit()
            new_count += 1

    return new_count, merged_count, merge_log


def export_persons_csv_selected(db, person_ids: list[int]) -> str:
    """Export selected persons as CSV string."""
    placeholders = ",".join(["?"] * len(person_ids))
    persons = db.execute(f"SELECT * FROM persons WHERE id IN ({placeholders}) ORDER BY first_name", person_ids).fetchall()
    return _export_persons_to_csv(db, persons)


def export_persons_csv(db) -> str:
    """Export all persons with their roles and tags as CSV string."""
    persons = db.execute("SELECT * FROM persons ORDER BY first_name, last_name").fetchall()
    return _export_persons_to_csv(db, persons)


def _export_persons_to_csv(db, persons) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["姓名", "英文名", "Email", "電話", "公司", "職稱", "工作Email", "工作電話", "在職", "標籤", "備註"])

    for p in persons:
        pid = p["id"]
        roles = db.execute("""
            SELECT r.*, c.name as company_name FROM roles r
            LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ?
        """, (pid,)).fetchall()
        tags = db.execute("""
            SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?
        """, (pid,)).fetchall()
        tag_str = ", ".join(t["name"] for t in tags)

        if roles:
            for r in roles:
                writer.writerow([
                    p["first_name"], p["last_name"], p["email"] or "", p["phone"] or "",
                    r["company_name"] or "", r["title"] or "", r["work_email"] or "", r["work_phone"] or "",
                    "Y" if r["is_current"] else "N", tag_str, p["notes"] or "",
                ])
        else:
            writer.writerow([
                p["first_name"], p["last_name"], p["email"] or "", p["phone"] or "",
                "", "", "", "", "", tag_str, p["notes"] or "",
            ])

    return output.getvalue()
