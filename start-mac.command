#!/bin/bash
set -e
cd "$(dirname "$0")"
printf '\nAeroForge v0.2 — opening http://localhost:8080\n\n'
(sleep 2; open http://localhost:8080) &
python3 -m http.server 8080
