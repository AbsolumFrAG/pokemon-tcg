const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware pour protéger les routes et vérifier l'authentification
 */
exports.protect = async (req, res, next) => {
  console.log("[protect] Début de la vérification d'authentification");
  try {
    let token;

    console.log("[protect] Headers:", req.headers);
    console.log("[protect] Cookies:", req.cookies);

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("[protect] Token from Authorization header:", token);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log("[protect] Token from cookie:", token);
    }

    if (!token) {
      console.log("[protect] Aucun token trouvé");
      if (req.accepts("html")) {
        return res.redirect("/auth/login");
      }
      return res.status(401).json({
        success: false,
        message: "Vous devez être connecté pour accéder à cette ressource",
      });
    }

    try {
      console.log("[protect] Vérification du token avec JWT_SECRET");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[protect] Token décodé:", decoded);

      const user = await User.findById(decoded.id);
      console.log("[protect] Utilisateur trouvé:", user ? "Oui" : "Non");

      if (!user) {
        console.log("[protect] Utilisateur non trouvé dans la base de données");
        if (req.accepts("html")) {
          return res.redirect("/auth/login");
        }
        return res.status(401).json({
          success: false,
          message: "Token invalide - utilisateur non trouvé",
        });
      }

      if (!user.isActive) {
        console.log("[protect] Compte utilisateur inactif");
        if (req.accepts("html")) {
          return res.redirect("/auth/login");
        }
        return res.status(401).json({
          success: false,
          message: "Votre compte a été désactivé",
        });
      }

      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      console.log("[protect] Last login mis à jour");

      req.user = user;
      console.log("[protect] Authentification réussie");
      next();
    } catch (err) {
      console.error("[protect] Erreur de vérification du token:", err);
      if (req.accepts("html")) {
        return res.redirect("/auth/login");
      }
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
  } catch (error) {
    console.error("[protect] Erreur générale:", error);
    next(error);
  }
};

/**
 * Middleware pour restreindre l'accès aux rôles spécifiés
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("[authorize] Vérification des rôles");
    console.log("[authorize] Rôles requis:", roles);
    console.log("[authorize] Rôle de l'utilisateur:", req.user?.role);

    if (!req.user) {
      console.log("[authorize] Pas d'utilisateur trouvé dans la requête");
      if (req.accepts("html")) {
        return res.render("error/403", {
          title: "Accès refusé",
          message: "Authentification requise",
          user: req.user,
        });
      }
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log("[authorize] Utilisateur n'a pas les permissions requises");
      if (req.accepts("html")) {
        return res.render("error/403", {
          title: "Accès refusé",
          message: "Vous n'avez pas les permissions nécessaires",
          user: req.user,
        });
      }
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les permissions nécessaires",
      });
    }

    console.log("[authorize] Autorisation accordée");
    next();
  };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 */
exports.checkOwnership = (model) => async (req, res, next) => {
  try {
    const resource = await model.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Ressource non trouvée",
      });
    }

    // Vérifier si l'utilisateur est le propriétaire ou un admin
    if (
      resource.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cette ressource",
      });
    }

    req.resource = resource;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pour limiter le nombre de requêtes
 */
exports.rateLimit = (requestLimit, timeWindow) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user ? req.user.id : req.ip;
    const now = Date.now();

    if (requests.has(userId)) {
      const userData = requests.get(userId);
      const windowStart = now - timeWindow;

      // Nettoyer les anciennes requêtes
      userData.timestamps = userData.timestamps.filter(
        (time) => time > windowStart
      );

      if (userData.timestamps.length >= requestLimit) {
        return res.status(429).json({
          success: false,
          message: "Trop de requêtes, veuillez réessayer plus tard",
        });
      }

      userData.timestamps.push(now);
      requests.set(userId, userData);
    } else {
      requests.set(userId, {
        timestamps: [now],
      });
    }

    next();
  };
};

/**
 * Middleware pour logger les requêtes
 */
exports.requestLogger = (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${
      req.user ? req.user.username : "Non authentifié"
    }`
  );
  next();
};

/**
 * Middleware pour gérer les erreurs d'authentification
 */
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expiré",
    });
  }

  res.status(500).json({
    success: false,
    message: "Erreur serveur",
  });
};
