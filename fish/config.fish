set -x EDITOR nvim
set -x GOPATH $HOME/Code/go
set -x TZ_LIST "Europe/Berlin,Berlin;Africa/Johannesburg,South Africa;US/Arizona,Arizona;US/Pacific"

fish_add_path /opt/homebrew/bin
fish_add_path /Applications/Postgres.app/Contents/Versions/latest/bin
fish_add_path /Applications/Docker.app/Contents/Resources/bin/
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.cargo/bin"
fish_add_path "$GOPATH/bin"

set -g fish_greeting
set -g fish_key_bindings fish_hybrid_key_bindings
set -g FZF_DEFAULT_OPTS "\
--color=bg+:#363a4f,bg:#24273a,spinner:#f4dbd6,hl:#ed8796 \
--color=fg:#cad3f5,header:#ed8796,info:#c6a0f6,pointer:#f4dbd6 \
--color=marker:#f4dbd6,fg+:#cad3f5,prompt:#c6a0f6,hl+:#ed8796"

fzf_configure_bindings --directory=\ct --git_status=\cs --git_log=\cg --history=\ch --variables=\cv

set LOCAL_CONFIG $HOME/.config/fish/local.fish
if test -e $LOCAL_CONFIG
    source $LOCAL_CONFIG
end

zoxide init fish | source
starship init fish | source
atuin init fish | source

if status is-interactive
    mise activate fish | source
else
    mise activate fish --shims | source
end

source $HOME/.op/plugins.sh

abbr --add be bundle exec
abbr --add dc docker compose
abbr --add tf terraform
abbr --add nv nvim
abbr --add v nvim
abbr --add mr mise run
abbr --add serve python3 -m http.server -b localhost
abbr --add fetch_db "heroku pg:backups capture --expire && curl -o latest.dump (heroku pg:backups public-url)"
abbr --add restore_db "pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d"
abbr --add tag-staging "git tag -d staging; git tag staging && git push --tags --force"
abbr --add tag-test "git tag -d test; git tag test && git push --tags --force"
abbr --add ls eza

alias icat "kitty +kitten icat"
alias diff "kitty +kitten diff"
alias gist "gh gist create"
alias vim nvim
alias cat bat
alias less bat

# argc-completions
set -gx ARGC_COMPLETIONS_ROOT /Users/luke/Code/argc-completions
set -gx ARGC_COMPLETIONS_PATH "$ARGC_COMPLETIONS_ROOT/completions/macos:$ARGC_COMPLETIONS_ROOT/completions"
fish_add_path "$ARGC_COMPLETIONS_ROOT/bin"
# To add completions for only the specified command, modify next line e.g. set argc_scripts cargo git
set argc_scripts (ls -p -1 "$ARGC_COMPLETIONS_ROOT/completions/macos" "$ARGC_COMPLETIONS_ROOT/completions" | sed -n 's/\.sh$//p')
argc --argc-completions fish $argc_scripts | source
