//executed if any other middleware yields an error

module.exports = (error, req, res, next) => {
  //if an response was already sent, forward it
  if (res.headerSent) {
    return next(error);
  }

  //get error info set on previous middleware, if any
  res.status(error.code || 500);
  res.json({
    message: error.message || "Ocorreu um erro. Por favor, tente novamente.",
  });
};
