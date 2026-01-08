module.exports = function (requiredRole) {
  return (req, res, next) => {

    const user = req.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not logged in" });
    }

 
    if (user.role !== requiredRole) {
      return res
        .status(403)
        .json({ success: false, message: "Access forbidden: insufficient rights" });
    }

    next();
  };
};
