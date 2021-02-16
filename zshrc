path=(
  "$HOME/.local/bin"
  "$HOME/.rbenv/shims"
  "$HOME/.pyenv"
  "$HOME/.cargo/bin"
  /usr/local/bin
  /usr/bin
  /bin
  /usr/sbin
  /sbin
)

fpath=(
  $fpath
  ~/.zsh/functions
  /usr/local/share/zsh-completions
  /usr/local/share/zsh/site-functions
)

# color term
export CLICOLOR=1
export LSCOLORS=Dxfxcxdxbxegedabadacad
export ZLS_COLORS=$LSCOLORS
export LC_CTYPE=en_US.UTF-8
export LESS=FRX

# make with the nice completion
autoload -U compinit; compinit

# Completion for kill-like commands
zstyle ':completion:*:*:kill:*:processes' list-colors '=(#b) #([0-9]#) ([0-9a-z-]#)*=01;34=0=01'
zstyle ':completion:*:*:*:*:processes' command "ps -u `whoami` -o pid,user,comm -w -w"
zstyle ':completion:*:ssh:*' tag-order hosts users
zstyle ':completion:*:ssh:*' group-order hosts-domain hosts-host users hosts-ipaddr

# ignore completion functions (until the _ignored completer)
zstyle ':completion:*:functions' ignored-patterns '_*'

# make with the pretty colors
autoload colors; colors

# options
setopt appendhistory autocd extendedglob histignoredups nonomatch prompt_subst

# enable mode indication
function zle-line-init zle-keymap-select {
  zle reset-prompt
}

zle -N zle-line-init
zle -N zle-keymap-select

# vim emulation
bindkey -v

# if mode indicator wasn't setup by theme, define default
if [[ "$MODE_INDICATOR" == "" ]]; then
  MODE_INDICATOR="%{$fg_bold[red]%}^%{$reset_color%}"
fi

function vi_mode_prompt_info() {
  echo "${${KEYMAP/vicmd/$MODE_INDICATOR}/(main|viins)/}"
}

# define right prompt, if it wasn't defined by a theme
if [[ "$RPS1" == "" && "$RPROMPT" == "" ]]; then
  RPS1='$(vi_mode_prompt_info)'
fi

# Bindings
# external editor support
autoload edit-command-line
zle -N edit-command-line
bindkey '^x^e' edit-command-line

# Partial word history completion
bindkey '\ep' up-line-or-search
bindkey '\en' down-line-or-search
bindkey '\ew' kill-region

# use incremental search
bindkey "^R" history-incremental-search-backward

# add some readline keys back
bindkey "^A" beginning-of-line
bindkey "^E" end-of-line

# handy keybindings
bindkey "^P" history-search-backward
bindkey "^Y" accept-and-hold
bindkey "^N" insert-last-word
bindkey -s "^T" "^[Isudo ^[A" # "t" for "toughguy"

# history
HISTFILE=~/.zsh_history
HISTSIZE=5000
SAVEHIST=10000
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY

# default apps
(( ${+PAGER}   )) || export PAGER='less'
(( ${+EDITOR}  )) || export EDITOR='vim'
export PSQL_EDITOR='vim -c"set syntax=sql"'

# setup git prompt info
source "$HOME/.zsh/git.zsh"

# prompt
PROMPT='%{$fg_bold[green]%}%n@%m%{$reset_color%} %{$fg_bold[blue]%}%2~%{$reset_color%} $(git_prompt_info)%{$reset_color%}%B»%b '

# aliases
alias mv='nocorrect mv'       # no spelling correction on mv
alias cp='nocorrect cp'
alias mkdir='nocorrect mkdir'
alias spec='nocorrect spec'
alias rspec='nocorrect rspec'
alias ll="ls -l"
alias la="ls -a"
alias l.='ls -ld .[^.]*'
alias lsd='ls -ld *(-/DN)'
alias md='mkdir -p'
alias rd='rmdir'
alias cd..='cd ..'
alias ..='cd ..'
alias spec='spec -c'
alias heroku='nocorrect heroku'

alias grep='grep --color=auto --exclude="*~"'

# heroku
alias fetch_db='heroku pg:backups capture --expire && curl -o latest.dump `heroku pg:backups public-url`'
alias restore_db='pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d'

# import local zsh customizations, if present
zrcl="$HOME/.zshrc.local"
[[ ! -a $zrcl ]] || source $zrcl

# enable rbenv
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

export PYENV_ROOT="$HOME/.pyenv"

export PATH="./bin:$PATH"

export YVM_DIR=/usr/local/opt/yvm
[ -r $YVM_DIR/yvm.sh ] && . $YVM_DIR/yvm.sh
export NVM_DIR="$HOME/.nvm"
alias start-nvm='[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

eval "$(starship init zsh)"
if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init -)"
  eval "$(pyenv virtualenv-init -)"
fi
