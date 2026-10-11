#!/usr/bin/env bash
# Local macOS/Linux CAD smoke-test environment; never modifies Homebrew/system Python.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-cad.txt
printf '\nCAD dependencies installed inside .venv. Run: npm run test:cad\n'
