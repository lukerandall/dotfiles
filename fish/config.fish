fish_add_path /Applications/Postgres.app/Contents/Versions/latest/bin
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$HOME/.cargo/bin"

set fish_greeting 
fish_vi_key_bindings

zoxide init fish | source
starship init fish | source

abbr --add be bundle exec
abbr --add serve python3 -m http.server -b localhost
abbr --add pushf "git push origin (git branch --show-current) -f"
abbr --add fetch_db "heroku pg:backups capture --expire && curl -o latest.dump (heroku pg:backups public-url)"
abbr --add restore_db "pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d"

alias vim nvim

