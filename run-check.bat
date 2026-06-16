@echo off
cd /d C:\Users\abdulQ\Downloads\perf-monitor\perf-monitor
echo === %DATE% %TIME% === >> logs\perf-check.log
npx playwright test >> logs\perf-check.log 2>&1
