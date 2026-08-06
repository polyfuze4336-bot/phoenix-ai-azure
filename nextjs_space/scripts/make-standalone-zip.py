#!/usr/bin/env python3
"""Package the Next.js standalone build into a deploy zip with forward-slash
arcnames (Compress-Archive on Windows produces backslash paths that break the
Linux App Service runtime). Flattens .next/standalone/nextjs_space/* to the zip
root and layers in .next/static and public."""
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STANDALONE = os.path.join(ROOT, ".next", "standalone", "nextjs_space")
STATIC = os.path.join(ROOT, ".next", "static")
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(ROOT, "deploy.zip")


def _long(path):
    # Windows extended-length prefix to survive >260 char node_modules paths.
    if os.name == "nt":
        p = os.path.abspath(path)
        if not p.startswith("\\\\?\\"):
            return "\\\\?\\" + p
    return path


def add_tree(zf, base, arc_prefix):
    count = 0
    for dirpath, _dirs, files in os.walk(_long(base)):
        for name in files:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, _long(base)).replace(os.sep, "/")
            arc = f"{arc_prefix}/{rel}" if arc_prefix else rel
            zf.write(full, arc)
            count += 1
    return count


def main():
    if not os.path.isdir(STANDALONE):
        print(f"ERROR: standalone dir missing: {STANDALONE}", file=sys.stderr)
        return 1
    if os.path.exists(OUT):
        os.remove(OUT)
    total = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        total += add_tree(zf, STANDALONE, "")
        total += add_tree(zf, STATIC, ".next/static")
        if os.path.isdir(PUBLIC):
            total += add_tree(zf, PUBLIC, "public")
    size_mb = os.path.getsize(OUT) / (1024 * 1024)
    print(f"wrote {OUT} with {total} files, {size_mb:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
