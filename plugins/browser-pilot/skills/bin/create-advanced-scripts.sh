#!/bin/bash
# Auto-generate .bat and .sh files for advanced commands

COMMANDS=("emulate-media" "dialog" "block-url" "unblock-urls")

for cmd in "${COMMANDS[@]}"; do
  # Create .bat file
  cat > "browser-pilot-${cmd}.bat" <<EOF
@echo off
REM Browser Pilot $(echo ${cmd} | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1') Command
node "%~dp0..\scripts\dist\cli.js" ${cmd} %*
EOF

  # Create .sh file
  cat > "browser-pilot-${cmd}.sh" <<EOF
#!/bin/bash
# Browser Pilot $(echo ${cmd} | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1') Command
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
node "\$SCRIPT_DIR/../scripts/dist/cli.js" ${cmd} "\$@"
EOF

  chmod +x "browser-pilot-${cmd}.sh"
  echo "Created browser-pilot-${cmd}.bat and browser-pilot-${cmd}.sh"
done

echo "Done! Created ${#COMMANDS[@]} command scripts."
