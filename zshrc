path=(
  "$HOME/.local/bin"
  "$HOME/.pyenv"
  "$HOME/.cargo/bin"
  "$HOME/.zinit/plugins/bigH---git-fuzzy/bin"
  /opt/homebrew/bin
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

# autocompletion
autoload -U compinit; compinit

# Completion for kill-like commands
zstyle ':completion:*:*:kill:*:processes' list-colors '=(#b) #([0-9]#) ([0-9a-z-]#)*=01;34=0=01'
zstyle ':completion:*:*:*:*:processes' command "ps -u `whoami` -o pid,user,comm -w -w"
zstyle ':completion:*:ssh:*' tag-order hosts users
zstyle ':completion:*:ssh:*' group-order hosts-domain hosts-host users hosts-ipaddr

# ignore completion functions (until the _ignored completer)
zstyle ':completion:*:functions' ignored-patterns '_*'

# enable colours
autoload colors; colors

# options
setopt autocd extendedglob nonomatch prompt_subst

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
setopt append_history          # append to history file
setopt inc_append_history      # write to the history file immediately, not when the shell exits
setopt hist_ignore_dups        # don't record an event that was just recorded again

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
alias ll="ls -l"
alias la="ls -a"
alias l.='ls -ld .[^.]*'
alias lsd='ls -ld *(-/DN)'
alias rspec='nocorrect rspec'
alias serve='python3 -m http.server -b localhost'
alias gh-open='gh repo view --web'

# git functions & aliases
alias changed-specs='git ls-files --modified --others spec'
alias gf='git fuzzy'
alias pushf='git push origin $(git branch --show-current) -f'

function delete-branches() {
  git branch |
    grep --invert-match '\*' |
    cut -c 3- |
    fzf --multi --preview="git log {}" |
    xargs -r git branch --delete --force
}

function pr-checkout() {
  local jq_template pr_number

  jq_template='"'\
'#\(.number) - \(.title)'\
'\t'\
'Author: \(.user.login)\n'\
'Created: \(.created_at)\n'\
'Updated: \(.updated_at)\n\n'\
'\(.body)'\
'"'

  pr_number=$(
    gh api 'repos/:owner/:repo/pulls' |
    jq ".[] | $jq_template" |
    sed -e 's/"\(.*\)"/\1/' -e 's/\\t/\t/' |
    fzf \
      --with-nth=1 \
      --delimiter='\t' \
      --preview='echo -e {2}' \
      --preview-window=top:wrap |
    sed 's/^#\([0-9]\+\).*/\1/'
  )

  if [ -n "$pr_number" ]; then
    gh pr checkout "$pr_number"
  fi
}

alias start-nvm='[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'
alias grep='grep --color=auto --exclude="*~"'

# heroku
alias heroku='nocorrect heroku'
alias fetch_db='heroku pg:backups capture --expire && curl -o latest.dump `heroku pg:backups public-url`'
alias restore_db='pg_restore --verbose --clean --no-acl --no-owner -h localhost -U $USER latest.dump -d'

# import local zsh customizations, if present
zrcl="$HOME/.zshrc.local"
[[ ! -a $zrcl ]] || source $zrcl

# pyenv
export PYENV_ROOT="$HOME/.pyenv"
if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init -)"
  eval "$(pyenv virtualenv-init -)"
fi

export PATH="./bin:$PATH"

# nvm and yvm
export YVM_DIR=/usr/local/opt/yvm
[ -r $YVM_DIR/yvm.sh ] && . $YVM_DIR/yvm.sh
export NVM_DIR="$HOME/.nvm"

# fzf
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
export FZF_CTRL_R_OPTS="${FZF_CTRL_R_OPTS:+$FZF_CTRL_R_OPTS }--preview 'echo {}' --preview-window down:5:hidden:wrap --bind '?:toggle-preview'"
export FZF_DEFAULT_OPTS='--height 40% --layout=reverse'
export FZF_DEFAULT_COMMAND='fd --type file'
export FZF_ALT_C_COMMAND='fd --type directory'

# zoxide
eval "$(zoxide init zsh)"
alias zf=__zoxide_zi

# starship
eval "$(starship init zsh)"

# zinit plugins
if [[ ! -f $HOME/.zinit/bin/zinit.zsh ]]; then
    print -P "%F{33}▓▒░ %F{220}Installing %F{33}DHARMA%F{220} Initiative Plugin Manager (%F{33}zdharma/zinit%F{220})…%f"
    command mkdir -p "$HOME/.zinit" && command chmod g-rwX "$HOME/.zinit"
    command git clone https://github.com/zdharma/zinit "$HOME/.zinit/bin" && \
        print -P "%F{33}▓▒░ %F{34}Installation successful.%f%b" || \
        print -P "%F{160}▓▒░ The clone has failed.%f%b"
fi

source "$HOME/.zinit/bin/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit

jog() {
    sqlite3 $HOME/.histdb/zsh-history.db "
  SELECT
    replace(commands.argv, '
    ', '
  ')
  FROM commands
  JOIN history ON history.command_id = commands.id
  JOIN places ON history.place_id = places.id
  WHERE history.exit_status = 0
  AND dir = '${PWD}'
  AND places.host = '${HOST}'
  AND commands.argv != 'jog'
  AND commands.argv NOT LIKE 'z %'
  AND commands.argv NOT LIKE 'cd %'
  AND commands.argv != '..'
  ORDER BY start_time DESC
  LIMIT 50
  " | fzf --no-sort | tee /dev/tty | tr -d "\n" | pbcopy
}

HISTDB_TABULATE_CMD=(sed -e $'s/\x1f/\t/g')

zinit ice depth=1
zinit light-mode for \
    zinit-zsh/z-a-as-monitor \
    zinit-zsh/z-a-patch-dl \
    zsh-users/zsh-autosuggestions \
    zsh-users/zsh-completions \
    zsh-users/zaw \
    bigH/git-fuzzy \
    reegnz/jq-zsh-plugin \
    chitoku-k/fzf-zsh-completions \
    Aloxaf/fzf-tab \
    larkery/zsh-histdb

bindkey '\e.' jq-complete

eval "$(direnv hook zsh)"
