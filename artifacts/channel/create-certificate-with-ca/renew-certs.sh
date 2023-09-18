createcertificatesForCarbon() {
  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p ../new-certs/peerOrganizations/carbon.example.com/
  export FABRIC_CA_CLIENT_HOME=${PWD}/../new-certs/peerOrganizations/carbon.example.com/

   
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
    OrganizationalUnitIdentifier: orderer' >${PWD}/../new-certs/peerOrganizations/carbon.example.com/msp/config.yaml

  # -----------------------------------------------------------------------------------
  #  Peer 0
  mkdir -p ../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com

  echo
  echo "## Generate the peer0 msp"
  echo
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp --csr.hosts peer0.carbon.example.com --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/msp/config.yaml ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca.carbon.example.com -M ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls --enrollment.profile tls --csr.hosts peer0.carbon.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/carbon/tls-cert.pem

  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/signcerts/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/server.crt
  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/keystore/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/peerOrganizations/carbon.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../new-certs/peerOrganizations/carbon.example.com/tlsca
  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/tlsca/tlsca.carbon.example.com-cert.pem

  mkdir ${PWD}/../new-certs/peerOrganizations/carbon.example.com/ca
  cp ${PWD}/../new-certs/peerOrganizations/carbon.example.com/peers/peer0.carbon.example.com/msp/cacerts/* ${PWD}/../new-certs/peerOrganizations/carbon.example.com/ca/ca.carbon.example.com-cert.pem

}

# createcertificatesForCarbon

createCertificatesForUsers() {
  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p ../new-certs/peerOrganizations/users.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../new-certs/peerOrganizations/users.example.com/

   
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca.users.example.com --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   
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
    OrganizationalUnitIdentifier: orderer' >${PWD}/../new-certs/peerOrganizations/users.example.com/msp/config.yaml

  mkdir -p ../new-certs/peerOrganizations/users.example.com/peers
  mkdir -p ../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp --csr.hosts peer0.users.example.com --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/msp/config.yaml ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca.users.example.com -M ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls --enrollment.profile tls --csr.hosts peer0.users.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/users/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/signcerts/* ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/server.crt
  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/keystore/* ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/peerOrganizations/users.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/users.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../new-certs/peerOrganizations/users.example.com/tlsca
  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/users.example.com/tlsca/tlsca.users.example.com-cert.pem

  mkdir ${PWD}/../new-certs/peerOrganizations/users.example.com/ca
  cp ${PWD}/../new-certs/peerOrganizations/users.example.com/peers/peer0.users.example.com/msp/cacerts/* ${PWD}/../new-certs/peerOrganizations/users.example.com/ca/ca.users.example.com-cert.pem

}

# createCertificateForUsers

createCertificatesForCetesb() {
  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p ../new-certs/peerOrganizations/cetesb.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../new-certs/peerOrganizations/cetesb.example.com/
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
    OrganizationalUnitIdentifier: orderer' >${PWD}/../new-certs/peerOrganizations/cetesb.example.com/msp/config.yaml
   

  mkdir -p ../new-certs/peerOrganizations/cetesb.example.com/peers
  mkdir -p ../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp --csr.hosts peer0.cetesb.example.com --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/msp/config.yaml ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.cetesb.example.com -M ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls --enrollment.profile tls --csr.hosts peer0.cetesb.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/cetesb/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/signcerts/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/server.crt
  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/keystore/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/tlsca
  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/tlsca/tlsca.cetesb.example.com-cert.pem

  mkdir ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/ca
  cp ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/peers/peer0.cetesb.example.com/msp/cacerts/* ${PWD}/../new-certs/peerOrganizations/cetesb.example.com/ca/ca.cetesb.example.com-cert.pem

}


createCertificatesForIbama() {
  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p ../new-certs/peerOrganizations/ibama.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/../new-certs/peerOrganizations/ibama.example.com/
  fabric-ca-client enroll -u https://admin:adminpw@localhost:10054 --caname ca.ibama.example.com --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem


  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-ibama-example-com.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/../new-certs/peerOrganizations/ibama.example.com/msp/config.yaml
   

  mkdir -p ../new-certs/peerOrganizations/ibama.example.com/peers
  mkdir -p ../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com

  # --------------------------------------------------------------
  # Peer 0
  echo
  echo "## Generate the peer0 msp"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.ibama.example.com -M ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp --csr.hosts peer0.ibama.example.com --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/msp/config.yaml ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp/config.yaml

  echo
  echo "## Generate the peer0-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 --caname ca.ibama.example.com -M ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls --enrollment.profile tls --csr.hosts peer0.ibama.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ibama/tls-cert.pem
   

  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/signcerts/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/server.crt
  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/keystore/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/peerOrganizations/ibama.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/../new-certs/peerOrganizations/ibama.example.com/tlsca
  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/tls/tlscacerts/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/tlsca/tlsca.ibama.example.com-cert.pem

  mkdir ${PWD}/../new-certs/peerOrganizations/ibama.example.com/ca
  cp ${PWD}/../new-certs/peerOrganizations/ibama.example.com/peers/peer0.ibama.example.com/msp/cacerts/* ${PWD}/../new-certs/peerOrganizations/ibama.example.com/ca/ca.ibama.example.com-cert.pem

}


createCretificatesForOrderer() {
  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p ../new-certs/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/../new-certs/ordererOrganizations/example.com

   
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
    OrganizationalUnitIdentifier: orderer' >${PWD}/../new-certs/ordererOrganizations/example.com/msp/config.yaml

  mkdir -p ../new-certs/ordererOrganizations/example.com/orderers
  # mkdir -p ../new-certs/ordererOrganizations/example.com/orderers/example.com

  # ---------------------------------------------------------------------------
  #  Orderer

  mkdir -p ../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir ${PWD}/../new-certs/ordererOrganizations/example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  # -----------------------------------------------------------------------
  #  Orderer 2

  mkdir -p ../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer2:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/msp --csr.hosts orderer2.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer2:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls --enrollment.profile tls --csr.hosts orderer2.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/signcerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/keystore/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts/tlsca.example.com-cert.pem


  # ---------------------------------------------------------------------------
  #  Orderer 3
  mkdir -p ../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com

  echo
  echo "## Generate the orderer msp"
  echo
   
  fabric-ca-client enroll -u https://orderer3:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/msp --csr.hosts orderer3.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
   
  fabric-ca-client enroll -u https://orderer3:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls --enrollment.profile tls --csr.hosts orderer3.example.com --csr.hosts localhost --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/ca.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/signcerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.crt
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/keystore/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.key

  mkdir ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/tlscacerts
  cp ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/tlscacerts/* ${PWD}/../new-certs/ordererOrganizations/example.com/orderers/orderer3.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

    # ---------------------------------------------------------------------------

  mkdir -p ../new-certs/ordererOrganizations/example.com/users
  mkdir -p ../new-certs/ordererOrganizations/example.com/users/Admin@example.com

  echo
  echo "## Generate the admin msp"
  echo
   
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/../new-certs/ordererOrganizations/example.com/users/Admin@example.com/msp --tls.certfiles ${PWD}/fabric-ca/ordererOrg/tls-cert.pem
   

  cp ${PWD}/../new-certs/ordererOrganizations/example.com/msp/config.yaml ${PWD}/../new-certs/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml

}

# createCretificateForOrderer

sudo rm -rf ../new-certs/*
# sudo rm -rf fabric-ca/*

createcertificatesForCarbon
createCertificatesForUsers
createCertificatesForCetesb
createCertificatesForIbama

createCretificatesForOrderer

