#!/bin/bash

# Format files based on their extension
# Works as a Claude Code hook by reading JSON from stdin

# Read JSON input from stdin
input=$(cat)

# Extract file path from Claude Code hook JSON payload
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Debug logging
echo "DEBUG: Hook triggered for tool: $tool_name" >&2
echo "DEBUG: File path from JSON: $file_path" >&2

# Exit if no file path found in JSON
if [ -z "$file_path" ] || [ "$file_path" = "null" ]; then
    echo "DEBUG: No file_path found in hook payload, exiting" >&2
    exit 0
fi

if [ ! -f "$file_path" ]; then
    echo "File not found: $file_path" >&2
    exit 1
fi

case "$file_path" in
    *.rb)
        if command -v rubocop >/dev/null 2>&1; then
            rubocop --autocorrect-all "$file_path"
        else
            echo "rubocop not found, skipping Ruby formatting for $file_path" >&2
        fi
        ;;
    *.html.erb)
        if command -v erb_lint >/dev/null 2>&1; then
            erb_lint --autocorrect "$file_path"
        else
            echo "erb_lint not found, skipping ERB formatting for $file_path" >&2
        fi
        ;;
    *)
        echo "No formatter configured for file type: $file_path" >&2
        ;;
esac