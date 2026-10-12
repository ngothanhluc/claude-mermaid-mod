# Records demo/demo.gif, demo/demo.mp4 and demo/demo.png from a live Claude Code session.
# Run from the repo root: vhs demo/demo.tape
# Then the 16:9 social card: ffmpeg -y -i demo/demo.png -vf crop=1600:900:0:0 demo/social.png
Output demo/demo.gif
Output demo/demo.mp4

Require claude

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
Type `for v in ${(k)parameters[(I)CLAUDE*]}; do unset $v; done; export PLUGIN="$PWD"; rm -rf /tmp/checkout-api && mkdir /tmp/checkout-api && cd /tmp/checkout-api && clear`
Enter
# The display setting is machine-wide; record the default.
Type `claude --plugin-dir "$PLUGIN" -p "/mermaid both" >/dev/null`
Enter
Sleep 8s
Type `claude --plugin-dir "$PLUGIN" --model haiku --settings '{"statusLine":{"type":"command","command":"echo mermaid-mod"}}'`
Enter
Sleep 6s
# A fresh folder asks for trust first; pick "Yes".
Down
Enter
Sleep 4s
Show

Type "Draw the checkout flow as a mermaid flowchart LR: cart, validate stock, a decision on payment, then confirm or retry. Short labels. One sentence before it, nothing after. No tools."
Sleep 500ms
Enter
Sleep 2s
# Skip the model's think time so the recording stays short.
Hide
Wait+Screen@90s /· done/
Show
Sleep 1s
Screenshot demo/demo.png
Sleep 4s
