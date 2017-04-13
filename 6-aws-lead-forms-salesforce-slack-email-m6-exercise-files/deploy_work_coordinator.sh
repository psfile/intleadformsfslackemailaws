#!/bin/bash

rm index.zip

zip -r index.zip .

echo "Updating Lambda"
aws lambda update-function-code \
--function-name coordinateWork \
--zip-file fileb://index.zip
