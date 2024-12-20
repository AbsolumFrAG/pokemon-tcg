import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('No authentication token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (
            user.email !== decoded.email ||
            user.role !== decoded.role ||
            user.username !== decoded.username
        ) {
            throw new Error('User information has been modified');
        }

        req.user = user;
        req.token = token;
        req.decodedToken = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            error: 'Authentication failed', 
            details: error.message 
        });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: `This action requires ${roles.join(' or ')} privileges`
            });
        }
        next();
    };
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'This action requires admin privileges'
        });
    }
    next();
};

const isPlayer = (req, res, next) => {
    if (req.user.role !== 'player') {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'This action requires player privileges'
        });
    }
    next();
};

export { auth, checkRole, isAdmin, isPlayer };