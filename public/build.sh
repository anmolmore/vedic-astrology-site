#!/bin/bash
# Rebuilds index.html from the separate source files.
set -e
cd "$(dirname "$0")"

{
  cat shell_head.html
  echo '<script>'
  cat astronomy-engine.min.js
  echo '</script>'
  echo '<script>'
  cat calc-core.js
  echo '</script>'
  echo '<script>'
  cat shadbala.js
  echo '</script>'
  echo '<script>'
  cat interpret.js
  echo '</script>'
  echo '<script>'
  cat app.js
  echo '</script>'
  cat shell_tail.html
} > index.html

echo "Built index.html ($(wc -l < index.html) lines, $(wc -c < index.html) bytes)"
