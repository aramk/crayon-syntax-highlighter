#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

CLOSURE_PATH='/Users/Aram/Development/Tools/closure_compiler.jar'
INPUT_PATH='src'
OUTPUT_PATH='min'
TE_PATH='../util/tag-editor'

function compile_srcs {
    srcs=''
    for ((i=1;i<=$#;i++))
    do
        file=${!i}
        if [ $i -eq $# ]; then
            srcs+=' --js_output_file='$file.js
        else
            srcs+=' --js='$file.js
        fi
    done
    echo $srcs
}

function compile {
    srcs=$(compile_srcs $@)
    java -jar $CLOSURE_PATH $srcs
}

common=$"$INPUT_PATH/util $INPUT_PATH/jquery.popup $INPUT_PATH/crayon $INPUT_PATH/cssjson"
compile $common $OUTPUT_PATH/crayon.min
compile $common fancybox/jquery.fancybox.init.pack $TE_PATH/crayon_qt $TE_PATH/crayon_tag_editor $OUTPUT_PATH/crayon.te.min
