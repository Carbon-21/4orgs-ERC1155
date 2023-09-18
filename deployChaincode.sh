#!/bin/bash
cd "$(dirname "$0")"


export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/ca.crt
export PEER0_ORG3_CA=${PWD}/artifacts/channel/crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/ca.crt
export PEER0_ORG4_CA=${PWD}/artifacts/channel/crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/artifacts/channel/config/

export CHANNEL_NAME=mychannel

setGlobalsForOrderer() {
    export CORE_PEER_LOCALMSPID="OrdererMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp

}

setGlobalsForPeer0Carbon() {
    export CORE_PEER_LOCALMSPID="CarbonMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setGlobalsForCarbon() {
    export CORE_PEER_LOCALMSPID="CarbonMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/users/User1@carbon.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setGlobalsForPeer0Cetesb(){
    export CORE_PEER_LOCALMSPID="CetesbMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/cetesb.example.com/users/Admin@cetesb.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
    
}

setGlobalsForPeer0Ibama(){
    export CORE_PEER_LOCALMSPID="IbamaMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG4_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/ibama.example.com/users/Admin@ibama.example.com/msp
    export CORE_PEER_ADDRESS=localhost:13051
    
}

presetup() {
    echo Vendoring Go dependencies ...
    pushd ./artifacts/src/github.com/erc1155
    GO111MODULE=on go mod vendor
    popd
    echo Finished vendoring Go dependencies
}

CHANNEL_NAME="mychannel"
CC_RUNTIME_LANGUAGE="golang"
VERSION="1"
SEQUENCE="1"
CC_SRC_PATH="./artifacts/src/github.com/erc1155"
CC_NAME="erc1155"


packageChaincode() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${VERSION}
    echo "===================== Chaincode is packaged ===================== "
}

installChaincode() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.carbon ===================== "

    setGlobalsForPeer0Cetesb
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.cetesb ===================== "

    setGlobalsForPeer0Ibama
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.ibama ===================== "
}

queryInstalled() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo PackageID is ${PACKAGE_ID}
    echo "===================== Query installed successful on peer0.carbon on channel ===================== "
}

approveForMyCarbon() {
    setGlobalsForPeer0Carbon
    # set -x
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --init-required --package-id ${PACKAGE_ID} \
        --sequence ${SEQUENCE}
    # set +x

    echo "===================== chaincode approved from org 1 ===================== "

}

checkCommitReadyCarbon() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode checkcommitreadiness \
        --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --sequence ${VERSION} --output json --init-required
    echo "===================== checking commit readyness from org 1 ===================== "
}

approveForMyCetesb() {
    setGlobalsForPeer0Cetesb

    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --version ${VERSION} --init-required --package-id ${PACKAGE_ID} \
        --sequence ${SEQUENCE}

    echo "===================== chaincode approved from org 3 ===================== "
}

checkCommitReadyCetesb() {

    setGlobalsForPeer0Cetesb
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
        --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
        --name ${CC_NAME} --version ${VERSION} --sequence ${VERSION} --output json --init-required
    echo "===================== checking commit readyness from org 3 ===================== "
}

approveForMyIbama() {
    setGlobalsForPeer0Ibama

    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --version ${VERSION} --init-required --package-id ${PACKAGE_ID} \
        --sequence ${SEQUENCE}

    echo "===================== chaincode approved from org 4 ===================== "
}

checkCommitReadyIbama() {

    setGlobalsForPeer0Ibama
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
        --peerAddresses localhost:13051 --tlsRootCertFiles $PEER0_ORG4_CA \
        --name ${CC_NAME} --version ${VERSION} --sequence ${VERSION} --output json --init-required
    echo "===================== checking commit readyness from org 4 ===================== "
}

commitChaincodeDefination() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
        --peerAddresses localhost:13051 --tlsRootCertFiles $PEER0_ORG4_CA \
        --version ${VERSION} --sequence ${SEQUENCE} --init-required

}

queryCommitted() {
    setGlobalsForPeer0Carbon
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

}

chaincodeInvokeInit() {
    setGlobalsForPeer0Carbon
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
        --peerAddresses localhost:13051 --tlsRootCertFiles $PEER0_ORG4_CA \
        --isInit -c '{"Args":[]}'

}

# Run this function if you add any new dependency in chaincode
presetup
packageChaincode
installChaincode
queryInstalled
approveForMyCarbon
checkCommitReadyCarbon
approveForMyCetesb
checkCommitReadyCetesb
approveForMyIbama
checkCommitReadyIbama
commitChaincodeDefination
queryCommitted
chaincodeInvokeInit
