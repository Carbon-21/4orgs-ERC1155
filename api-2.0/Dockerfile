FROM node:16
WORKDIR /app
COPY ./api-2.0 ./
COPY ./artifacts ./artifacts
COPY ./api-2.0/network_org1.yaml /
RUN npm install 
RUN npm install -g nodemon
RUN ./config/genccp-docker.sh
# ainda falta add o gen scripts
EXPOSE 4000
CMD ["nodemon"]
# CMD ["./config/generate-ccp.sh" , "./public/scripts/src/genscripts.sh", "./get-bundles", "nodemon"]