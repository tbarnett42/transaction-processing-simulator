import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { UserModel, UserDocument, User } from '../models/schemas/UserSchema';
import { isMongoConnected } from '../config/database';
import { errorLogger } from './ErrorLogger';
import { ErrorSeverity, ErrorCategory } from '../models';

// In-memory user storage (fallback when MongoDB is not available)
const inMemoryUsers: Map<string, User & { password: string }> = new Map();

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    // Create default admin user
    this.createDefaultAdmin();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async createDefaultAdmin(): Promise<void> {
    try {
      const adminEmail = 'admin@example.com';
      const existingAdmin = await this.findUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        await this.register({
          email: adminEmail,
          password: 'admin123',
          name: 'System Admin',
          role: 'admin'
        });
        console.log('✓ Default admin user created (admin@example.com / admin123)');
      }
    } catch (error) {
      // Silent fail for default admin creation
    }
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'user' | 'operator';
  }): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    let user: Omit<User, 'password'>;

    if (isMongoConnected()) {
      const newUser = await UserModel.create({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role || 'user'
      });
      user = {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
    } else {
      // In-memory storage
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const now = new Date();
      const newUser: User & { password: string } = {
        id: uuidv4(),
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user',
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      inMemoryUsers.set(newUser.id, newUser);
      const { password, ...userWithoutPassword } = newUser;
      user = userWithoutPassword;
    }

    const token = this.generateToken(user);

    return {
      user,
      token,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    let user: (User & { password: string }) | null = null;

    if (isMongoConnected()) {
      const dbUser = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
      if (dbUser) {
        const isMatch = await dbUser.comparePassword(password);
        if (isMatch) {
          dbUser.lastLogin = new Date();
          await dbUser.save();
          user = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            password: dbUser.password,
            name: dbUser.name,
            role: dbUser.role,
            isActive: dbUser.isActive,
            lastLogin: dbUser.lastLogin,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt
          };
        }
      }
    } else {
      // In-memory lookup
      for (const [_, u] of inMemoryUsers) {
        if (u.email === email.toLowerCase()) {
          const isMatch = await bcrypt.compare(password, u.password);
          if (isMatch) {
            u.lastLogin = new Date();
            user = u;
          }
          break;
        }
      }
    }

    if (!user) {
      errorLogger.logError(
        ErrorSeverity.WARNING,
        ErrorCategory.AUTHENTICATION,
        'AUTH001',
        `Failed login attempt for email: ${email}`
      );
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: Omit<User, 'password'>): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    if (isMongoConnected()) {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      return user ? {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } : null;
    } else {
      for (const [_, u] of inMemoryUsers) {
        if (u.email === email.toLowerCase()) {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        }
      }
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<Omit<User, 'password'> | null> {
    if (isMongoConnected()) {
      const user = await UserModel.findById(id);
      return user ? {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } : null;
    } else {
      const user = inMemoryUsers.get(id);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    if (isMongoConnected()) {
      const users = await UserModel.find();
      return users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));
    } else {
      return Array.from(inMemoryUsers.values()).map(({ password, ...u }) => u);
    }
  }
}

export const authService = AuthService.getInstance();
