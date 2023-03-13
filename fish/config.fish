set -x EDITOR nvim
set -x GOPATH $HOME/Code/go
set -x TZ_LIST "Europe/Berlin,Berlin;Africa/Johannesburg,South Africa;US/Arizona,Arizona;US/Pacific"

fish_add_path /opt/homebrew/bin
fish_add_path /Applications/Postgres.app/Contents/Versions/latest/bin
fish_add_path /Applications/Docker.app/Contents/Resources/bin/
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$HOME/.cargo/bin"
fish_add_path "$GOPATH/bin"

function fish_greeting
  echo
  echo "Search Bindings"
  echo "Dir C-t   Git Log C-g   Git Status C-s   History C-h   Env C-v   Processes C-p"
end

set fish_greeting
set -g fish_key_bindings fish_hybrid_key_bindings

status --is-interactive; and pyenv virtualenv-init - | source
fzf_configure_bindings --directory=\ct --git_status=\cs --git_log=\cg --history=\ch --variables=\cv --processes=\cp

set LOCAL_CONFIG $HOME/.fish/local.fish
if test -e $LOCAL_CONFIG
  source $LOCAL_CONFIG
end

zoxide init fish | source
starship init fish | source
atuin init fish | source

abbr --add be bundle exec
abbr --add tf terraform
abbr --add serve python3 -m http.server -b localhost
abbr --add fetch_db "heroku pg:backups capture --expire && curl -o latest.dump (heroku pg:backups public-url)"
abbr --add restore_db "pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d"
abbr --add tag-staging "git tag -d staging; git tag staging && git push --tags --force"
abbr --add tag-test "git tag -d test; git tag test && git push --tags --force"

alias vim nvim
alias cat bat
alias less bat
alias ls exa
