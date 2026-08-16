#!/usr/bin/env bash
set -euo pipefail

target_sha="${1:-}"
if [[ ! "${target_sha}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: scripts/rollback-demo.sh <full-40-character-git-sha>" >&2
  exit 2
fi

git cat-file -e "${target_sha}^{commit}"

read -r -p "Deploy the existing Phoenix AI image for ${target_sha}? [y/N] " answer
if [[ ! "${answer}" =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled."
  exit 0
fi

gh workflow run deploy.yml --ref main -f "target_sha=${target_sha}"
echo "Rollback requested for ${target_sha}. The workflow summary will record the restored revision."