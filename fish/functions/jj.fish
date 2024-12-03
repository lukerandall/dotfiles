function jjpr
    set rev $argv[1]
    if test -z "$rev"
        set rev "@"
    end

    set bookmark $argv[2]

    if test -z "$bookmark"
        jj git push -c $rev
        set bookmark (jj bookmark list -r $rev | cut -d : -f 1)
    else
        jj bookmark create $bookmark -r $rev
        jj git push --bookmark $bookmark --allow-new
    end
    gh pr create --head $bookmark
end

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
        set -l name (jj log --no-graph -T 'change_id.shortest() ++ "\t" ++ description.first_line() ++ " "  ++ branches.join("  ") ++ "\n"' --color always | fzf --ansi | cut -f1)
        commandline -it "$name"
    else
        commandline -it "# not in a jj directory"
    end
end
bind \cj jjedit
