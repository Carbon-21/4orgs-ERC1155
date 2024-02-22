FROM node:16
WORKDIR /app
COPY ./api-2.0 ./
COPY ./artifacts ./artifacts
COPY ./api-2.0/network_org1.yaml /
RUN npm install 
RUN npm install -g nodemon
SHELL ["/bin/bash", "-c"]
RUN ./config/genccp-docker.sh
RUN ./public/scripts/src/genscripts.sh
RUN ["chmod", "+x", "./get-bundles.sh"]
EXPOSE 4000
CMD ["nodemon"]
# CMD ["./config/generate-ccp.sh" , "./public/scripts/src/genscripts.sh", "./get-bundles", "nodemon"]