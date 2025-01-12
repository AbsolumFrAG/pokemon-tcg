const request = require('supertest');
const express = require('express');
const cardRoutes = require('../routes/cardRoutes');
const app = express();

app.use(express.json());
app.use('/api/cards', cardRoutes);

describe('API Routes', () => {
  // Simuler un utilisateur authentifié
  const mockAuth = (req, res, next) => {
    req.user = { id: 'userId', isAdmin: true };
    next();
  };

  beforeEach(() => {
    app.use(mockAuth);
  });

  describe('GET /api/cards/collection', () => {
    it('should return the user collection', async () => {
      const res = await request(app).get('/api/cards/collection');
      expect(res.status).to.equal(200);
    });
  });

  describe('POST /api/cards', () => {
    it('should create a new card', async () => {
      const newCard = {
        name: 'Test Card',
        type: 'Monster',
        rarity: 'Rare',
        hp: 100,
        count: 1,
      };

      const res = await request(app)
        .post('/api/cards')
        .send(newCard);

      expect(res.status).to.equal(302);
    });
  });

  describe('GET /api/cards/search', () => {
    it('should return cards based on search query', async () => {
      const res = await request(app).get('/api/cards/search?q=Test');
      expect(res.status).to.equal(200);
    });

    it('should return 400 if no search term is provided', async () => {
      const res = await request(app).get('/api/cards/search');
      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Terme de recherche requis');
    });
  });

});