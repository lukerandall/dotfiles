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

function jjevo
    set rev $argv[1]
    if test -z "$rev"
        set rev "@"
    end

    jj evolog --no-graph --template="builtin_log_oneline" -r $rev | fzf --preview 'echo {} | grep -oE "\b[0-9a-f]{7,}\b" | head -n 1 | xargs jj show --git | bat --language=diff --style=plain --paging=always --wrap=never --color=always' \
        --bind "enter:execute(echo {} | grep -oE '\b[0-9a-f]{7,}\b' | head -n 1 | tr -d '\n' | pbcopy)+abort"
end
