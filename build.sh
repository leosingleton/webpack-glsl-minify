#!/bin/bash

set -x # Enable command echo

TARGET="${1:-debug}"

# Run the TypeScript compiler to produce a JavaScript bundle 
./node_modules/typescript/bin/tsc

if [[ "$TARGET" == "test" ]]; then
  # Execute unit tests on the test target
  if [[ "$2" == "--debug" ]]; then
    ./node_modules/karma/bin/karma start --single-run=false
  else
    ./node_modules/karma/bin/karma start
  fi
fi
