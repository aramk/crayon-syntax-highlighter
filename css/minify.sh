#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

source ../util/minify.sh

NEWPATH=../$FANCY_PATH/
FANCY_CSS=$FANCY_PATH/jquery.fancybox.css
FANCY_CSS_REPL=$FANCY_CSS.repl
test=`cat $FANCY_CSS`
URL="url('"
echo "${test//$URL/$URL$NEWPATH}" > $FANCY_CSS_REPL

minify $INPUT_PATH/admin_style.css $INPUT_PATH/crayon_style.css $FANCY_CSS_REPL $INPUT_PATH/global_style.css $OUTPUT_PATH/crayon.min.css

rm $FANCY_CSS_REPL
