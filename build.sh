#!/bin/bash

set -e # Break on errors
set -x # Enable command echo

TARGET="${1:-debug}"

# Run the TypeScript compiler to produce a JavaScript bundle 
./node_modules/typescript/bin/tsc

if [[ "$TARGET" == "test" ]]; then
  # Execute unit tests on the test target
  ./node_modules/jasmine-xml-reporter/bin/jasmine.js ./build/index.spec.js --junitreport --output=build/
fi
