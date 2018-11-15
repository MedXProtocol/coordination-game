#! /bin/sh

truffle install && \
  npm run push && \
  cd lambda && \
  ./lambda-build.sh && \
  cd .. && \
  cd dapp && \
  yarn && node --max-old-space-size=4096 scripts/build.js && \
  cd ..
