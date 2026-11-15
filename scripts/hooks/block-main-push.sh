#!/bin/sh
# Rejects pushes to main. Git sends one line per ref on stdin:
# <local ref> <local sha> <remote ref> <remote sha>

status=0

while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    echo "✖ Pushing to main is blocked. Push your branch and open a pull request."
    status=1
  fi
done

exit "$status"
