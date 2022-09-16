const { hash, compare } = require("bcryptjs");

exports.verifyPassword = async (password, hasehdPassword) => {
  const isValid = await compare(password, hasehdPassword);
  return isValid;
};

exports.hashPassword = async (password, salt) => {
  const hashedPassword = await hash(password, 11);
  return hashedPassword;
};
