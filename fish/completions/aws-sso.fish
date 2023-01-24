# aws-sso command completion
function __complete_aws-sso
    set -lx COMP_LINE (commandline -cp)
    test -z (commandline -ct)
    and set COMP_LINE "$COMP_LINE "
    /opt/homebrew/bin/aws-sso
end

complete -f -c aws-sso -a "(__complete_aws-sso)"


# aws-sso command -- subcommand completion
function __fish_complete_aws_sso_subcommand
   set -l tokens (commandline -opc) (commandline -ct)
   set -l index (contains -i -- -- (commandline -opc))
   set -e tokens[1..$index]
   complete -C"$tokens"
 end

 complete -c aws-sso -n "contains -- -- (commandline -opc)" -x -a "(__fish_complete_aws_sso_subcommand)"
