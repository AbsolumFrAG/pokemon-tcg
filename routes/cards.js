const express = require("express");
const router = express.Router();
const Card = require("../models/Card");
const {
  protect,
  authorize,
  checkOwnership,
  rateLimit,
} = require("../middleware/auth");

/**
 * @desc    Afficher la page principale des cartes
 * @route   GET /cards
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12; // Nombre de cartes par page
    const startIndex = (page - 1) * limit;

    const cards = await Card.find({ owner: req.user.id })
      .sort("-createdAt")
      .skip(startIndex)
      .limit(limit);

    const total = await Card.countDocuments({ owner: req.user.id });
    const totalPages = Math.ceil(total / limit);

    res.render("cards/index", {
      title: "Mes Cartes",
      page: "cards",
      cards,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      user: req.user,
    });
  } catch (error) {
    res.status(500).render("error/500", {
      title: "Erreur",
      message: "Erreur lors du chargement des cartes",
      user: req.user,
    });
  }
});

/**
 * @desc    Afficher le formulaire de création de carte (admin uniquement)
 * @route   GET /cards/create
 * @access  Private/Admin
 */
router.get("/create", protect, authorize("admin"), (req, res) => {
  console.log("[cards/create] Début du traitement de la route");
  console.log("[cards/create] Utilisateur:", req.user);
  try {
    console.log("[cards/create] Rendu de la vue");
    res.render("cards/create", {
      title: "Créer une carte",
      page: "cards",
      user: req.user,
    });
  } catch (error) {
    console.error("[cards/create] Erreur lors du rendu:", error);
    res.status(500).render("error/500", {
      title: "Erreur",
      message: "Erreur lors du chargement du formulaire de création",
      user: req.user,
    });
  }
});

/**
 * @desc    Afficher une carte spécifique
 * @route   GET /cards/:id
 * @access  Private
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate({
      path: "owner",
      select: "username",
    });

    if (!card) {
      return res.status(404).render("error/404", {
        title: "Carte non trouvée",
        message: "Cette carte n'existe pas",
        user: req.user,
      });
    }

    res.render("cards/show", {
      title: card.name,
      page: "cards",
      card,
      user: req.user,
    });
  } catch (error) {
    res.status(500).render("error/500", {
      title: "Erreur",
      message: "Erreur lors du chargement de la carte",
      user: req.user,
    });
  }
});

/**
 * @desc    Afficher le formulaire de modification de carte (admin uniquement)
 * @route   GET /cards/:id/edit
 * @access  Private/Admin
 */
router.get("/:id/edit", protect, authorize("admin"), async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).render("error/404", {
        title: "Carte non trouvée",
        message: "Cette carte n'existe pas",
        user: req.user,
      });
    }

    res.render("cards/edit", {
      title: `Modifier ${card.name}`,
      page: "cards",
      card,
      user: req.user,
    });
  } catch (error) {
    res.status(500).render("error/500", {
      title: "Erreur",
      message: "Erreur lors du chargement de la carte",
      user: req.user,
    });
  }
});

// Les routes API existantes restent inchangées
// ... (garder toutes les routes POST, PUT, DELETE existantes)

