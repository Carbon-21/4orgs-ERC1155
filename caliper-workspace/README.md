# Caliper

# Set up

1. Init the Carbon21 project following the README.md in the root of this repo
2.  Check the keystore file in `/artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/keystore/` and update the path in `/caliper-workspace/networks/localnetworkconfig.yaml`
3. Run the command `npm run bind`
4. Run the command `npm start`
5. Check the report in `/caliper-workspace/report.html`