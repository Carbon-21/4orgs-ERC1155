#!/bin/bash

# Script para geração de private key ECSDA 256 e CSR para Hyperledger Fabric Carbon21
# Modo de usar: ./generateCSR.sh userID userOrg

# Gera e armazena chave privada ECDSA 256
openssl ecparam -name prime256v1 -genkey -noout -out pkey.pem

# Gera CSR a partir da chave anterior, utilizando argumentos como parametros 
openssl req -new -sha256 -key pkey.pem -out certreq.csr -subj "/C=US/ST=North Carolina/OU=client+OU=$2+OU=department1/CN=$1"
