#! /bin/sh
mkdir -p .ganache
ganache-cli \
  --db .ganache \
  -l 8000038 \
  -i 1234 \
  -e 100000 \
  -a 10 \
  -u 0 \
  -b 9 \
  -m "$HDWALLET_MNEMONIC"
