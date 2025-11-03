#!/bin/bash
# Auto-generate .bat and .sh files for new commands

COMMANDS=("hover" "press" "type" "upload" "reload" "back" "forward" "wait" "scroll" "content" "select" "check" "uncheck" "drag")

for cmd in "${COMMANDS[@]}"; do
  # Create .bat file
  cat > "browser-pilot-${cmd}.bat" <<EOF
@echo off
REM Browser Pilot $(echo ${cmd^}) Command
node "%~dp0..\scripts\dist\cli\cli.js" ${cmd} %*
EOF

  # Create .sh file
  cat > "browser-pilot-${cmd}.sh" <<EOF
#!/bin/bash
# Browser Pilot $(echo ${cmd^}) Command
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
node "\$SCRIPT_DIR/../scripts/dist/cli/cli.js" ${cmd} "\$@"
EOF

  chmod +x "browser-pilot-${cmd}.sh"
  echo "Created browser-pilot-${cmd}.bat and browser-pilot-${cmd}.sh"
done

echo "Done! Created ${#COMMANDS[@]} command scripts."
