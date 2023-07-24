#/bin/bash

set -e

ENDPOINT_URL=${ENDPOINT_URL:-http://localhost:3000}

response=$(curl -s --request POST \
  --url $ENDPOINT_URL/points/elevation \
  --header 'content-type: application/json' \
  --data '[[47.585855, 11.103232], [49.388203, -123.179606]]')

if [ "[1642.3,1058.3]" != "${response}" ]; then
  echo "The response: ${response} did not match the expected value."
  exit 1
fi;

echo "Test passed"
