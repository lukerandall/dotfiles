set -x EDITOR nvim
set -x GOPATH $HOME/Code/go

fish_add_path /Applications/Postgres.app/Contents/Versions/latest/bin
fish_add_path /Applications/Docker.app/Contents/Resources/bin/
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$HOME/.cargo/bin"
fish_add_path "$GOPATH/bin"

set fish_greeting 
fish_vi_key_bindings

zoxide init fish | source
starship init fish | source

fzf_configure_bindings --directory=\ct --git_status=\cs --git_log=\cg --history=\cr --variables=\cv

abbr --add be bundle exec
abbr --add tf terraform
abbr --add serve python3 -m http.server -b localhost
abbr --add pushf "git push origin (git branch --show-current) -f"
abbr --add fetch_db "heroku pg:backups capture --expire && curl -o latest.dump (heroku pg:backups public-url)"
abbr --add restore_db "pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d"
abbr --add tag-staging "git tag -d staging; git tag staging && git push --tags --force"
abbr --add restart-screen-sharing "sudo defaults write /var/db/launchd.db/com.apple.launchd/overrides.plist com.apple.screensharing -dict Disabled -bool true; sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.screensharing.plist; sudo defaults write /var/db/launchd.db/com.apple.launchd/overrides.plist com.apple.screensharing -dict Disabled -bool false && sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.screensharing.plist"

alias vim nvim
alias cat bat
alias less bat
alias ls exa
