#!/bin/bash
# Package Python backend as a single executable, output to electron/backend/
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../"

cd "$BACKEND_DIR"

echo "[1/3] Installing PyInstaller..."
pip install pyinstaller --quiet

echo "[2/3] Packaging backend..."
pyinstaller --onefile --name backend \
  --add-data "platforms:platforms" \
  --add-data "core:core" \
  --add-data "api:api" \
  --add-data "services:services" \
  --add-data "static:static" \
  main.py

echo "[3/3] Copying output to electron/backend/"
mkdir -p "$SCRIPT_DIR/backend"
cp dist/backend* "$SCRIPT_DIR/backend/"

echo "Done! Executable: $SCRIPT_DIR/backend/backend"
