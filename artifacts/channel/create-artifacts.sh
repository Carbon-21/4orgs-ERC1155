#!/bin/bash
cd "$(dirname "$0")"
# Delete existing artifacts
rm -rf genesis.block mychannel.tx
rm -rf ../../channel-artifacts/*

#Generate Crypto artifactes for organizations
# cryptogen generate --config=./crypto-config.yaml --output=./crypto-config/



# System channel
SYS_CHANNEL="sys-channel"

# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"

echo $CHANNEL_NAME

# Generate System Genesis block
configtxgen -profile OrdererGenesis -configPath . -channelID $SYS_CHANNEL  -outputBlock ./genesis.block


# Generate channel configuration block
configtxgen -profile BasicChannel -configPath . -outputCreateChannelTx ./$CHANNEL_NAME.tx -channelID $CHANNEL_NAME

echo "#######    Generating anchor peer update for CarbonMSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./CarbonMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CarbonMSP

echo "#######    Generating anchor peer update for UsersMSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./UsersMSPanchors.tx -channelID $CHANNEL_NAME -asOrg UsersMSP

echo "#######    Generating anchor peer update for CetesbMSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./CetesbMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CetesbMSP

echo "#######    Generating anchor peer update for IbamaMSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./IbamaMSPanchors.tx -channelID $CHANNEL_NAME -asOrg IbamaMSP
