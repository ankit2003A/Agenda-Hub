import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { body } from 'express-validator';
import { db } from '../firebase';
import bcrypt from 'bcryptjs';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    // Check if user exists
    const userQuery = await db.collection('users').where('email', '==', email).get();
    if (!userQuery.empty) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const userRef = await db.collection('users').add({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // Generate JWT
    const token = jwt.sign(
      { userId: userRef.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.status(201).json({
      token,
      user: {
        id: userRef.id,
        email,
        name,
        role: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').trim().notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    // Find user by email
    const userQuery = await db.collection('users').where('email', '==', email).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Generate JWT
    const token = jwt.sign(
      { userId: userDoc.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(user.userId || user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    res.json({
      id: userDoc.id,
      email: userData?.email,
      name: userData?.name,
      role: userData?.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export { router as userRouter };
