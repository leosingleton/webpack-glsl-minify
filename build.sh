#!/bin/bash

set -x # Enable command echo

TARGET="${1:-debug}"
OUT_DIR="build/$TARGET"

# Run the TypeScript compiler to produce a JavaScript bundle 
./node_modules/typescript/bin/tsc
