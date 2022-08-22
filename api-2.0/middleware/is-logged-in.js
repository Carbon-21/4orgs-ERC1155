// Middleware: used to protect some pages checking if the user is logged in. If not, redirects to login page.

module.exports = async (req, res, next) => {
  if (!req.session.token) {
    req.flash("error", "Necessario login");
    res.redirect("/login");
  } else next();
};
