//auxiliary functions, used by auth controller
// const Sequelize = require("sequelize");
// const { hash, compare } = require("bcryptjs");
const { sign, verify, decode } = require("jsonwebtoken");

// const transport = require("../util/mailing");
// const models = require("../util/sequelize");

// exports.verifyPassword = async (password, hasehdPassword) => {
//   const isValid = await compare(password, hasehdPassword);
//   return isValid;
// };

// exports.hashPassword = async (password, salt) => {
//   const hashedPassword = await hash(password, 11);
//   return hashedPassword;
// };

exports.createJWT = (username, org, expiration = "7d") => {
  //.env
  const token = sign({ username, org }, "supersecreeeet_dont_share", {
    expiresIn: expiration,
  });
  return token;
};

// //used to confirm user's email
// exports.createConfirmationToken = (email, oldEmail = null) => {
//   const token = sign({ email, oldEmail }, "supersecreeeet_dont_share2", {
//     expiresIn: "2d",
//   });
//   return token;
// };

// //verify jwt and return email
// exports.getEmailFromVerifiedConfirmationToken = (token) => {
//   try {
//     //decode token and return supposed email
//     const decodedToken = verify(token, "supersecreeeet_dont_share2");
//     return { email: decodedToken.email, oldEmail: decodedToken.oldEmail };
//   } catch (err) {
//     throw "Código inválido.";
//   }
// };

// //used when user wants to reset pwd
// //secret: user pwd (which must change to a new one), so the token can't be re-utilized
// exports.createResetToken = (email, secret, expiration = "1h") => {
//   const token = sign({ email }, secret, {
//     expiresIn: expiration,
//   });
//   return token;
// };

// exports.getEmailFromResetToken = (token) => {
//   try {
//     //decode token and return supposed email
//     const decodedToken = decode(token);
//     return decodedToken.email;
//   } catch (err) {
//     throw err;
//   }
// };

// //validate with user pwd
// exports.validateResetToken = (token, secret) => {
//   try {
//     //verify token and return it
//     return verify(token, secret);
//   } catch (err) {
//     throw "Código inválido.";
//   }
// };

// //block user if they attempt to login unsuccessfully many times, then send they a reactivation email
// exports.considerBlockingUser = async (user) => {
//   const allowedFailures = 10;
//   const timeWindow = 1; //in hours

//   try {
//     //count invalid acces in the last hours
//     const failures = await models.authenticationActivity.count({
//       where: {
//         userId: user.id,
//         eventType: { [Sequelize.Op.or]: ["login", "infochange", "pwdchange"] },
//         success: false,
//         createdAt: {
//           [Sequelize.Op.gte]: Sequelize.literal(
//             `DATE_SUB(NOW(), INTERVAL '${timeWindow}' HOUR)`
//           ),
//         },
//       },
//     });

//     if (failures >= allowedFailures) {
//       //block user
//       user.status = "pwdblocked";
//       await user.save();

//       //send reset token
//       //TODO mudar email
//       transport.sendMail({
//         to: user.email,
//         from: '"FluxoTest" <cadastro@fluxotest.com>',
//         subject: "Desbloqueie sua conta",
//         html: `<h1>Desbloqueio de conta</h1> <p>${
//           user.name
//         }, para sua segurança, bloqueamos sua conta pois detectamos diversas tentativas de acessá-la com senhas incorretas. Por favor, confirme seu email clicando <a href=http://localhost:3000/pass-reset?token=${this.createResetToken(
//           user.email,
//           user.password,
//           "2d"
//         )}> aqui</a>. O link é válido por 2 dias. Caso não tenha sido você, por favor contate nosso suporte.</p>`,
//       });

//       return true; //blocked signal
//     }
//   } catch (err) {
//     throw err;
//   }
// };
