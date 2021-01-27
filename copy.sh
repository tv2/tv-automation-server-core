#!/bin/sh

cp ../packages/server-core-integration/LICENSE ./
cp ../packages/server-core-integration/package.json ./

rm -R dist
cp ../packages/server-core-integration/dist ./ -R
