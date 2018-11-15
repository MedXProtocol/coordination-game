#! /bin/sh

truffle install && \
  $(npm bin)/zos push --network $1 --from $ADMIN_ACCOUNT && \
  cd lambda && \
  ./lambda-build.sh && \
  cd .. && \
  cd dapp && \
  yarn && node --max-old-space-size=4096 scripts/build.js && \
  cd ..
