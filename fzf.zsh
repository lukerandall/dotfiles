# Setup fzf
# ---------
if [[ ! "$PATH" == */Users/luke/.fzf/bin* ]]; then
  export PATH="${PATH:+${PATH}:}/Users/luke/.fzf/bin"
fi

# Auto-completion
# ---------------
[[ $- == *i* ]] && source "/Users/luke/.fzf/shell/completion.zsh" 2> /dev/null

# Key bindings
# ------------
source "/Users/luke/.fzf/shell/key-bindings.zsh"
