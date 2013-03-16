#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

MINIFIER='/Users/Aram/Development/Tools/yuicompressor-2.4.7.jar'
INPUT_PATH='src'
OUTPUT_PATH='min'
TE_PATH='../util/tag-editor'

function compile {
    #srcs=$(compile_srcs $@)
    inputs=${@:0:$#}
    output=${@:$#}
    cat $inputs > $output
    java -jar $MINIFIER $output -o $output
}

common=$"$INPUT_PATH/util.js $INPUT_PATH/jquery.popup.js $INPUT_PATH/crayon.js $INPUT_PATH/cssjson.js"
compile $common $OUTPUT_PATH/crayon.min.js
compile $common fancybox/jquery.fancybox.init.pack.js $TE_PATH/crayon_qt.js $TE_PATH/crayon_tag_editor.js $OUTPUT_PATH/crayon.te.min.js
