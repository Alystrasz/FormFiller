#!/bin/bash

source "config.sh"

TARGET="ALL"
while getopts 't:' flag; do
  case "${flag}" in
    t) TARGET="${OPTARG}" ;;
  esac
done
TARGET=$(echo "$TARGET" | tr /a-z/ /A-Z/)

echo "Building in '$SRC_DIR' for target=$TARGET"
echo "Current dir is '$CUR_DIR'"

rm -rf $BUILD_DIR
mkdir -p $OUT_DIR
mkdir -p $BUILD_DIR

cp -R $SRC_DIR/_locales  $BUILD_DIR/
cp -R $SRC_DIR/src       $BUILD_DIR/
cp $SRC_DIR/*.json       $BUILD_DIR/
cp $SRC_DIR/LICENSE      $BUILD_DIR/

function build_firefox(){
	echo
	echo "**FIREFOX - BUILD**"
	find "$OUT_DIR" -name *.xpi -type f -delete 
	$NPX_EXEC web-ext sign -s "$BUILD_DIR/" -a "$OUT_DIR/" --api-key "user:13959944:771" --api-secret "0f52386de725b7614574ab522dd33c067c150bb75ad0183269af0e1b4070654b"
	mv `find $CUR_DIR/$OUT_DIR/*.xpi` "$CUR_DIR/$OUT_DIR/$XPI_OUT"
}

function build_chrome(){
	echo
	echo "**CHROME - BUILD**"
	find "$OUT_DIR" -name $CRX_OUT -type f -delete 
	$NPX_EXEC crx pack "$BUILD_DIR/" -o "$OUT_DIR/$CRX_OUT"
}

case "${TARGET}" in
    ALL) 
		echo 'Building extension for all navigators...'
		build_chrome;
		build_firefox;
		;;
    FIREFOX) 
		echo 'Building extension for FIREFOX only...'
		build_firefox;
		;;
    CHROME) 
		echo 'Building extension for CHROME only...'
		build_chrome;
		;;
esac
echo
rm -rf   $BUILD_DIR
exit 0;


