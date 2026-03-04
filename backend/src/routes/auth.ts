import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { db } from '../database';
import { AuthRequest, authMiddleware } from '../middleware';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types';

const router = express.Router();

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'refresh_secret';

router.post('/register', async (req, res: Response) => {
  try {
    const { nombre, email, password, rol, institucion } = req.body as RegisterRequest;

    if (!nombre || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = await db.createUser({
      id: uuidv4(),
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'medico',
      institucion,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.rol },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      getJwtRefreshSecret(),
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;

    const response: AuthResponse = {
      token,
      refreshToken,
      user: userWithoutPassword,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = bcryptjs.compareSync(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.rol },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      getJwtRefreshSecret(),
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      token,
      refreshToken,
      user: userWithoutPassword,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, getJwtRefreshSecret()) as any;
    const user = await db.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.rol },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
