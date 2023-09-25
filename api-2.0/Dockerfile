FROM node:16
WORKDIR /app
COPY package.json .
RUN npm install 
RUN npm install -g nodemon
COPY . ./
EXPOSE 4000
#EXPOSE $PORT
CMD ["nodemon"]
# CMD ["./config/generate-ccp.sh" , "./public/scripts/src/genscripts.sh", "./get-bundles", "nodemon"]