import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.passwords import check_password, hash_password


class PasswordTests(unittest.TestCase):
    def test_round_trip(self):
        stored = hash_password("Demo@12345")
        self.assertTrue(check_password("Demo@12345", stored))
        self.assertFalse(check_password("wrong", stored))

    def test_salt_makes_hashes_differ(self):
        self.assertNotEqual(hash_password("same"), hash_password("same"))

    def test_malformed_stored_value_is_rejected_not_crashed(self):
        self.assertFalse(check_password("x", "not-a-valid-hash"))
        self.assertFalse(check_password("x", "zz$abc"))


if __name__ == "__main__":
    unittest.main()
