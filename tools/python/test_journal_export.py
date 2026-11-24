import tempfile
import unittest
from pathlib import Path

from check_journal_export import validate


class JournalExportTests(unittest.TestCase):
    def check_text(self, content: str) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            export = Path(directory) / "journal.md"
            export.write_text(content, encoding="utf-8")
            return validate(export)

    def test_accepts_valid_export_without_exposing_content(self):
        errors = self.check_text(
            "# OPEN FEELING — Private Journal\n\n"
            "## 2026-11-24 — A title\n\nA private thought.\n"
        )
        self.assertEqual(errors, [])

    def test_rejects_invalid_date(self):
        errors = self.check_text(
            "# OPEN FEELING — Private Journal\n\n"
            "## 2026-13-45\n\nText\n"
        )
        self.assertTrue(any("invalid calendar date" in error for error in errors))

    def test_rejects_missing_header(self):
        errors = self.check_text("## 2026-11-24\n\nText\n")
        self.assertTrue(any("Missing" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
