#!/bin/bash

# Set the URL to download
url="https://www.bankofgreece.gr/statistika/xrhmatopistwtikes-agores/ekswtrapezika-epitokia"

# Set the output file name
output_file="bankofgreece.txt"

# Download the file using curl and save it to the output file
curl -o $output_file $url