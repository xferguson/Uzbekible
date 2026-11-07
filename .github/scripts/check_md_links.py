#!/usr/bin/env python3
"""Fail if any relative Markdown link in the repo points to a missing file."""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
SKIP_DIRS = {".git", "node_modules", "dist", "coverage", "playwright-report"}

errors = []
for md in ROOT.rglob("*.md"):
    if any(part in SKIP_DIRS for part in md.relative_to(ROOT).parts):
        continue
    in_code = False
    for lineno, line in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
        if line.lstrip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        for target in LINK.findall(line):
            if re.match(r"^[a-z]+:", target) or target.startswith("#"):
                continue
            path = target.split("#", 1)[0]
            if not path:
                continue
            if not (md.parent / path).exists():
                errors.append(f"{md.relative_to(ROOT)}:{lineno}: broken link -> {target}")

for e in errors:
    print(f"::error::{e}")
print(f"Checked links; {len(errors)} broken.")
sys.exit(1 if errors else 0)
