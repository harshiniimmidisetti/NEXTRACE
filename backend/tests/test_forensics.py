import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.forensics import GENESIS_HASH, chain_hash, sha256_hex, validate_upload, verify_hash, verify_chain


class ForensicsTests(unittest.TestCase):
    def test_known_hash(self):
        self.assertEqual(sha256_hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")

    def test_verified_and_failed(self):
        h = sha256_hex(b"original")
        self.assertEqual(verify_hash(b"original", h)["status"], "Verified")
        self.assertEqual(verify_hash(b"changed", h)["status"], "Failed")
        self.assertEqual(verify_hash(b"x", None)["status"], "Unverified")

    def test_upload_validation(self):
        self.assertIsNone(validate_upload("mail.eml", 100))
        self.assertIn("not allowed", validate_upload("run.exe", 100))
        self.assertIn("5 MB", validate_upload("big.log", 6 * 1024 * 1024))
        self.assertIn("empty", validate_upload("a.txt", 0))

    def test_ledger_chain(self):
        entries, prev = [], GENESIS_HASH
        for n, (actor, action, detail) in enumerate([("ARCHIVE", "filed", "EV-0001"), ("VERITY", "verified", "EV-0001"), ("CIPHER", "analysed", "3 findings")], 1):
            h = chain_hash(prev, n, "2026-11-16T09:00:00Z", actor, action, detail)
            entries.append(dict(n=n, at="2026-11-16T09:00:00Z", actor=actor, action=action, detail=detail, prev_hash=prev, entry_hash=h)); prev = h
        self.assertTrue(verify_chain(entries)["ok"])
        entries[1]["detail"] = "EV-0009"
        self.assertEqual(verify_chain(entries), {"ok": False, "broken_at": 2})


if __name__ == "__main__":
    unittest.main()
