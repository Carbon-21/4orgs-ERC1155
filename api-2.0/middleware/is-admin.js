module.exports = async (req, res, next) => {
    if (req.session.role != "admin") {
      req.flash("error", "Necessário ser administrador");
      res.redirect("/");
    } else next();
  };