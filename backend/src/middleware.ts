import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth Header recibido:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extraído:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as any;

    console.log('✅ Token válido para usuario:', decoded.email);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    next();
  } catch (error) {
      console.log('❌ Token inválido:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
