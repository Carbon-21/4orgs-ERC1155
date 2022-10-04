const { hashSync } = require("bcryptjs");

//client side PHS
global.hashPassword = (plaintextPassword, salt) => {
  salt = salt.slice(0, -1); //removes additional / in the end, added by EJS

  const hash = hashSync(plaintextPassword, salt);
  return hash;
};
