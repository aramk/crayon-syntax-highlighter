#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

MINIFIER='/Users/Aram/Development/Tools/yuicompressor-2.4.7.jar'
INPUT_PATH='src'
OUTPUT_PATH='min'
TE_PATH='../util/tag-editor'
COLORBOX_PATH='../util/tag-editor/colorbox'
JS_PATH='../js'

function minify {
    inputs=${@:0:$#}
    output=${@:$#}
    cat $inputs > $output
    java -jar $MINIFIER $output -o $output
}
