#!/bin/sh
# Rejects staged files that usually hold credentials: .env files (except .env.example),
# private keys and certificates.

status=0

for file in "$@"; do
  name="$(basename "$file")"
  case "$name" in
    .env.example) ;;
    .env | .env.* | *.pem | *.key | *.p12 | *.pfx | id_rsa* | id_ed25519* | credentials.json)
      echo "✖ $file looks like a credentials file and cannot be committed."
      status=1
      ;;
  esac
done

if [ "$status" -ne 0 ]; then
  echo "  Unstage it with: git restore --staged <file>"
fi

exit "$status"
