const express = require("express");
const router = express.Router();
const boosterController = require("../controllers/boosterController");
const { auth } = require("../middlewares/auth");

// Routes API
router.get("/api/probabilities", boosterController.getProbabilities);
router.post("/api/open", auth, boosterController.openBooster);
router.get("/api/simulate", auth, boosterController.simulateBoosterOpening);

// Routes de rendu
router.get("/", auth, boosterController.renderBoosterPage);
router.get("/results", auth, boosterController.renderBoosterResults);

module.exports = router;
