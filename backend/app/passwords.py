"""Password hashing (PBKDF2-HMAC-SHA256 with a per-user random salt). No third-party imports."""

import hashlib
import hmac
import secrets

ITERATIONS = 200_000


def hash_password(password: str, salt: bytes | None = None) -> str:
    """Return `salt_hex$hash_hex`. Pass `salt` only to re-derive a stored hash."""
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    """Constant-time comparison against a hash produced by `hash_password`."""
    try:
        salt_hex, _ = stored.split("$")
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), stored)
