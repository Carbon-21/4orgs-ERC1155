# Caliper



# Set up

1. Init the Carbon21 project following the README.md in the root of this repo
2. Install the [Prometheus](https://www.cherryservers.com/blog/install-prometheus-ubuntu) and start the service
```
sudo systemctl enable prometheus
sudo systemctl start prometheus
```
3. Run the init command `./init -i` which will install the dependencies and update the path for your keystore
4. Run the command to execute the tests `./init -r`
5. Check the report in `/caliper-workspace/report.html`