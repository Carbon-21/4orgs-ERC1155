
#!/bin/bash
cd "$(dirname "$0")"
source ../../../.env

function update() {

    for file in *.js ; do
        echo "Updating host and port for: ${file}"
        sed -e "s/\${HOST}/$1/g" \
            -e "s/\${PORT}/$2/g"  \
            $file > ../$file

    done
}

update $HOST $PORT
