#!/bin/bash
cd "$(dirname "$0")"
set -e
createcertificatesForCarbon() {
  echo
  echo "Enroll the CA admin for Carbon"
  echo

  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/
  export FABRIC_CA_CLIENT_HOME=${PWD}/../crypto-config/peerOrganizations/carbon.example.com/

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca.carbon.example.com --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem
   

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-carbon-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-carbon-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-carbon-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-carbon-example-com.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../crypto-config/peerOrganizations/carbon.example.com/msp/config.yaml

  echo
  echo "Register peer0"
  echo
  fabric-ca-client register --caname ca.carbon.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  echo
  echo "Register user"
  echo
  fabric-ca-client register --caname ca.carbon.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  echo
  echo "Register the org admin"
  echo
  fabric-ca-client register --caname ca.carbon.example.com --id.name carbonadmin --id.secret carbonadminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/peers

  # -----------------------------------------------------------------------------------
  #  Peer 0
  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com

  echo
  echo "## Generate the peer0 msp"
  echo
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp --csr.hosts peer0.carbon.example.com --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls --enrollment.profile tls --csr.hosts peer0.carbon.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/signcerts/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/keystore/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/tlsca
  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/tlsca/tlsca.carbon.example.com-cert.pem

  mkdir ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/ca
  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp/cacerts/* ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/ca/ca.carbon.example.com-cert.pem

  # --------------------------------------------------------------------------------------------------

  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/users
  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/users/User1@carbon.example.com

  echo
  echo "## Generate the user msp"
  echo
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/users/User1@carbon.example.com/msp --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  mkdir -p ../crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com

  echo
  echo "## Generate the org admin msp"
  echo
  fabric-ca-client enroll -u https://carbonadmin:carbonadminpw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  cp ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/config.yaml

}

# createcertificatesForCarbon

createCertificatesForUsers() {
  echo
  echo "Enroll the CA admin for Users"
  echo
  mkdir -p ../crypto-config/peerOrganizations/users.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../crypto-config/peerOrganizations/users.example.com/

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca.users.example.com --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-users-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-users-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-users-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-users-example-com.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../crypto-config/peerOrganizations/users.example.com/msp/config.yaml

  echo
  echo "Register peer0"
  echo
   
  fabric-ca-client register --caname ca.users.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  echo
  echo "Register user"
  echo
   
  fabric-ca-client register --caname ca.users.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  echo
  echo "Register the org admin"
  echo
   
  fabric-ca-client register --caname ca.users.example.com --id.name usersadmin --id.secret usersadminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/users.example.com/peers
  mkdir -p ../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp --csr.hosts peer0.users.example.com --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls --enrollment.profile tls --csr.hosts peer0.users.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/signcerts/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/keystore/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/peerOrganizations/users.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../crypto-config/peerOrganizations/users.example.com/tlsca
  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/tlsca/tlsca.users.example.com-cert.pem

  mkdir ${PWD}/../crypto-config/peerOrganizations/users.example.com/ca
  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp/cacerts/* ${PWD}/../crypto-config/peerOrganizations/users.example.com/ca/ca.users.example.com-cert.pem

  # --------------------------------------------------------------------------------
 
  mkdir -p ../crypto-config/peerOrganizations/users.example.com/users
  mkdir -p ../crypto-config/peerOrganizations/users.example.com/users/User1@users.example.com

  echo
  echo "## Generate the user msp"
  echo
   
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../crypto-config/peerOrganizations/users.example.com/users/User1@users.example.com/msp --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/users.example.com/users/Admin@users.example.com

  echo
  echo "## Generate the org admin msp"
  echo
   
  fabric-ca-client enroll -u https://usersadmin:usersadminpw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../crypto-config/peerOrganizations/users.example.com/users/Admin@users.example.com/msp --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/users.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/users.example.com/users/Admin@users.example.com/msp/config.yaml

}

# createCertificateForUsers

createCertificatesForCetesb() {
  echo
  echo "Enroll the CA admin for Cetesb"
  echo
  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:10054 --caname ca.cetesb.example.com --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-cetesb-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-cetesb-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-cetesb-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-cetesb-example-com.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/msp/config.yaml

  echo
  echo "Register peer0"
  echo
   
  fabric-ca-client register --caname ca.cetesb.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  echo
  echo "Register user"
  echo
   
  fabric-ca-client register --caname ca.cetesb.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  echo
  echo "Register the org admin"
  echo
   
  fabric-ca-client register --caname ca.cetesb.example.com --id.name cetesbadmin --id.secret cetesbadminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/peers
  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp --csr.hosts peer0.cetesb.example.com --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls --enrollment.profile tls --csr.hosts peer0.cetesb.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/signcerts/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/keystore/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/tlsca
  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/tlsca/tlsca.cetesb.example.com-cert.pem

  mkdir ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/ca
  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp/cacerts/* ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/ca/ca.cetesb.example.com-cert.pem

  # --------------------------------------------------------------------------------

  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/users
  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/users/User1@cetesb.example.com

  echo
  echo "## Generate the user msp"
  echo
   
  fabric-ca-client enroll -u https://user1:user1pw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/users/User1@cetesb.example.com/msp --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/cetesb.example.com/users/Admin@cetesb.example.com

  echo
  echo "## Generate the org admin msp"
  echo
   
  fabric-ca-client enroll -u https://cetesbadmin:cetesbadminpw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/users/Admin@cetesb.example.com/msp --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/cetesb.example.com/users/Admin@cetesb.example.com/msp/config.yaml

}

createCertificatesForIbama() {
  echo
  echo "Enroll the CA admin for Ibama"
  echo
  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../crypto-config/peerOrganizations/ibama.example.com/

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca.ibama.example.com --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../crypto-config/peerOrganizations/ibama.example.com/msp/config.yaml

  echo
  echo "Register peer0"
  echo
   
  fabric-ca-client register --caname ca.ibama.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  echo
  echo "Register user"
  echo
   
  fabric-ca-client register --caname ca.ibama.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  echo
  echo "Register the org admin"
  echo
   
  fabric-ca-client register --caname ca.ibama.example.com --id.name ibamaadmin --id.secret ibamaadminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/peers
  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca.ibama.example.com -M ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp --csr.hosts peer0.ibama.example.com --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca.ibama.example.com -M ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls --enrollment.profile tls --csr.hosts peer0.ibama.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/signcerts/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/keystore/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/tlsca
  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/tlsca/tlsca.ibama.example.com-cert.pem

  mkdir ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/ca
  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp/cacerts/* ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/ca/ca.ibama.example.com-cert.pem

  # --------------------------------------------------------------------------------

  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/users
  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/users/User1@ibama.example.com

  echo
  echo "## Generate the user msp"
  echo
   
  fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca.ibama.example.com -M ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/users/User1@ibama.example.com/msp --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  mkdir -p ../crypto-config/peerOrganizations/ibama.example.com/users/Admin@ibama.example.com

  echo
  echo "## Generate the org admin msp"
  echo
   
  fabric-ca-client enroll -u https://ibamaadmin:ibamaadminpw@localhost:11054 --caname ca.ibama.example.com -M ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/users/Admin@ibama.example.com/msp --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  cp ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/msp/config.yaml ${PWD}/../crypto-config/peerOrganizations/ibama.example.com/users/Admin@ibama.example.com/msp/config.yaml

}

createCretificatesForOrderer() {
  echo
  echo "Enroll the CA admin for Ordered"
  echo
  mkdir -p ../crypto-config/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/../crypto-config/ordererOrganizations/example.com

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../crypto-config/ordererOrganizations/example.com/msp/config.yaml

  echo
  echo "Register orderer"
  echo
   
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  echo
  echo "Register orderer2"
  echo
   
  fabric-ca-client register --caname ca-orderer --id.name orderer2 --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  echo
  echo "Register orderer3"
  echo
   
  fabric-ca-client register --caname ca-orderer --id.name orderer3 --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  echo
  echo "Register the orderer admin"
  echo
   
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  mkdir -p ../crypto-config/ordererOrganizations/example.com/orderers
  # mkdir -p ../crypto-config/ordererOrganizations/example.com/orderers/example.com

  # ---------------------------------------------------------------------------
  #  Orderer

  mkdir -p ../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # -----------------------------------------------------------------------
  #  Orderer 2

  mkdir -p ../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer2:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp --csr.hosts orderer2.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer2:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls --enrollment.profile tls --csr.hosts orderer2.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/signcerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/keystore/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts
  # cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # ---------------------------------------------------------------------------
  #  Orderer 3
  mkdir -p ../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer3:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/msp --csr.hosts orderer3.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer3:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls --enrollment.profile tls --csr.hosts orderer3.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/ca.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/signcerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.crt
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/keystore/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.key

  mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/tlscacerts
  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # mkdir ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts
  # cp ${PWD}/../crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/tlscacerts/* ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # ---------------------------------------------------------------------------

  mkdir -p ../crypto-config/ordererOrganizations/example.com/users
  mkdir -p ../crypto-config/ordererOrganizations/example.com/users/Admin@example.com

  echo
  echo "## Generate the admin msp"
  echo
   
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/../crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../crypto-config/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml

}

# createCretificateForOrderer

sudo rm -rf ../crypto-config/*
# sudo rm -rf fabric-ca/*
createcertificatesForCarbon
createCertificatesForUsers
createCertificatesForCetesb
createCertificatesForIbama

createCretificatesForOrderer

# Remove root privileges in fabric-ca
sudo chown -R $USER: ./fabric-ca/