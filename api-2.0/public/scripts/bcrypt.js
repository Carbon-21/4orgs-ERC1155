const { hashSync } = require("bcryptjs");

//client side PHS
global.hashPassword = (plaintextPassword, salt) => {
  salt = salt.slice(0, -1); //removes additional / in the end
  salt = "$2a$11$" + salt; //bcrypt salt format
  
  const hash = hashSync(plaintextPassword, salt);
  return hash;
};
