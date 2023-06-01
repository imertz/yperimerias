#!/bin/bash

# Set the URL to download
url="https://www.bankofgreece.gr/statistika/xrhmatopistwtikes-agores/ekswtrapezika-epitokia"

# Set the output file name
output_file="bankofgreece.txt"

# Download the file using curl and save it to the output file
curl -o $output_file $url \
  -H 'authority: www.bankofgreece.gr' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: en-GB,en;q=0.9,en-US;q=0.8,el;q=0.7,fr;q=0.6' \
  -H 'cache-control: max-age=0' \
  -H 'if-modified-since: Thu, 01 Jun 2023 09:19:30 GMT' \
  -H 'referer: https://www.google.com/' \
  -H 'sec-ch-ua: "Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: cross-site' \
  -H 'sec-fetch-user: ?1' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57' \
  --compressed