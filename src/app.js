require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const expressLayouts = require("express-ejs-layouts");
const { verifyToken } = require('./config/jwt');

const authRoutes = require("./routes/auth");
const cardRoutes = require("./routes/cards");
const boosterRoutes = require("./routes/boosters");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Connexion à la base de données
connectDB();

// Configuration EJS
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

// Middleware global pour passer user aux vues
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = verifyToken(token);
      res.locals.user = decoded;
    } catch (error) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Routes
app.get("/", (req, res) => res.redirect("/cards"));
app.use("/auth", authRoutes);
app.use("/cards", cardRoutes);
app.use("/boosters", boosterRoutes);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).render("error", {
    error: {
      status: 404,
      message: "Page non trouvée",
    },
  });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
