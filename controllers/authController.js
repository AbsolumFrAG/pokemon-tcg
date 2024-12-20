import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (user) => {
    return jwt.sign({ 
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    }, process.env.JWT_SECRET, { 
        expiresIn: '24h' 
    });
};

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() }, 
                { username: username.trim() }
            ] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.email === email.toLowerCase() ? 
                    'Email already in use' : 'Username already taken'
            });
        }

        const user = new User({
            username: username.trim(),
            email: email.toLowerCase(),
            password,
            role: 'player' // Forcer le rôle player par défaut
        });

        await user.save();
        const token = generateToken(user);

        res.status(201).json({ 
            message: 'Player successfully registered',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }, 
            token 
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({ 
            message: `${user.role === 'admin' ? 'Admin' : 'Player'} successfully logged in`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }, 
            token 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

const verifyToken = async (req, res) => {
    try {
        const user = req.user;
        const newToken = generateToken(user);

        res.json({
            message: 'Token is valid',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            token: newToken
        });
    } catch (error) {
        res.status(401).json({ error: 'Token validation failed' });
    }
};

export { register, login, verifyToken};