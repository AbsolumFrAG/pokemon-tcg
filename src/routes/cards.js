const express = require("express");
const cardController = require("../controllers/cardController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Routes API
router.get("/collection", auth, cardController.renderCollection);
router.get("/new", auth, isAdmin, cardController.renderCardCreate);
router.post("/card", auth, isAdmin, cardController.createCard);

// Routes de recherche
router.get("/search", cardController.searchCards);
router.get("/autocomplete", cardController.autocompleteSearch);
router.get("/random", cardController.getRandomCards);

// Route d'export
router.get("/export", auth, cardController.exportCollection);

// Routes avec ID
router.get("/:id", cardController.renderCardDetails);
router.get("/:id/edit", auth, isAdmin, cardController.renderCardUpdate);
router.put("/:id", auth, isAdmin, cardController.updateCard);
router.delete("/:id", auth, isAdmin, cardController.deleteCard);

// Routes générales
router.get("/", cardController.renderCardsList);
router.post("/", auth, isAdmin, cardController.createCard);

module.exports = router;
