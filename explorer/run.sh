#!/bin/bash

cDir=${PWD}/../artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/keystore
# Main extraction:
allFile=`ls $cDir`
echo;

# Checking if the last value of the path is '/' or not:
if [[ ${cDir: -1} != '/' ]]; then
	cDir+='/'
fi

# Iterating over everything in the folder
for item in $allFile; do
	# Appending path to each file:
	item="$cDir$item"
	# Checking if current item is a file:
	if [[ -f $item ]]; then
		filename=`ls $item | rev | cut -d '/' -f 1 | rev`
	fi
done
echo '{
	"name": "first network (ignored)",
	"version": "1.0.0",
	"license": "Apache-2.0",
	"client": {
		"tlsEnable": true,
		"caCredential": {
			"id": "admin",
			"password": "adminpw"
		},
		"adminCredential": {
			"id": "exploreradmin",
			"password": "exploreradminpw"
		},
		"enableAuthentication": true,
		"organization": "CarbonMSP",
		"connection": {
			"timeout": {
				"peer": {
					"endorser": "300"
				},
				"orderer": "300"
			}
		}
	},
	"channels": {
		"mychannel": {
			"peers": {
				"peer0.carbon.example.com": {}
			}
		}
	},
	"organizations": {
		"CarbonMSP": {
			"mspid": "CarbonMSP",
			"adminPrivateKey": {
				"path": "/etc/data/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/keystore/'$filename'"
			},
			"peers": [
				"peer0.carbon.example.com"
			],
			"signedCert": {
				"path": "/etc/data/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/signcerts/cert.pem"
			}
		}
	},
	"peers": {
		"peer0.carbon.example.com": {
			"tlsCACerts": {
				"path": "/etc/data/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/ca.crt"
			},
			"url": "grpcs://peer0.carbon.example.com:7051",
			"eventUrl": "grpcs://peer0.carbon.example.com:7053",
			"grpcOptions": {
				"ssl-target-name-override": "peer0.carbon.example.com"
			}
		}
	}
}' >${PWD}/connection-profile/first-network_2.2.json

docker-compose up -d