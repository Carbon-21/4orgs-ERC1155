//Errors dictionary + interface to create errors (HttpError)

//TODO add more languages
class ErrorMessage {
  constructor(messagePT) {
    this.messagePT = messagePT;
  }
}

const notFound = new ErrorMessage(
  "Estamos com dificuldades em encontrar o que você procura. Talvez alguém do seu time tenha feito modificações por aqui... Por favor, recarregue a página."
);
const serverError = new ErrorMessage(
  "Ocorreu um erro. Por favor, tente novamente."
);
const unauthorized = new ErrorMessage(
  "Autenticação incorreta. Por favor, tente novamente."
);
const forbidden = new ErrorMessage(
  "Acesso não permitido. O líder do seu time e a equipe do FluxoTest serão notificados."
);
const validationError = new ErrorMessage(
  "Dados inválidos, por favor verifique-os."
);
const conflict = new ErrorMessage(
  'Usuário já cadastrado. Por favor, realize o login ou clique em "esqueci minha senha".'
);

const codes = {
  401: unauthorized,
  403: forbidden,
  404: notFound,
  409: conflict,
  422: validationError,
  500: serverError,
};

//Error Factory
class HttpError extends Error {
  constructor(code, message = null) {
    //add message property (Error constructor)
    message === null ? super(codes[code].messagePT) : super(message);

    //add code property
    this.code = code;

    console.log(message);
  }
}

exports.getErrorMessage = (field) => {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
};

module.exports = HttpError;
