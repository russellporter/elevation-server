#/bin/bash

set -e

ENDPOINT_URL=${ENDPOINT_URL:-http://localhost:3000}

response=$(curl -s --request POST \
  --url $ENDPOINT_URL/points/elevation \
  --header 'content-type: application/json' \
  --data '[[47.585855, 11.103232], [49.388203, -123.179606], [37.0000405, 138.0710776], [44.9999945, 6.2288907], [45.000069499999995, 6.228399100000002]]')

if [ "[1642.32,1058.25,null,2327.32,2731.32]" != "${response}" ]; then
  echo "The response: ${response} did not match the expected value."
  exit 1
fi;

echo "Test passed"
