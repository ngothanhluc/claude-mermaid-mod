# Records demo/show-me.gif (diagram-only display, restored to both at the end): /show-me answering in a live Claude Code session, its Mermaid drawn by mermaid-mod.
# Run from the repo root: vhs demo/show-me.tape
Output demo/show-me.gif

Require claude
Require git

Set Shell zsh
Set FontSize 18
Set Width 1600
Set Height 1000
Set Padding 32
Set Theme "Catppuccin Mocha"
Set TypingSpeed 10ms
Set WindowBar Colorful

Hide
# Drop the variables a parent Claude Code session leaks into this shell.
Type `for v in ${(k)parameters[(I)CLAUDE*]}; do unset $v; done; export PLUGIN="$PWD"; rm -rf /tmp/hl-skills /tmp/login-api && git clone -q --depth 1 https://github.com/humanlayer/skills /tmp/hl-skills && mkdir /tmp/login-api && cd /tmp/login-api && clear`
Enter
Sleep 6s
Type `claude --plugin-dir "$PLUGIN" -p "/mermaid diagram" >/dev/null`
Enter
Sleep 8s
Type `claude --plugin-dir "$PLUGIN" --plugin-dir /tmp/hl-skills/plugins/show-me --model haiku --settings '{"statusLine":{"type":"command","command":"echo mermaid-mod + show-me"}}'`
Enter
Sleep 6s
# A fresh folder asks for trust first; pick "Yes".
Down
Enter
Sleep 4s
Show

Type "/show-me:show-me how a login request moves through the browser, API gateway, auth service and database. One Mermaid sequence diagram of at most 6 messages, no alt blocks, one sentence before it. No tools."
Sleep 500ms
Enter
Sleep 2s
# Skip the model's think time so the recording stays short.
Hide
Wait+Screen@120s /· done/
Show
Sleep 1s
Sleep 3s
Hide
Ctrl+C
Ctrl+C
Sleep 1s
Type `claude --plugin-dir "$PLUGIN" -p "/mermaid both" >/dev/null`
Enter
Sleep 8s
