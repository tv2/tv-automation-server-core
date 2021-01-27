#!/bin/sh

cp ../packages/blueprints-integration/LICENSE ./
cp ../packages/blueprints-integration/package.json ./

rm -R dist
cp ../packages/blueprints-integration/dist ./ -R
