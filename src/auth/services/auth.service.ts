import { MongoClient, ObjectId } from 'mongodb';
import { User, UserRole } from '../models/user';
import * as bcrypt from 'bcrypt';

export class AuthService {
  public db: any;

  constructor(mongoClient: MongoClient) {
    this.db = mongoClient.db('rag_system');
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.db.collection('users').findOne({ email });
    
    if (!user || !user.password) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.collection('users').findOne({ _id: new ObjectId(id) });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const now = new Date();
    
    if (!userData.email || !userData.username) {
      throw new Error('Email and username are required');
    }
    
    // Hash password if provided
    let secureUserData = { ...userData };
    if (userData.password) {
      secureUserData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const newUser = {
      ...secureUserData,
      email: userData.email,
      username: userData.username,
      role: userData.role || UserRole.USER,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.collection('users').insertOne(newUser);
    return { _id: result.insertedId, ...newUser } as User;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData = { ...userData, updatedAt: new Date() };
    
    // Hash password if provided
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const result = await this.db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result.value;
  }
}
