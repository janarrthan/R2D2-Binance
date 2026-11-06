const apiAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.send({ error: "You are not authorized!" });
  }

  next();
};

export default apiAuth;
