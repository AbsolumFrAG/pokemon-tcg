const CardService = require('../services/cardService');
const Card = require('../models/Card');
const User = require('../models/User');

jest.mock('../models/Card'); // Mock le modèle Card
jest.mock('../models/User'); // Mock le modèle User

describe('CardService', () => {
  describe('getAllCards', () => {
    it('should return cards and pagination info', async () => {
      const filters = { type: 'Monster', rarity: 'Rare' };
      const page = 1;
      const limit = 10;

      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      Card.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockCards),
        }),
      });
      Card.countDocuments.mockResolvedValue(20);

      const result = await CardService.getAllCards(filters, page, limit);

      expect(result).toEqual({
        cards: mockCards,
        pagination: {
          total: 20,
          page: 1,
          pages: 2,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should handle errors', async () => {
      Card.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getAllCards()).rejects.toThrow('Erreur lors de la récupération des cartes: Database error');
    });
  });

  describe('getCardById', () => {
    it('should return a card by ID', async () => {
      const mockCard = { _id: 'card1', name: 'Test Card' };
      Card.findById.mockResolvedValue(mockCard);

      const card = await CardService.getCardById('card1');
      expect(card).toEqual(mockCard);
    });

    it('should throw an error if card not found', async () => {
      Card.findById.mockResolvedValue(null);

      await expect(CardService.getCardById('card1')).rejects.toThrow('Carte non trouvée');
    });

    it('should handle errors', async () => {
      Card.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getCardById('card1')).rejects.toThrow('Erreur lors de la récupération de la carte: Database error');
    });
  });

  describe('createCard', () => {
    it('should create a new card', async () => {
      const cardData = { name: 'New Card', rarity: 'Common' };
      const mockCard = { _id: 'card1', ...cardData };
      Card.prototype.validate = jest.fn().mockResolvedValue();
      Card.prototype.save = jest.fn().mockResolvedValue(mockCard);

      const card = await CardService.createCard(cardData);
      expect(card).toEqual(mockCard);
      expect(Card.prototype.validate).toHaveBeenCalled();
      expect(Card.prototype.save).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const cardData = { name: 'Invalid Card' };
      Card.prototype.validate = jest.fn().mockRejectedValue(new Error('Validation error'));

      await expect(CardService.createCard(cardData)).rejects.toThrow('Erreur lors de la création de la carte: Validation error');
    });

    it('should handle errors', async () => {
      const cardData = { name: 'New Card' };
      Card.prototype.validate = jest.fn().mockResolvedValue();
      Card.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(CardService.createCard(cardData)).rejects.toThrow('Erreur lors de la création de la carte: Database error');
    });
  });

  describe('updateCard', () => {
    it('should update a card by ID', async () => {
      const cardData = { name: 'Updated Card' };
      const mockCard = { _id: 'card1', ...cardData };
      Card.findByIdAndUpdate.mockResolvedValue(mockCard);

      const card = await CardService.updateCard('card1', cardData);
      expect(card).toEqual(mockCard);
    });

    it('should throw an error if card not found during update', async () => {
      Card.findByIdAndUpdate.mockResolvedValue(null);

      await expect(CardService.updateCard('card1', { name: 'Updated Card' })).rejects.toThrow('Carte non trouvée');
    });

    it('should handle errors during update', async () => {
      Card.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.updateCard('card1', { name: 'Updated Card' })).rejects.toThrow('Erreur lors de la mise à jour de la carte: Database error');
    });
  });

  describe('deleteCard', () => {
    it('should delete a card by ID', async () => {
      const mockCard = { _id: 'card1', name: 'Test Card' };
      Card.findByIdAndDelete.mockResolvedValue(mockCard);

      const card = await CardService.deleteCard('card1');
      expect(card).toEqual(mockCard);
    });

    it('should throw an error if card not found during deletion', async () => {
      Card.findByIdAndDelete.mockResolvedValue(null);

      await expect(CardService.deleteCard('card1')).rejects.toThrow('Carte non trouvée');
    });

    it('should handle errors during deletion', async () => {
      Card.findByIdAndDelete.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.deleteCard('card1')).rejects.toThrow('Erreur lors de la suppression de la carte: Database error');
    });
  });

  describe('searchCards', () => {
    it('should return cards matching the search term', async () => {
      const searchTerm = 'Test';
      const mockCards = [{ _id: 'card1', name: 'Test Card' }];
      Card.find.mockResolvedValue(mockCards);

      const cards = await CardService.searchCards(searchTerm);
      expect(cards).toEqual(mockCards);
    });

    it('should handle errors during search', async () => {
      Card.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.searchCards('Test')).rejects.toThrow('Erreur lors de la recherche de cartes: Database error');
    });
  });

  describe('getCardsByRarity', () => {
    it('should return cards of a specific rarity', async () => {
      const rarity = 'Rare';
      const mockCards = [{ _id: 'card1', rarity }];
      Card.find.mockResolvedValue(mockCards);

      const cards = await CardService.getCardsByRarity(rarity);
      expect(cards).toEqual(mockCards);
    });

    it('should handle errors during retrieval by rarity', async () => {
      Card.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getCardsByRarity('Rare')).rejects.toThrow('Erreur lors de la récupération des cartes par rareté: Database error');
    });
  });

  describe('getRandomCards', () => {
    it('should return random cards', async () => {
      const count = 2;
      const mockCards = [{ _id: 'card1' }, { _id: 'card2' }];
      Card.aggregate.mockResolvedValue(mockCards);

      const cards = await CardService.getRandomCards(count);
      expect(cards).toEqual(mockCards);
    });

    it('should handle errors during random card retrieval', async () => {
      Card.aggregate.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getRandomCards(1)).rejects.toThrow('Erreur lors de la récupération des cartes aléatoires: Database error');
    });
  });

  describe('getUser Collection', () => {
    it('should return user collection with card counts', async () => {
      const userId = 'userId';
      const mockUser   = {
        _id: userId,
        collection: [{ _id: 'card1', rarity: 'Common' }, { _id: 'card1', rarity: 'Common' }, { _id: 'card2', rarity: 'Rare' }],
      };
      User.findById.mockResolvedValue(mockUser );

      const collection = await CardService.getUser(userId);
      expect(collection).toHaveLength(2);
      expect(collection[0].count).toBe(2);
      expect(collection[1].count).toBe(1);
    });

    it('should throw an error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(CardService.getUser('userId')).rejects.toThrow('Utilisateur non trouvé');
    });

    it('should handle errors during user collection retrieval', async () => {
      User.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getUser('userId')).rejects.toThrow('Erreur lors de la récupération de la collection: Database error');
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection statistics', async () => {
      const userId = 'userId';
      const mockCollection = [
        { _id: 'card1', rarity: 'Common', count: 2 },
        { _id: 'card2', rarity: 'Rare', count: 1 },
      ];
      jest.spyOn(CardService, 'getUser  Collection').mockResolvedValue(mockCollection);

      const stats = await CardService.getCollectionStats(userId);
      expect(stats.totalCards).toBe(3);
      expect(stats.uniqueCards).toBe(2);
      expect(stats.byRarity).toEqual({ Common: 2, Rare: 1 });
      expect(stats.byType).toEqual({});
      expect(stats.duplicates).toEqual([{ cardId: 'card1', name: undefined, count: 2 }]);
    });

    it('should handle errors during collection stats retrieval', async () => {
      jest.spyOn(CardService, 'getUser  Collection').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getCollectionStats('userId')).rejects.toThrow('Erreur lors du calcul des statistiques: Database error');
    });
  });

  describe('getCollectionProgress', () => {
    it('should return collection progress', async () => {
      jest.spyOn(Card, 'countDocuments').mockResolvedValue(100);
      jest.spyOn(Card, 'distinct').mockResolvedValue(['card1', 'card2']);

      const progress = await CardService.getCollectionProgress();
      expect(progress.totalCards).toBe(100);
      expect(progress.uniqueCards).toBe(2);
      expect(progress.completion).toBe('2.00');
    });

    it('should handle errors during collection progress retrieval', async () => {
      jest.spyOn(Card, 'countDocuments').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(CardService.getCollectionProgress()).rejects.toThrow('Erreur lors du calcul de la progression: Database error');
    });
  });
});