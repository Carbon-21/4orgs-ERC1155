#!/bin/bash

HOST=$1
PORT=$2

function update() {
    sed -e "s/\${HOST}/$2/" \
        -e "s/\${PORT}/$3/" \
        ./$1
}


echo "$(update tmpauth.js $HOST $PORT )" > auth.js
echo "$(update tmpcollection.js $HOST $PORT )" > collection.js
echo "$(update tmpmint.js $HOST $PORT )" > mint.js
echo "$(update tmptransfer.js $HOST $PORT )" > transfer.js
echo "$(update tmpwallet.js $HOST $PORT )" > wallet.js
