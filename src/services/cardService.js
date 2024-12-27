const Card = require("../models/Card");

class CardService {
  async getAllCards(filters = {}, page = 1, limit = 10) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.rarity) query.rarity = filters.rarity;
    if (filters.name) query.name = new RegExp(filters.name, "i");

    const cards = await Card.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Card.countDocuments(query);

    return {
      cards,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCardById(id) {
    const card = await Card.findById(id);
    if (!card) {
      throw new Error("Carte non trouvée");
    }
    return card;
  }

  async createCard(cardData) {
    return await Card.create(cardData);
  }

  async updateCard(id, cardData) {
    const card = await Card.findByIdAndUpdate(
      id,
      { $set: cardData },
      { new: true, runValidators: true }
    );
    if (!card) {
      throw new Error("Carte non trouvée");
    }
    return card;
  }

  async deleteCard(id) {
    const card = await Card.findByIdAndDelete(id);
    if (!card) {
      throw new Error("Carte non trouvée");
    }
    return card;
  }

  async searchCards(searchTerm) {
    return await Card.find({
      $or: [
        { name: new RegExp(searchTerm, "i") },
        { type: new RegExp(searchTerm, "i") },
        { rarity: new RegExp(searchTerm, "i") },
      ],
    });
  }

  async getCardsByRarity(rarity) {
    return await Card.find({ rarity }).sort({ name: 1 });
  }

  async getRandomCards(count = 1) {
    return await Card.aggregate([{ $sample: { size: count } }]);
  }
}

module.exports = new CardService();
