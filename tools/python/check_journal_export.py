#!/usr/bin/env python3
"""Validate a locally exported OPEN FEELING journal without printing its contents."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from datetime import date

ENTRY_HEADING = re.compile(r"^## (\d{4}-\d{2}-\d{2})(?: — .*)?$")


def validate(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"Cannot read export: {exc}"]

    errors: list[str] = []
    if not text.startswith("# OPEN FEELING — Private Journal"):
        errors.append("Missing OPEN FEELING private journal export header.")

    headings = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if line.startswith("## "):
            match = ENTRY_HEADING.match(line)
            if not match:
                errors.append(f"Line {line_number}: invalid entry heading.")
                continue
            try:
                date.fromisoformat(match.group(1))
            except ValueError:
                errors.append(f"Line {line_number}: invalid calendar date.")
                continue
            headings.append((line_number, match.group(1)))

    if not headings:
        errors.append("No journal entries were found.")

    for index, (line_number, _) in enumerate(headings):
        end = headings[index + 1][0] - 1 if index + 1 < len(headings) else len(text.splitlines())
        body = text.splitlines()[line_number:end]
        if not any(part.strip() for part in body):
            errors.append(f"Line {line_number}: entry has no content.")

    if len({entry_date for _, entry_date in headings}) != len(headings):
        errors.append("Multiple entries share a date. This is allowed, but check the export if unexpected.")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python tools/python/check_journal_export.py <journal-export.md>")
        return 2

    errors = validate(Path(sys.argv[1]))
    if errors:
        for error in errors:
            print(f"WARNING: {error}")
        return 1

    print("Journal export structure looks valid. Contents were not displayed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
