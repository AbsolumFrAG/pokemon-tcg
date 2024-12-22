const express = require("express");
const router = express.Router();
const { protect, authorize, rateLimit } = require("../middleware/auth");
const Card = require("../models/Card");
const User = require("../models/User");

/**
 * @desc    Afficher la page des boosters
 * @route   GET /boosters
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    // Récupérer les statistiques de collection de l'utilisateur
    const user = await User.findById(req.user.id);

    res.render("boosters/index", {
      title: "Boosters",
      page: "boosters",
      user,
      boosterPrice: 100, // Prix d'un booster en pièces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de la page des boosters",
    });
  }
});

/**
 * @desc    Ouvrir un booster
 * @route   POST /boosters/open
 * @access  Private
 * @limit   10 boosters par heure
 */
router.post(
  "/open",
  protect,
  rateLimit(10, 60 * 60 * 1000), // 10 requêtes par heure
  async (req, res) => {
    try {
      // Vérifier si l'utilisateur a assez de pièces
      const user = await User.findById(req.user.id);
      const boosterPrice = 100;

      if (user.coins < boosterPrice) {
        return res.status(400).json({
          success: false,
          message: "Vous n'avez pas assez de pièces pour ouvrir un booster",
        });
      }

      // Générer le booster
      const boosterCards = await generateBoosterPack();

      // Déduire le coût du booster
      await user.buyBooster(boosterPrice);

      // Assigner les cartes à l'utilisateur
      const userCards = await Promise.all(
        boosterCards.map((cardData) =>
          Card.create({
            ...cardData,
            owner: req.user.id,
            serialNumber: generateSerialNumber(req.user.id),
          })
        )
      );

      // Mettre à jour les statistiques de collection
      await user.updateCollectionStats();

      // Si la requête attend du JSON
      if (req.accepts("json")) {
        return res.status(200).json({
          success: true,
          message: "Booster ouvert avec succès",
          data: {
            cards: userCards,
            newBalance: user.coins,
          },
        });
      }

      // Si c'est une requête normale, rediriger vers la page de résultat
      res.redirect(
        "/boosters/result?cards=" + userCards.map((card) => card._id).join(",")
      );
    } catch (error) {
      console.error("Erreur lors de l'ouverture du booster:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'ouverture du booster",
      });
    }
  }
);

/**
 * @desc    Afficher le résultat de l'ouverture d'un booster
 * @route   GET /boosters/result
 * @access  Private
 */
router.get("/result", protect, async (req, res) => {
  try {
    const cardIds = req.query.cards.split(",");
    const cards = await Card.find({
      _id: { $in: cardIds },
      owner: req.user.id,
    });

    res.render("boosters/result", {
      title: "Résultat du booster",
      page: "boosters",
      cards,
    });
  } catch (error) {
    res.redirect("/boosters");
  }
});

/**
 * @desc    Obtenir les probabilités des raretés
 * @route   GET /boosters/odds
 * @access  Public
 */
router.get("/odds", async (req, res) => {
  const rarityOdds = {
    Common: "100% (6 cartes)",
    Uncommon: "100% (3 cartes)",
    Rare: "100% (1 carte)",
    "Ultra Rare": "8%",
    "Secret Rare": "2%",
  };

  res.json({
    success: true,
    data: rarityOdds,
  });
});

// Fonction utilitaire pour générer un numéro de série unique
function generateSerialNumber(userId) {
  return `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * @desc    Obtenir l'historique des boosters ouverts
 * @route   GET /boosters/history
 * @access  Private
 */
router.get("/history", protect, async (req, res) => {
  try {
    // Récupérer l'historique des cartes obtenues, groupées par date
    const history = await Card.aggregate([
      { $match: { owner: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          cards: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }, // Limiter aux 10 derniers jours
    ]);

    if (req.accepts("json")) {
      return res.json({
        success: true,
        data: history,
      });
    }

    res.render("boosters/history", {
      title: "Historique des boosters",
      page: "boosters",
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
});

module.exports = router;
