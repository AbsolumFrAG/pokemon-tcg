const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const { auth, isAdmin } = require("../middlewares/auth");

// Routes API
router.get("/api/cards", cardController.getAllCards);
router.get("/api/cards/search", cardController.searchCards);
router.get("/api/cards/random", cardController.getRandomCards);
router.get("/api/cards/:id", cardController.getCardById);
router.post("/api/cards", auth, isAdmin, cardController.createCard);
router.put("/api/cards/:id", auth, isAdmin, cardController.updateCard);
router.delete("/api/cards/:id", auth, isAdmin, cardController.deleteCard);

// Routes de rendu
router.get("/", cardController.renderCardsList);
router.get("/new", auth, isAdmin, cardController.renderCardCreate);
router.get("/:id", cardController.renderCardDetails);
router.get("/:id/edit", auth, isAdmin, cardController.renderCardUpdate);

module.exports = router;
