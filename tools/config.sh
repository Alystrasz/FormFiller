#!/bin/bash

CUR_DIR="$(pwd)"
SRC_DIR="$(dirname $(pwd))"
OUT_DIR=out
BUILD_DIR=build
NPX_EXEC="node ./node_modules/npx/index.js"

XPI_OUT="FormFiller.xpi"
CRX_OUT="FormFiller.crx"