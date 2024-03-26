# Caliper



# Set up

1. Init the Carbon21 project following the README.md in the root of this repo
2. Instal [Prometheus](https://www.cherryservers.com/blog/install-prometheus-ubuntu) and start the service
```
sudo systemctl enable prometheus
sudo systemctl start prometheus
```
3.  Check the keystore file in `/artifacts/channel/crypto-config/peerOrganizations/carbon.example.com/users/Admin@carbon.example.com/msp/keystore/` and update the path in `/caliper-workspace/networks/localnetworkconfig.yaml`
4. Run the command `npm run bind`
5. Run the command `npm start`
6. Check the report in `/caliper-workspace/report.html`