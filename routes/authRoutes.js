import express from 'express';
import { register, login, verifyToken } from '../controllers/authController.js';
import { auth, isAdmin, isPlayer } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/verify', auth, verifyToken);
router.get('/profile', auth, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
});

router.get('/register', (req, res) => {
    res.render('auth/register');
});

router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Routes admin
router.get('/admin', auth, isAdmin, (req, res) => {
    res.json({ 
        message: 'Admin access granted',
        user: {
            id: req.user._id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Routes player
router.get('/player', auth, isPlayer, (req, res) => {
    res.json({ 
        message: 'Player access granted',
        user: {
            id: req.user._id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

export default router;