#!/bin/sh
# Claude Code PreToolUse hook for Bash. Blocks git commands that break the project rules:
# committing on main, pushing to main, skipping hooks and staging .env files.
# Exit code 2 denies the tool call and sends the message on stderr back to Claude.

command="$(jq -r '.tool_input.command // empty')"

deny() {
  echo "Blocked by .claude/hooks/guard-git.sh: $1" >&2
  exit 2
}

case "$command" in
  *git*) ;;
  *) exit 0 ;;
esac

case "$command" in
  *--no-verify* | *"git commit -n"*)
    deny "skipping git hooks (--no-verify) is not allowed."
    ;;
esac

if printf '%s' "$command" | grep -Eq 'git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?commit'; then
  branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)"
  if [ "$branch" = "main" ]; then
    deny "committing on main is not allowed. Create a branch first."
  fi
fi

if printf '%s' "$command" | grep -Eq 'git[[:space:]].*push.*([[:space:]:]|refs/heads/)main([[:space:]]|$)'; then
  deny "pushing to main is not allowed. Push a branch and open a pull request."
fi

if printf '%s' "$command" | grep -Eq 'git[[:space:]].*add.*(^|[[:space:]/])\.env' \
  && ! printf '%s' "$command" | grep -Eq '\.env\.example([[:space:]]|$)'; then
  deny ".env files must never be staged."
fi

exit 0
