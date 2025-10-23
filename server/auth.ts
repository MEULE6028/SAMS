import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

const tokenBlacklist = new Set<string>();

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth failed: No authorization header or not Bearer token");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  
  if (tokenBlacklist.has(token)) {
    console.log("Auth failed: Token is blacklisted");
    return res.status(401).json({ error: "Token has been revoked" });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    console.log("Auth failed: Token verification failed for endpoint:", req.path);
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = decoded as User;
  req.token = token;
  next();
}

export function revokeToken(token: string) {
  tokenBlacklist.add(token);
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
