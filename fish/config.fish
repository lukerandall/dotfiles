fish_add_path /Applications/Postgres.app/Contents/Versions/latest/bin
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/.rbenv/shims"
fish_add_path "$HOME/.pyenv"
fish_add_path "$HOME/.cargo/bin"
fish_add_path /opt/homebrew/bin

fish_vi_key_bindings

zoxide init fish | source
starship init fish | source


