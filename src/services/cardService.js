const Card = require("../models/Card");
const User = require("../models/User");

class CardService {
  async getAllCards(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};

      if (filters.type) query.type = filters.type;
      if (filters.rarity) query.rarity = filters.rarity;
      if (filters.name) query.name = new RegExp(filters.name, "i");

      const [cards, total] = await Promise.all([
        Card.find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ rarity: -1, name: 1 }),
        Card.countDocuments(query),
      ]);

      return {
        cards,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des cartes: ${error.message}`
      );
    }
  }

  async getCardById(id) {
    try {
      const card = await Card.findById(id);
      if (!card) {
        throw new Error("Carte non trouvée");
      }
      return card;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération de la carte: ${error.message}`
      );
    }
  }

  async createCard(cardData) {
    try {
      const card = new Card(cardData);
      await card.validate(); // Validation explicite avant la sauvegarde
      return await card.save();
    } catch (error) {
      throw new Error(
        `Erreur lors de la création de la carte: ${error.message}`
      );
    }
  }

  async updateCard(id, cardData) {
    try {
      const card = await Card.findByIdAndUpdate(
        id,
        { $set: cardData },
        { new: true, runValidators: true }
      );
      if (!card) {
        throw new Error("Carte non trouvée");
      }
      return card;
    } catch (error) {
      throw new Error(
        `Erreur lors de la mise à jour de la carte: ${error.message}`
      );
    }
  }

  async deleteCard(id) {
    try {
      const card = await Card.findByIdAndDelete(id);
      if (!card) {
        throw new Error("Carte non trouvée");
      }
      return card;
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression de la carte: ${error.message}`
      );
    }
  }

  async searchCards(searchTerm) {
    try {
      return await Card.find({
        $or: [
          { name: new RegExp(searchTerm, "i") },
          { type: new RegExp(searchTerm, "i") },
          { rarity: new RegExp(searchTerm, "i") },
        ],
      }).sort({ rarity: -1, name: 1 });
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche de cartes: ${error.message}`
      );
    }
  }

  async getCardsByRarity(rarity) {
    try {
      return await Card.find({ rarity }).sort({ name: 1 });
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des cartes par rareté: ${error.message}`
      );
    }
  }

  async getRandomCards(count = 1) {
    try {
      return await Card.aggregate([{ $sample: { size: count } }]);
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des cartes aléatoires: ${error.message}`
      );
    }
  }

  async getUserCollection(userId) {
    try {
      const user = await User.findById(userId).populate("collection");
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Calculer le nombre d'exemplaires pour chaque carte
      const cardCounts = user.collection.reduce((acc, card) => {
        const cardId = card._id.toString();
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
      }, {});

      // Créer un tableau de cartes uniques avec leur compte
      const uniqueCards = Array.from(
        new Map(
          user.collection.map((card) => [card._id.toString(), card])
        ).values()
      ).map((card) => ({
        ...card.toObject(),
        count: cardCounts[card._id.toString()],
      }));

      // Trier par rareté (du plus rare au plus commun) puis par nom
      return uniqueCards.sort((a, b) => {
        const rarityOrder = {
          "Secret Rare": 0,
          "Ultra Rare": 1,
          Rare: 2,
          Uncommon: 3,
          Common: 4,
        };

        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération de la collection: ${error.message}`
      );
    }
  }

  async getCollectionStats(userId) {
    try {
      const collection = await this.getUserCollection(userId);

      return collection.reduce(
        (stats, card) => {
          stats.totalCards += card.count;
          stats.uniqueCards++;
          stats.byRarity[card.rarity] =
            (stats.byRarity[card.rarity] || 0) + card.count;
          stats.byType[card.type] = (stats.byType[card.type] || 0) + card.count;

          if (card.count > 1) {
            stats.duplicates.push({
              cardId: card._id,
              name: card.name,
              count: card.count,
            });
          }

          return stats;
        },
        {
          totalCards: 0,
          uniqueCards: 0,
          byRarity: {},
          byType: {},
          duplicates: [],
        }
      );
    } catch (error) {
      throw new Error(
        `Erreur lors du calcul des statistiques: ${error.message}`
      );
    }
  }

  async getCollectionProgress() {
    try {
      const [totalCards, uniqueCards] = await Promise.all([
        Card.countDocuments(),
        Card.distinct("_id").countDocuments(),
      ]);

      return {
        totalCards,
        uniqueCards,
        completion: ((uniqueCards / totalCards) * 100).toFixed(2),
      };
    } catch (error) {
      throw new Error(
        `Erreur lors du calcul de la progression: ${error.message}`
      );
    }
  }
}

module.exports = new CardService();
