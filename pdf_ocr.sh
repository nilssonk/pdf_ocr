#!/bin/bash

set -e

my_parallel () {
	while [ "$(jobs | wc -l)" -ge $((3 * $(nproc --all) / 2)) ]
	do
		wait -n
	done
	"$@" &
}

if [ ! $# -eq 1 ]; then
    echo "Invalid number of arguments" 1>&2
    exit -1
fi

INPUT_FILE="$(realpath "$1")"

if [ ! -f "${INPUT_FILE}" ]; then
    echo "Input must be a regular file" 1>&2
    exit -1
fi

TMP_DIR="$(mktemp -d)"
gs -dNOPAUSE -dBATCH \
    -sDEVICE=jpeg -r300x300 \
    -sOutputFile="${TMP_DIR}/page-%03d.jpg" \
    -f "${INPUT_FILE}" > /dev/null 2>&1

##############
pushd "${TMP_DIR}" > /dev/null
##############
for i in ./*.jpg; do
    OMP_THREAD_LIMIT=1 my_parallel tesseract $i ${i%.*} > /dev/null 2>&1
done
wait

OUTPUT_FILE="${INPUT_FILE%.*}.zip" 

zip "${OUTPUT_FILE}" ./*.txt > /dev/null 2>&1
##############
popd > /dev/null
##############

rm -rf "${TMP_DIR}"

echo ${OUTPUT_FILE}
