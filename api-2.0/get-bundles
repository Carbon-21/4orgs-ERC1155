#!/bin/bash
cd "$(dirname "$0")"
#install node modules if they are not installed already
echo "Installing node modules if they are not installed already"
if [ -d ./node_modules/babelify ]; then
  echo "     Folder node_modules already exists (including new dependency babelify) --> OK"
else
  echo "Folder node_modules doesn't exist OR new dependency babelify isn't installed --> Running npm install"
  npm install
fi

#install browserify globally if it's not installed already
echo "Installing browserify globally if not installed already"
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
if [[ ":$PATH:" == *".npm-global/bin"* ]]; then
  echo "     Your path already includes ~/npm-global/bin --> OK"
else
  echo "     Your path is missing ~/.npm-global/bin --> Adding it"
  echo "     export PATH=~/.npm-global/bin:$PATH" >> ~/.profile
fi
source ~/.profile
[ -f ~/.npm-global/bin/browserify ] || npm install -g browserify

#create public scripts
cd public/scripts/src
chmod +x genscripts.sh
./genscripts.sh
cd ../../..

#create directory where the bundles will be stored
mkdir -p ./public/scripts/bundles/

#create auth-bundle.js
echo "Creating auth-bundle.js"
browserify ./public/scripts/auth.js > ./public/scripts/bundles/auth-bundle.js -t babelify

#create wallet-bundle.js
echo "Creating wallet-bundle.js"
browserify ./public/scripts/wallet.js > ./public/scripts/bundles/wallet-bundle.js -t babelify

#create mint-bundle.js
echo "Creating mint-bundle.js"
browserify ./public/scripts/mint.js > ./public/scripts/bundles/mint-bundle.js -t babelify

#create logs-bundle.js
echo "Creating logs-bundle.js"
browserify ./public/scripts/logs.js > ./public/scripts/bundles/logs-bundle.js -t babelify