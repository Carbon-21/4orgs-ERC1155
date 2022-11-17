
#!/bin/bash

source ../../../.env

function update() {

    for file in *.js ; do
        echo $file
        sed -e "s/\${HOST}/$1/g" \
            -e "s/\${PORT}/$2/g"  \
            $file > ../$file

    done
}

update $HOST $PORT
