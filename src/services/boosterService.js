const Card = require("../models/Card");
const User = require("../models/User");

class BoosterService {
  async openBooster(userId) {
    const boosterContents = {
      Common: 5,
      Uncommon: 3,
      Rare: 1,
      "Ultra Rare": 1,
    };

    const cards = [];
    for (const [rarity, count] of Object.entries(boosterContents)) {
      const rarityCards = await Card.aggregate([
        { $match: { rarity } },
        { $sample: { size: count } },
      ]);
      cards.push(...rarityCards);
    }

    await User.findByIdAndUpdate(userId, {
      $push: { collection: { $each: cards.map((card) => card._id) } },
    });

    return cards;
  }

  async getBoosterProbabilities() {
    const probabilities = {
      Common: "50%",
      Uncommon: "30%",
      Rare: "10%",
      "Ultra Rare": "9%",
      "Secret Rare": "1%",
    };

    return probabilities;
  }

  async simulateBoosterOpening(count = 1) {
    const boosters = [];
    for (let i = 0; i < count; i++) {
      const cards = await this.getRandomBoosterCards();
      boosters.push(cards);
    }
    return boosters;
  }

  async getRandomBoosterCards() {
    const rarityDistribution = await this.getBoosterCardDistribution();
    const cards = [];

    for (const [rarity, count] of Object.entries(rarityDistribution)) {
      const rarityCards = await Card.aggregate([
        { $match: { rarity } },
        { $sample: { size: count } },
      ]);
      cards.push(...rarityCards);
    }

    return cards;
  }

  async getBoosterCardDistribution() {
    return {
      Common: 5,
      Uncommon: 3,
      Rare: 1,
      "Ultra Rare": 1,
    };
  }
}

module.exports = new BoosterService();
