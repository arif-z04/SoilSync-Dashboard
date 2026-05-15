#!/usr/bin/env bash
set -euo pipefail

# run-all.sh — start serial server and Next.js app together
# Usage: ./run-all.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found in PATH; please install Node.js/npm"
  exit 1
fi

LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

echo "Starting serial server (logs: $LOG_DIR/serial.log)..."
npm run serial >"$LOG_DIR/serial.log" 2>&1 &
SERIAL_PID=$!
echo "Serial server started (PID=$SERIAL_PID)"

echo "Starting Next.js dev server (logs: $LOG_DIR/next.log)..."
npm run dev >"$LOG_DIR/next.log" 2>&1 &
NEXT_PID=$!
echo "Next.js started (PID=$NEXT_PID)"

cleanup() {
  echo "Stopping processes..."
  if [ -n "${NEXT_PID:-}" ] && kill -0 "$NEXT_PID" 2>/dev/null; then
    kill "$NEXT_PID" || true
  fi
  if [ -n "${SERIAL_PID:-}" ] && kill -0 "$SERIAL_PID" 2>/dev/null; then
    kill "$SERIAL_PID" || true
  fi
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Logs: $LOG_DIR/ (tail with 'tail -f logs/next.log')"

wait "$NEXT_PID" "$SERIAL_PID" || true
