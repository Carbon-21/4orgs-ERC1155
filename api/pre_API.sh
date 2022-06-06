# Instala deps API
cd /minicurso/api-1.4
mkdir node_modules
mkdir node_modules/pkcs11js
mkdir node_modules/pkcs11js/build
chown -R $USER:$USER ./node_modules/
npm install -g nodemon
npm install log4js
npm install express
npm install body-parser
npm install express-jwt
npm install jsonwebtoken
npm install express-bearer-token
npm install cors
npm install prom-client
npm install fabric-client
npm install axios