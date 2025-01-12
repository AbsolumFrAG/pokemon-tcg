const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Routes', () => {
  const mockAuth = (req, res, next) => {
    req.user = { id: 'userId' };
    next();
  };

  beforeEach(() => {
    app.use(mockAuth);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser  = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/register').send(newUser );
      expect(res.status).to.equal(302); 
    });

    it('should return 400 if user or email already exists', async () => {
      const existingUser  = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/register').send(existingUser );
      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Utilisateur ou email déjà existant');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user', async () => {
      const userCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(userCredentials);
      expect(res.status).to.equal(302); 
    });

    it('should return 401 if email or password is incorrect', async () => {
      const invalidCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app).post('/api/auth/login').send(invalidCredentials);
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Email ou mot de passe incorrect');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return the user profile', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('user');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update the user profile', async () => {
      const updatedProfile = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const res = await request(app).put('/api/auth/profile').send(updatedProfile);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('user');
    });
  });
});