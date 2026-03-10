# jjpr lives in bin/jjpr (symlinked to ~/.local/bin), not here: a fish function
# cannot be called by anything that is not a fish shell, and tools that shell
# out under sh/zsh just get "command not found". Defining it here as well would
# shadow the script for interactive fish only, so the two would drift apart.
# The `complete -c jjpr` rules below still apply — completions do not care
# whether the command is a function or an executable.

function jjfr
    jj git fetch
    jj new main
end

function grepsha
    grep -oE "\b[0-9a-f]{7,}\b"
end

function jjevo
    set rev $argv[1]
    if test -z "$rev"
        set rev "@"
    end

    jj evolog --no-graph --template="builtin_log_oneline" -r $rev |
        fzf --preview 'echo {} | grepsha | head -n 1 | xargs jj show --git | bat --language=diff --style=plain --paging=always --wrap=never --color=always' \
            --bind "enter:execute(echo {} | grepsha | head -n 1 | tr -d '\n' | pbcopy)+abort"
end

function jjedit
    if test -d .jj
        set -l name (jj log -r "all()" --no-graph -T 'change_id.shortest() ++ "\t" ++ description.first_line() ++ " "  ++ bookmarks.join("  ") ++ "\n"' --color always | fzf --ansi | cut -f1)
        commandline -it "$name"
    else
        commandline -it "# not in a jj directory"
    end
end
bind \cj jjedit

# Completions for jjpr
complete -c jjpr -s r -l revision -d 'Revision to create PR for' -f -r -k -a '(jj log -r "(open() | recent() | mutable() | last(20)) & ~empty()" --no-graph -T "change_id.shortest() ++ \"\\t(\" ++ description.first_line() ++ \")\\n\"" 2>/dev/null)'
complete -c jjpr -s b -l bookmark -d 'Bookmark name for the PR' -f -r -k -a '(jj log -r "bookmarks()" --no-graph -T "bookmarks.map(|b| b.name()).join(\"\\n\") ++ \"\\n\"" 2>/dev/null)'
complete -c jjpr -l force -d 'Force move existing bookmark' -f

# gh pr create flags
complete -c jjpr -l base -s B -d 'Base branch for the PR' -f -r -k -a '(jj log -r "bookmarks()" --no-graph -T "bookmarks.map(|b| b.name()).join(\"\\n\") ++ \"\\n\"" 2>/dev/null)'
complete -c jjpr -l draft -d 'Create a draft pull request'
complete -c jjpr -l title -d 'Title for the pull request' -r
complete -c jjpr -l body -d 'Body for the pull request' -r
complete -c jjpr -l assignee -d 'Assign pull request to people' -r
complete -c jjpr -l label -d 'Add labels to pull request' -r
complete -c jjpr -l reviewer -d 'Request reviews from people' -r
complete -c jjpr -l milestone -d 'Add the pull request to a milestone' -r
complete -c jjpr -l project -d 'Add the pull request to projects' -r
