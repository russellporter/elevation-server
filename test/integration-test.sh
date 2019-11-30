#/bin/bash

set -e

response=$(curl -s --request POST \
  --url http://localhost:3000/points/elevation \
  --header 'content-type: application/json' \
  --data '[[11.103232, 47.585855], [-123.179606, 49.388203]]')

if [ "[1642.32348632812,1058.25]" != "${response}" ]; then
  echo "The response: ${response} did not match the expected value."
  exit 1
fi;