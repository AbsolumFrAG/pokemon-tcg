const request = require('supertest');
const express = require('express');
const boosterRoutes = require('../routes/boosterRoutes');
const app = express();

app.use(express.json());
app.use('/api/boosters', boosterRoutes);

describe('Booster API Routes', () => {
  const mockAuth = (req, res, next) => {
    req.user = { id: 'userId' }; 
    next();
  };

  beforeEach(() => {
    app.use(mockAuth);
  });

  describe('GET /api/boosters/probabilities', () => {
    it('should return booster probabilities', async () => {
      const res = await request(app).get('/api/boosters/probabilities');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('probabilities');
    });
  });

  describe('POST /api/boosters/open', () => {
    it('should open a booster and return cards', async () => {
      const res = await request(app).post('/api/boosters/open');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('cards');
    });
  });

  describe('GET /api/boosters/simulate', () => {
    it('should simulate booster opening', async () => {
      const res = await request(app).get('/api/boosters/simulate?count=3');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('boosters');
    });

    it('should default to 1 booster if count is not provided', async () => {
      const res = await request(app).get('/api/boosters/simulate');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('boosters');
    });
  });
});