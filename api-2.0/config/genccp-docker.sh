#!/bin/bash
source ../.env

cd "$(dirname "$0")"
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${HOST}/$6/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ./ccp-template.json
}

ORG=carbon
P0PORT=7051
CAPORT=7054
PEERPEM=../artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/tls-localhost-7054-ca-carbon-example-com.pem
CAPEM=../artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/msp/tlscacerts/ca.crt
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $HOST)" > connection-carbon.json

ORG=cetesb
P0PORT=11051
CAPORT=10054
PEERPEM=../artifacts/channel/crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/tls-localhost-10054-ca-cetesb-example-com.pem
CAPEM=../artifacts/channel/crypto-config/peerOrganizations/cetesb.example.com/msp/tlscacerts/ca.crt
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $HOST)" > connection-cetesb.json

ORG=ibama
P0PORT=13051
CAPORT=11054
PEERPEM=../artifacts/channel/crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/tls-localhost-11054-ca-ibama-example-com.pem
CAPEM=../artifacts/channel/crypto-config/peerOrganizations/ibama.example.com/msp/tlscacerts/ca.crt
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $HOST)" > connection-ibama.json