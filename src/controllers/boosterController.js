const boosterService = require("../services/boosterService");

const boosterController = {
  async openBooster(req, res, next) {
    try {
      const cards = await boosterService.openBooster(req.user.id);
      res.json({ success: true, cards });
    } catch (error) {
      next(error);
    }
  },

  async getProbabilities(req, res, next) {
    try {
      const probabilities = await boosterService.getBoosterProbabilities();
      res.json({ success: true, probabilities });
    } catch (error) {
      next(error);
    }
  },

  async simulateBoosterOpening(req, res, next) {
    try {
      const { count = 1 } = req.query;
      const boosters = await boosterService.simulateBoosterOpening(
        parseInt(count)
      );
      res.json({ success: true, boosters });
    } catch (error) {
      next(error);
    }
  },

  // Rendu des vues
  async renderBoosterPage(req, res, next) {
    try {
      const probabilities = await boosterService.getBoosterProbabilities();
      res.render("boosters/open", { probabilities });
    } catch (error) {
      next(error);
    }
  },

  async renderBoosterResults(req, res, next) {
    try {
      const cards = await boosterService.openBooster(req.user.id);
      res.render("boosters/results", { cards });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = boosterController;
