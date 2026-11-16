#!/bin/sh
# Rejects commits made directly on main. Work happens on a branch with a pull request.

branch="$(git branch --show-current)"

if [ "$branch" = "main" ]; then
  echo "✖ Committing directly to main is blocked. Create a branch: git switch -c <type>/<name>"
  exit 1
fi
