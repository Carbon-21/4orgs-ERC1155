
#!/bin/bash
cd "$(dirname "$0")"
echo "entrou genscripts"
source ../../../.env


function update() {

    for file in ../../../public/scripts/src/*.js ; do
        echo "Updating host and port for: ${file}"
        sed -e "s/\${HOST}/$1/g" \
            -e "s/\${PORT}/$2/g"  \
            $file > ../$file

    done
}

update $HOST $PORT
