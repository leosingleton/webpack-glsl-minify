#!/bin/bash

set -x # Enable command echo

TARGET="${1:-debug}"

# Run the TypeScript compiler to produce a JavaScript bundle 
./node_modules/typescript/bin/tsc

if [[ "$TARGET" == "test" ]]; then
  # Execute unit tests on the test target
  ./node_modules/jasmine-node/bin/jasmine-node ./build/index.spec.js
fi
