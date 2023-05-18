#/bin/bash

set -e

ENDPOINT_URL=${ENDPOINT_URL:-http://localhost:3000}

response=$(curl -s --request POST \
  --url $ENDPOINT_URL/points/elevation \
  --header 'content-type: application/json' \
  --data '[[11.103232, 47.585855], [-123.179606, 49.388203]]')

if [ "[1642.32,1058.25]" != "${response}" ]; then
  echo "The response: ${response} did not match the expected value."
  exit 1
fi;

echo "Test passed"
