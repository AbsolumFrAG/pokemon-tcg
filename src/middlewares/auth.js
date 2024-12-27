const { verifyToken } = require("../config/jwt");

const auth = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new Error("Token manquant");
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Non autorisé" });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    next();
  };
};

const isAdmin = checkRole(["admin"]);
const isUser = checkRole(["user", "admin"]);

module.exports = {
  auth,
  checkRole,
  isAdmin,
  isUser,
};
