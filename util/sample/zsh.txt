parse_options()
{
    o_port=(-p 9999)
    o_root=(-r WWW)
    o_log=(-d ZWS.log)

    zparseopts -K -- p:=o_port r:=o_root l:=o_log h=o_help
    if [[ $? != 0 || "$o_help" != "" ]]; then
        echo Usage: $(basename "$0") "[-p PORT] [-r DIRECTORY]"
        exit 1
    fi

    port=$o_port[2]
    root=$o_root[2]
    log=$o_log[2]

    if [[ $root[1] != '/' ]]; then root="$PWD/$root"; fi
}
# now use the function:
parse_options $*
