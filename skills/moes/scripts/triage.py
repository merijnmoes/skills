#!/usr/bin/env python3
"""Phase-0 triage for moes: diff size, time estimate, risk flags.

Stdlib only. Never installs anything, never touches the network.
Degrades gracefully: any git failure prints UNKNOWN fields, never crashes.

Usage:
  python3 triage.py --base main [--head HEAD]
  python3 triage.py --numstat-file <file> --names-file <file>  # offline / tests

Output: compact human + machine-readable block for the Evidence Pack.
"""
import argparse
import re
import subprocess
import sys

SECURITY_HINTS = re.compile(
    r"auth|login|session|token|cookie|oauth|password|crypto|secret|"
    r"permission|rbac|acl|sso|mfa|jwt",
    re.I,
)
MIGRATION_HINTS = re.compile(
    r"migrat|schema\.sql|alembic|prisma|typeorm|backfill|\.sql$",
    re.I,
)
CONFIG_HINTS = re.compile(
    r"\.env|Dockerfile|docker-compose|helm/|terraform|\.tf$|"
    r"k8s/|manifests/|feature.?flag|config\.ya?ml",
    re.I,
)
TEST_HINTS = re.compile(r"(test|spec)[-_.]|__tests__|\.test\.|_test\.", re.I)


def run(cmd):
    try:
        out = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30, check=False
        )
        return out.stdout if out.returncode == 0 else ""
    except Exception:
        return ""


def parse_numstat(text):
    files = []
    added = deleted = 0
    for line in text.splitlines():
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        a, d, path = parts
        try:
            ai = int(a) if a != "-" else 0
            di = int(d) if d != "-" else 0
        except ValueError:
            ai = di = 0
        files.append(path)
        added += ai
        deleted += di
    return files, added, deleted


def size_bucket(total):
    if total < 50:
        return "XS"
    if total < 200:
        return "S"
    if total < 500:
        return "M"
    if total < 1500:
        return "L"
    return "XL"


def time_estimate(size):
    return {"XS": "15-30m", "S": "30-60m", "M": "1-2h", "L": "2-4h", "XL": "4h+ split advised"}[size]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="main")
    ap.add_argument("--head", default="HEAD")
    ap.add_argument("--numstat-file", default=None)
    ap.add_argument("--names-file", default=None)
    args = ap.parse_args()

    if args.numstat_file:
        try:
            with open(args.numstat_file) as f:
                numstat = f.read()
        except OSError:
            numstat = ""
        names = []
        if args.names_file:
            try:
                with open(args.names_file) as f:
                    names = [l.strip() for l in f if l.strip()]
            except OSError:
                names = []
        if not names:
            names = [l.split("\t")[-1] for l in numstat.splitlines() if "\t" in l]
    else:
        numstat = run(["git", "diff", f"{args.base}...{args.head}", "--numstat"])
        if not numstat:
            numstat = run(["git", "diff", "--numstat"])
        names_txt = run(["git", "diff", f"{args.base}...{args.head}", "--name-only"])
        if not names_txt:
            names_txt = run(["git", "diff", "--name-only"])
        names = [l.strip() for l in names_txt.splitlines() if l.strip()]

    files, added, deleted = parse_numstat(numstat)
    if not files:
        files = names
    total = added + deleted
    size = size_bucket(total)

    has_tests = any(TEST_HINTS.search(f) for f in files)
    src_files = [f for f in files if not TEST_HINTS.search(f)]
    flags = []
    if src_files and not has_tests:
        flags.append("NO_TEST_CHANGES")
    if any(SECURITY_HINTS.search(f) for f in files):
        flags.append("SECURITY_SURFACE")
    if any(MIGRATION_HINTS.search(f) for f in files):
        flags.append("MIGRATION_DATA")
    if any(CONFIG_HINTS.search(f) for f in files):
        flags.append("CONFIG_ROLLOUT")
    if total > 500:
        flags.append("LARGE_DIFF_SHARD")
    if not files:
        flags.append("UNKNOWN_EMPTY_DIFF")

    print(f"size: {size} ({added}+{deleted} across {len(files)} files)")
    print(f"estimate: {time_estimate(size)}")
    print(f"flags: {', '.join(flags) if flags else 'none'}")
    print(f"test_files_touched: {'yes' if has_tests else 'no'}")
    top = sorted(files)[:15]
    if top:
        print("files:")
        for f in top:
            print(f"  - {f}")
        if len(files) > 15:
            print(f"  ... +{len(files) - 15} more")


if __name__ == "__main__":
    sys.exit(main())
