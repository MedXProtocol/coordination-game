#! /bin/sh

truffle install && \
  truffle compile && \
  npm run merge-ropsten && \
  cd lambda && \
  ./lambda-build.sh && \
  cd .. && \
  cd dapp && \
  yarn && node --max-old-space-size=4096 scripts/build.js && \
  cd ..
