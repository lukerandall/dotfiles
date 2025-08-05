function jjpr
    set rev "@-"
    set bookmark ""
    set force false
    set base ""
    set gh_extra_args

    set i 1
    while test $i -le (count $argv)
        switch $argv[$i]
            case --revision -r
                set i (math $i + 1)
                set rev $argv[$i]
            case --bookmark -b
                set i (math $i + 1)
                set bookmark $argv[$i]
            case --base -B
                # Don't consume this - let it pass through to gh
                set gh_extra_args $gh_extra_args $argv[$i]
                if test $i -lt (count $argv)
                    set i (math $i + 1)
                    set gh_extra_args $gh_extra_args $argv[$i]
                end
            case --assignee -a --body --body-file -F --head -H --label -l --milestone -m --project -p --reviewer -r --template -T --title -t --recover
                # Flags that take arguments - pass through to gh
                set gh_extra_args $gh_extra_args $argv[$i]
                if test $i -lt (count $argv)
                    set i (math $i + 1)
                    set gh_extra_args $gh_extra_args $argv[$i]
                end
            case --draft -d --dry-run --editor -e --fill -f --fill-first --fill-verbose --no-maintainer-edit --web -w
                # Flags that don't take arguments - pass through to gh
                set gh_extra_args $gh_extra_args $argv[$i]
            case --force
                set force true
            case --help -h
                echo "Usage: jjpr [--revision|-r REV] [--bookmark|-b BOOKMARK] [--force] [GH_PR_CREATE_FLAGS...]"
                echo "  Use --fill/-f to auto-populate title and body from commit message"
                return 0
            case '*'
                echo "Error: Unknown argument '$argv[$i]'" >&2
                echo "Usage: jjpr [--revision|-r REV] [--bookmark|-b BOOKMARK] [--force] [GH_PR_CREATE_FLAGS...]" >&2
                return 1
        end
        set i (math $i + 1)
    end

    if test -z "$bookmark"
        jj git push -c $rev
        set bookmark (jj bookmark list -r $rev | cut -d : -f 1)
    else
        # Check if bookmark already exists
        if jj bookmark list $bookmark 2>/dev/null | grep -q .
            if test "$force" = true
                jj bookmark move -B $bookmark --to $rev
            else
                echo "Error: Bookmark '$bookmark' already exists. Use --force/-f to move it." >&2
                return 1
            end
        else
            jj bookmark create $bookmark -r $rev
        end
        jj git push --bookmark $bookmark --allow-new
    end

    set gh_args --head $bookmark
    if test (count $gh_extra_args) -gt 0
        set gh_args $gh_args $gh_extra_args
    end

    gh pr create $gh_args
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
