const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
require("dotenv").config();

// Import des routes
const authRoutes = require("./routes/auth");
const cardRoutes = require("./routes/cards");
const boosterRoutes = require("./routes/boosters");

// Import des middlewares personnalisés
const { requestLogger, errorHandler } = require("./middleware/auth");

// Connexion à la base de données
const connectDB = require("./config/database");
connectDB();

// Initialisation de l'application Express
const app = express();

// Configuration de la sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https:",
          "cdn.tailwindcss.com",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        imgSrc: ["'self'", "https:", "data:", "blob:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  })
);

// Configuration du CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Middleware de logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware de compression
app.use(compression());

// Parse des requêtes
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Configuration des sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // 1 jour
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semaine
    },
  })
);

// Configuration des messages flash
app.use(flash());

// Middleware pour les variables globales
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Configuration du moteur de template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Logger des requêtes personnalisé
app.use(requestLogger);

// Routes principales
app.get("/", (req, res) => {
  res.render("index", {
    title: "Accueil",
    user: req.user,
  });
});

// Routes de l'API
app.use("/auth", authRoutes);
app.use("/cards", cardRoutes);
app.use("/boosters", boosterRoutes);

app.use((req, res, next) => {
    res.status(404).render('error/404', {
        title: 'Page non trouvée',
        user: req.user
    });
});

// Gestionnaire d'erreurs global (500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error/500', {
        title: 'Erreur serveur',
        user: req.user,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Gestion des routes non trouvées
app.use((req, res, next) => {
  res.status(404).render("error/404", {
    title: "Page non trouvée",
    user: req.user,
  });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Gestion des erreurs non capturées
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Configuration du port
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
