#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

MINIFIER='/Users/Aram/Development/Tools/yuicompressor-2.4.7.jar'
INPUT_PATH='src'
OUTPUT_PATH='min'
TE_PATH='../util/tag-editor'
JS_PATH='../js'
FANCY_PATH=$JS_PATH/fancybox

function minify {
    inputs=${@:0:$#}
    output=${@:$#}
    cat $inputs > $output
    java -jar $MINIFIER $output -o $output
}
