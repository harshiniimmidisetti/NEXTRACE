import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import Settings


class SettingsTests(unittest.TestCase):
    def test_defaults_and_cors_parsing(self):
        env = {"CORS_ORIGINS": "http://a.example, https://b.example ,", "JWT_SECRET": ""}
        with mock.patch.dict(os.environ, env, clear=True):
            s = Settings.from_env()
        self.assertEqual(s.cors_origins, ("http://a.example", "https://b.example"))
        self.assertEqual(s.nexa_daily_limit, 50)
        self.assertEqual(s.nexa_max_tokens, 800)

    def test_weak_or_missing_secret_stops_start_up(self):
        with mock.patch.dict(os.environ, {"JWT_SECRET": "short"}, clear=True):
            with self.assertRaises(RuntimeError):
                Settings.from_env().validate()

    def test_strong_secret_is_accepted(self):
        with mock.patch.dict(os.environ, {"JWT_SECRET": "x" * 32}, clear=True):
            Settings.from_env().validate()


if __name__ == "__main__":
    unittest.main()
