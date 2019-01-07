#!/bin/bash

set -e # Break on errors
set -x # Enable command echo

echo `pwd` >&2
npm publish
