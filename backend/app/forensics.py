"""Pure evidence-integrity helpers (no web framework needed, so they are easy to test)."""
import hashlib
import re
from pathlib import Path

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "txt", "eml", "csv", "json", "log"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
HASH_NOTE = ("A matching hash only shows the content equals the recorded hash; "
             "it does not prove the evidence is authentic or truthful.")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_upload(filename: str, size: int) -> str | None:
    """Return an error message, or None if the upload is acceptable. Files are never executed."""
    ext = Path(filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"File type '.{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
    if size > MAX_UPLOAD_BYTES:
        return "File is over the 5 MB limit."
    if size == 0:
        return "File is empty."
    return None


def verify_hash(data: bytes, recorded_hash: str | None) -> dict:
    """Compare current content with the hash recorded at intake."""
    computed = sha256_hex(data)
    if not recorded_hash:
        status, reason = "Unverified", "No hash was recorded earlier, so only a new hash exists."
    elif computed == recorded_hash:
        status, reason = "Verified", "Hash matches the recorded value."
    else:
        status, reason = "Failed", "SHA-256 differs from the recorded hash. Preserve the file for human review."
    return {"status": status, "computed_hash": computed, "recorded_hash": recorded_hash,
            "reasons": [reason, HASH_NOTE]}


GENESIS_HASH = "0" * 64


def chain_hash(prev_hash: str, n: int, at: str, actor: str, action: str, detail: str) -> str:
    """ARCHIVE ledger: each entry's hash covers the previous entry's hash, so edits break the chain."""
    return sha256_hex("|".join([prev_hash, str(n), at, actor, action, detail]).encode())


def verify_chain(entries: list[dict]) -> dict:
    """entries: dicts with n, at, actor, action, detail, prev_hash, entry_hash in order."""
    prev = GENESIS_HASH
    for e in entries:
        expected = chain_hash(prev, e["n"], e["at"], e["actor"], e["action"], e["detail"])
        if e["prev_hash"] != prev or e["entry_hash"] != expected:
            return {"ok": False, "broken_at": e["n"]}
        prev = e["entry_hash"]
    return {"ok": True, "broken_at": None, "count": len(entries)}


# ---- Indicator and timeline extraction (used by NEXA to build case context) ----

_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_URL_RE = re.compile(r"https?://[^\s\"'<>),]+")
_ISO_LINE_RE = re.compile(r"^(\d{4}-\d\d-\d\dT[\d:]+Z)\s+(.*)$", re.M)


def extract_indicators(text: str) -> dict:
    """Unique IPv4 addresses, URLs and URL hostnames found in free text (sorted)."""
    ips = sorted({ip for ip in _IP_RE.findall(text) if all(int(o) <= 255 for o in ip.split("."))})
    urls = sorted(set(_URL_RE.findall(text)))
    domains = sorted({re.sub(r"^https?://([^/:?#]+).*$", r"\1", u).lower() for u in urls})
    return {"ips": ips, "urls": urls, "domains": domains}


def extract_events(text: str, evidence_code: str) -> list[dict]:
    """Only timestamps that really appear in the evidence. Nothing is estimated."""
    return [{"time": t, "text": rest[:160], "evidence": evidence_code} for t, rest in _ISO_LINE_RE.findall(text)]
