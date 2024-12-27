const errorHandler = (err, req, res, next) => {
  const error = {
    status: err.status || 500,
    message: err.message || "Erreur serveur",
  };

  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
  }

  // Gestion des erreurs MongoDB
  if (err.name === "ValidationError") {
    error.status = 400;
    error.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    error.status = 400;
    error.message = "ID invalide";
  }

  if (err.code === 11000) {
    error.status = 400;
    error.message = "Doublon détecté";
  }

  // Gestion des erreurs JWT
  if (err.name === "JsonWebTokenError") {
    error.status = 401;
    error.message = "Token invalide";
  }

  if (err.name === "TokenExpiredError") {
    error.status = 401;
    error.message = "Token expiré";
  }

  // Format de réponse en fonction du type de requête
  if (req.accepts("html")) {
    res.status(error.status).render("error", { error });
  } else {
    res.status(error.status).json({
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

module.exports = errorHandler;
