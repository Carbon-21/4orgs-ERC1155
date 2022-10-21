module.exports = (req, res, next) => {
  //domains allowed to make requisitions to the backend
  res.setHeader("Access-Control-Allow-Origin", "*");

  //allowed incoming headers
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  //which http methods may be attached to incoming requests
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
};
