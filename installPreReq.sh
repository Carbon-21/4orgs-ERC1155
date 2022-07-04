#!/bin/bash

# installPreReq - Script para instalacao dos pre requisitos necessarios
# para rodar o hl fabric
# Instala - Curl, Go, Docker, Docker-compose, node, npm, git
# Por fim lista a versao dos pacotes instalados para uma verificacao

# Atualizando lista de pacotes
sudo apt-get update

# Instalador dos prerequisitos para instalacao do bc
# Obtendo cURL
echo Obtendo cURL
sudo apt-get install curl

# Obtendo GO
echo Obtendo Go...
sudo apt-get install golang
## Carregando go no path
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Obtendo Docker
echo Obtendo Docker
sudo apt-get install docker

# Obtendo Docker-compose
echo Obtendo Docker Compose
sudo apt-get install docker-compose
# Obtendo Node
echo Obtendo Node...
sudo apt-get install nodejs

# Obtendo Npm
echo Obtendo NPM...
sudo apt-get install npm

# Obtendo git
echo Obtendo Git
sudo apt-get install git

# Obtendo Python
#echo Obtendo Python...
#sudo apt-get install python
## Validando se a instalacao esta correta
echo ----------------------
echo versao do curl:
curl -V
echo ---------------------
echo versao do npm
npm -v
echo -----------------
echo versao do docker
docker version
echo ---------------
echo versao docker-compose
docker-compose version
echo -----------------
echo versao do go
go version
echo ----------------
echo versao do python
python3 -V
echo ----------
echo versao do node
node -v
