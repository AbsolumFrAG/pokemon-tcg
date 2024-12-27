const cardService = require("../services/cardService");

const cardController = {
  async getAllCards(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await cardService.getAllCards(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getCardById(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.json({ success: true, card });
    } catch (error) {
      next(error);
    }
  },

  async createCard(req, res, next) {
    try {
      const card = await cardService.createCard(req.body);
      res.redirect("/cards");
    } catch (error) {
      next(error);
    }
  },

  async updateCard(req, res, next) {
    try {
      const card = await cardService.updateCard(req.params.id, req.body);
      res.json({ success: true, card });
    } catch (error) {
      next(error);
    }
  },

  async deleteCard(req, res, next) {
    try {
      await cardService.deleteCard(req.params.id);
      res.json({ success: true, message: "Carte supprimée avec succès" });
    } catch (error) {
      next(error);
    }
  },

  async searchCards(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Terme de recherche requis" });
      }
      const cards = await cardService.searchCards(q);
      res.json({ success: true, cards });
    } catch (error) {
      next(error);
    }
  },

  async getRandomCards(req, res, next) {
    try {
      const { count = 1 } = req.query;
      const cards = await cardService.getRandomCards(parseInt(count));
      res.json({ success: true, cards });
    } catch (error) {
      next(error);
    }
  },

  // Rendu des vues
  async renderCardsList(req, res, next) {
    try {
      const { page = 1, limit = 12, ...filters } = req.query;
      const result = await cardService.getAllCards(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      res.render("cards/index", {
        cards: result.cards,
        pagination: result.pagination,
        filters,
      });
    } catch (error) {
      next(error);
    }
  },

  async renderCardDetails(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.render("cards/show", { card });
    } catch (error) {
      next(error);
    }
  },

  async renderCardCreate(req, res, next) {
    res.render("cards/create");
  },

  async renderCardUpdate(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.render("cards/edit", { card });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = cardController;
