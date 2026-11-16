#!/bin/sh
# The repository is public, so real lab spreadsheets must never be committed. Only the fictional
# example under src/tests/fixtures/example/ is allowed; real files go in fixtures-local/.

status=0

for file in "$@"; do
  case "$file" in
    src/tests/fixtures/example/*) ;;
    *.xls | *.xlsx | *.csv | *.XLS | *.XLSX | *.CSV)
      echo "✖ $file looks like a spreadsheet and cannot be committed. Put real files in fixtures-local/."
      status=1
      ;;
  esac
done

if [ "$status" -ne 0 ]; then
  echo "  Unstage it with: git restore --staged <file>"
fi

exit "$status"
