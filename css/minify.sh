#!/bin/bash
BASEDIR=$(dirname $0)
cd $BASEDIR

source ../util/minify.sh

compile $INPUT_PATH/admin_style.css $INPUT_PATH/crayon_style.css $INPUT_PATH/global_style.css $FANCY_PATH/jquery.fancybox.css $OUTPUT_PATH/crayon.min.css
