#!/bin/bash

# commit-to-main.sh
# Stages all tracked changes, commits with a message, and pushes to main.

if [ -z "$1" ]; then
  echo "Usage: ./commit-to-main.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Preparing to commit to main..."

git add -A

echo "📝 Commit message: $COMMIT_MESSAGE"

git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
  echo "❌ Commit failed. Resolve any issues and try again."
  exit 1
fi

echo "⬆️  Pushing to main..."

git push origin main

if [ $? -ne 0 ]; then
  echo "❌ Push failed. Fix the push issue and retry."
  exit 1
fi

echo "✅ Changes committed and pushed to main successfully."
