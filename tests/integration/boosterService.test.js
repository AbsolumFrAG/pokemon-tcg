// boosterService.test.js
const BoosterService = require('../services/boosterService');
const Card = require('../models/Card');
const User = require('../models/User');

jest.mock('../models/Card'); // Mock le modèle Card
jest.mock('../models/User'); // Mock le modèle User

describe('BoosterService', () => {
  describe('openBooster', () => {
    it('should return cards and update user collection', async () => {
      const userId = 'userId';
      const mockCards = [
        { _id: 'card1', rarity: 'Common' },
        { _id: 'card2', rarity: 'Common' },
        { _id: 'card3', rarity: 'Uncommon' },
        { _id: 'card4', rarity: 'Rare' },
        { _id: 'card5', rarity: 'Ultra Rare' },
      ];

      // Simuler le comportement de Card.aggregate
      Card.aggregate.mockImplementationOnce(() => Promise.resolve(mockCards.slice(0, 5))) // Common
        .mockImplementationOnce(() => Promise.resolve(mockCards.slice(5, 8))) // Uncommon
        .mockImplementationOnce(() => Promise.resolve(mockCards.slice(8, 9))) // Rare
        .mockImplementationOnce(() => Promise.resolve(mockCards.slice(9, 10))); // Ultra Rare

      // Simuler le comportement de User.findByIdAndUpdate
      User.findByIdAndUpdate.mockImplementationOnce(() => Promise.resolve());

      const cards = await BoosterService.openBooster(userId);

      expect(cards).toEqual(mockCards);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $push: { collection: { $each: mockCards.map(card => card._id) } },
      });
    });
  });

  describe('getBoosterProbabilities', () => {
    it('should return booster probabilities', async () => {
      const probabilities = await BoosterService.getBoosterProbabilities();
      expect(probabilities).toEqual({
        Common: "50%",
        Uncommon: "30%",
        Rare: "10%",
        "Ultra Rare": "9%",
        "Secret Rare": "1%",
      });
    });
  });

  describe('simulateBoosterOpening', () => {
    it('should simulate opening multiple boosters', async () => {
      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      BoosterService.getRandomBoosterCards = jest.fn().mockResolvedValue(mockCards);

      const boosters = await BoosterService.simulateBoosterOpening(2);
      expect(boosters).toEqual([mockCards, mockCards]);
      expect(BoosterService.getRandomBoosterCards).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRandomBoosterCards', () => {
    it('should return random booster cards based on rarity distribution', async () => {
      const mockCards = [{ _id: 'card1', rarity: 'Common' }, { _id: 'card2', rarity: 'Uncommon' }];
      Card.aggregate.mockImplementationOnce(() => Promise.resolve(mockCards));

      const cards = await BoosterService.getRandomBoosterCards();
      expect(cards).toEqual(mockCards);
    });
  });

  describe('getBoosterCardDistribution', () => {
    it('should return the correct booster card distribution', async () => {
      const distribution = await BoosterService.getBoosterCardDistribution();
      expect(distribution).toEqual({
        Common: 5,
        Uncommon: 3,
        Rare: 1,
        "Ultra Rare": 1,
      });
    });
  });
});