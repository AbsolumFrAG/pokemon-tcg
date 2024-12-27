const cardService = require("../services/cardService");

const cardController = {
  // Liste des cartes avec pagination et filtres
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

  // Obtenir une carte par son ID
  async getCardById(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.json({ success: true, card });
    } catch (error) {
      next(error);
    }
  },

  // Créer une nouvelle carte
  async createCard(req, res, next) {
    try {
      const card = await cardService.createCard(req.body);
      res.redirect(`/cards/${card._id}`);
    } catch (error) {
      next(error);
    }
  },

  // Mettre à jour une carte
  async updateCard(req, res, next) {
    try {
      const card = await cardService.updateCard(req.params.id, req.body);
      res.json({ success: true, card });
    } catch (error) {
      next(error);
    }
  },

  // Supprimer une carte
  async deleteCard(req, res, next) {
    try {
      await cardService.deleteCard(req.params.id);
      res.json({ success: true, message: "Carte supprimée avec succès" });
    } catch (error) {
      next(error);
    }
  },

  // Rechercher des cartes
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

  // Obtenir des cartes aléatoires
  async getRandomCards(req, res, next) {
    try {
      const { count = 1 } = req.query;
      const cards = await cardService.getRandomCards(parseInt(count));
      res.json({ success: true, cards });
    } catch (error) {
      next(error);
    }
  },

  // Afficher la collection d'un utilisateur
  async renderCollection(req, res, next) {
    try {
      const [collection, stats] = await Promise.all([
        cardService.getUserCollection(req.user.id),
        cardService.getCollectionStats(req.user.id),
      ]);

      res.render("cards/collection", {
        collection,
        stats,
        title: "Ma Collection",
      });
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
        title: "Liste des cartes",
      });
    } catch (error) {
      next(error);
    }
  },

  async renderCardDetails(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.render("cards/show", {
        card,
        title: card.name,
      });
    } catch (error) {
      next(error);
    }
  },

  async renderCardCreate(req, res, next) {
    res.render("cards/create", {
      title: "Créer une carte",
    });
  },

  async renderCardUpdate(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      res.render("cards/edit", {
        card,
        title: `Modifier ${card.name}`,
      });
    } catch (error) {
      next(error);
    }
  },

  // API de recherche pour l'autocomplétion
  async autocompleteSearch(req, res, next) {
    try {
      const { term } = req.query;
      if (!term || term.length < 2) {
        return res.json([]);
      }

      const cards = await cardService.searchCards(term);
      const suggestions = cards.map((card) => ({
        value: card._id,
        label: card.name,
        type: card.type,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
      }));

      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  },

  // Endpoint pour obtenir les statistiques de collection
  async getCollectionStats(req, res, next) {
    try {
      const stats = await cardService.getCollectionStats(req.user.id);
      res.json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  },

  // Exporter la collection au format CSV
  async exportCollection(req, res, next) {
    try {
      const collection = await cardService.getUserCollection(req.user.id);
      const csvContent = collection.map((card) => {
        return [card.name, card.type, card.rarity, card.hp, card.count].join(
          ","
        );
      });

      const header = ["Nom", "Type", "Rareté", "HP", "Exemplaires"].join(",");
      const csv = [header, ...csvContent].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=collection.csv"
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = cardController;