/**
 * @desc    Obtenir toutes les cartes (avec pagination et filtres)
 * @route   GET /api/cards
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filtres
    const queryObj = { ...req.query };
    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Filtres avancés
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Construction de la requête
    let query = Card.find(JSON.parse(queryStr));

    // Tri
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Sélection des champs
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    }

    // Exécution de la requête
    const total = await Card.countDocuments(JSON.parse(queryStr));
    const cards = await query.skip(startIndex).limit(limit);

    res.status(200).json({
      success: true,
      count: cards.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: cards,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Obtenir une carte spécifique
 * @route   GET /api/cards/:id
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate({
      path: "owner",
      select: "username",
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Créer une nouvelle carte
 * @route   POST /api/cards
 * @access  Private/Admin
 */
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const card = await Card.create({
      ...req.body,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Mettre à jour une carte
 * @route   PUT /api/cards/:id
 * @access  Private/Admin
 */
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Supprimer une carte
 * @route   DELETE /api/cards/:id
 * @access  Private/Admin
 */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Carte supprimée avec succès",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Obtenir les cartes de l'utilisateur connecté
 * @route   GET /cards/user/collection
 * @access  Private
 */
router.get("/user/collection", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    // Récupérer les cartes avec pagination
    const cards = await Card.find({ owner: req.user.id })
      .sort("-createdAt")
      .skip(startIndex)
      .limit(limit);

    const total = await Card.countDocuments({ owner: req.user.id });
    const totalPages = Math.ceil(total / limit);

    // Récupérer les statistiques de collection
    const stats = {
      total: total,
      byRarity: await Card.aggregate([
        { $match: { owner: req.user._id } },
        {
          $group: {
            _id: "$rarity",
            count: { $sum: 1 },
          },
        },
      ]),
    };

    res.render("cards/collection", {
      title: "Ma Collection",
      page: "collection",
      user: req.user,
      cards: cards,
      stats: stats,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors du chargement de la collection:", error);
    res.status(500).render("error/500", {
      title: "Erreur",
      message: "Erreur lors du chargement de la collection",
      user: req.user,
    });
  }
});

/**
 * Génère un pack de cartes Pokémon à partir des cartes existantes dans la base de données
 * @returns {Promise<Array>} Un tableau de cartes sélectionnées
 */
const generateBoosterPack = async () => {
  try {
    // Distribution des raretés pour un booster
    const packDistribution = {
      Common: 6,
      Uncommon: 3,
      Rare: 1,
    };

    // Probabilités pour les cartes bonus rares
    const bonusRarityChance = {
      "Ultra Rare": 0.08, // 8% de chance
      "Secret Rare": 0.02, // 2% de chance
    };

    const boosterPack = [];

    // Récupérer les cartes garanties selon la distribution
    for (const [rarity, count] of Object.entries(packDistribution)) {
      // Récupérer toutes les cartes de cette rareté
      const cards = await Card.find({
        rarity,
        owner: null, // Uniquement les cartes du "pool" général
      });

      if (cards.length === 0) {
        throw new Error(`Aucune carte de rareté ${rarity} disponible`);
      }

      // Sélectionner aléatoirement le nombre requis de cartes
      for (let i = 0; i < count; i++) {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        // Créer une copie de la carte pour le joueur
        const cardCopy = {
          ...randomCard.toObject(),
          _id: undefined, // Permettre à MongoDB de générer un nouvel ID
        };
        boosterPack.push(cardCopy);
      }
    }

    // Gestion de la carte bonus rare
    const luckyDraw = Math.random();
    if (luckyDraw < bonusRarityChance["Secret Rare"]) {
      const secretRareCards = await Card.find({
        rarity: "Secret Rare",
        owner: null,
      });
      if (secretRareCards.length > 0) {
        const randomCard =
          secretRareCards[Math.floor(Math.random() * secretRareCards.length)];
        boosterPack.push({
          ...randomCard.toObject(),
          _id: undefined,
        });
      }
    } else if (luckyDraw < bonusRarityChance["Ultra Rare"]) {
      const ultraRareCards = await Card.find({
        rarity: "Ultra Rare",
        owner: null,
      });
      if (ultraRareCards.length > 0) {
        const randomCard =
          ultraRareCards[Math.floor(Math.random() * ultraRareCards.length)];
        boosterPack.push({
          ...randomCard.toObject(),
          _id: undefined,
        });
      }
    }

    return boosterPack;
  } catch (error) {
    console.error("Erreur lors de la génération du booster:", error);
    throw new Error("Impossible de générer le booster pack");
  }
};

/**
 * @desc    Ouvrir un booster pack
 * @route   POST /api/cards/booster/open
 * @access  Private
 */
router.post(
  "/booster/open",
  protect,
  rateLimit(10, 60 * 60 * 1000),
  async (req, res) => {
    try {
      // Vérifier si l'utilisateur a assez de pièces
      if (req.user.coins < 100) {
        return res.status(400).json({
          success: false,
          message: "Pas assez de pièces pour ouvrir un booster",
        });
      }

      // Générer le booster
      const boosterCards = await generateBoosterPack();

      // Déduire le coût du booster
      await req.user.buyBooster(100);

      // Assigner les cartes à l'utilisateur
      const userCards = await Promise.all(
        boosterCards.map((cardData) =>
          Card.create({
            ...cardData,
            owner: req.user.id,
            // Ajouter un numéro de série unique pour cette copie
            serialNumber: `${req.user.id}-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
          })
        )
      );

      // Mettre à jour les statistiques de collection
      await req.user.updateCollectionStats();

      res.status(200).json({
        success: true,
        message: "Booster ouvert avec succès",
        data: userCards,
      });
    } catch (error) {
      console.error("Erreur lors de l'ouverture du booster:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Erreur lors de l'ouverture du booster",
      });
    }
  }
);

// Route pour ajouter des cartes au pool général (admin seulement)
router.post("/pool/add", protect, authorize("admin"), async (req, res) => {
  try {
    const card = await Card.create({
      ...req.body,
      owner: null, // Les cartes du pool n'ont pas de propriétaire
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Route pour voir les cartes disponibles dans le pool (admin seulement)
router.get("/pool", protect, authorize("admin"), async (req, res) => {
  try {
    const cards = await Card.find({ owner: null });
    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
