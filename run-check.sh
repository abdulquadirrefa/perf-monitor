#!/bin/bash
# ── Edit the path below then run: chmod +x run-check.sh ──
cd /path/to/perf-monitor

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

LOG="logs/perf-check.log"
tail -n 2000 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"

echo "" >> "$LOG"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG"
npx playwright test >> "$LOG" 2>&1
