#! /bin/sh
mkdir -p .ganache
ganache-cli \
  --db .ganache \
  -l 8000038 \
  -i 1234 \
  -e 1000 \
  -a 10 \
  -u 0 \
  -b 15 \
  -m "$HDWALLET_MNEMONIC"
