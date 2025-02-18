import { User, InsertUser, Coin, Vote, VoteResponse, Comment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  addWalletToUser(userId: number, wallet: string): Promise<User>;
  
  // Coin operations
  createCoin(coin: Omit<Coin, "id">): Promise<Coin>;
  getCoin(id: number): Promise<Coin | undefined>;
  getAllCoins(): Promise<Coin[]>;
  
  // Vote operations
  createVote(vote: Omit<Vote, "id">): Promise<Vote>;
  getVote(id: number): Promise<Vote | undefined>;
  getVotesByCoin(coinId: number): Promise<Vote[]>;
  createVoteResponse(response: Omit<VoteResponse, "id">): Promise<VoteResponse>;
  getVoteResponses(voteId: number): Promise<VoteResponse[]>;
  
  // Comment operations
  createComment(comment: Omit<Comment, "id">): Promise<Comment>;
  getCommentsByCoin(coinId: number): Promise<Comment[]>;
  getLastComments(userId: number, limit: number): Promise<Comment[]>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private coins: Map<number, Coin>;
  private votes: Map<number, Vote>;
  private voteResponses: Map<number, VoteResponse>;
  private comments: Map<number, Comment>;
  public sessionStore: session.Store;
  private currentId: Record<string, number>;

  constructor() {
    this.users = new Map();
    this.coins = new Map();
    this.votes = new Map();
    this.voteResponses = new Map();
    this.comments = new Map();
    this.currentId = {
      users: 1,
      coins: 1,
      votes: 1,
      voteResponses: 1,
      comments: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, connectedWallets: [] };
    this.users.set(id, user);
    return user;
  }

  async addWalletToUser(userId: number, wallet: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      connectedWallets: [...(user.connectedWallets || []), wallet],
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Coin operations
  async createCoin(coin: Omit<Coin, "id">): Promise<Coin> {
    const id = this.currentId.coins++;
    const newCoin = { ...coin, id };
    this.coins.set(id, newCoin);
    return newCoin;
  }

  async getCoin(id: number): Promise<Coin | undefined> {
    return this.coins.get(id);
  }

  async getAllCoins(): Promise<Coin[]> {
    return Array.from(this.coins.values());
  }

  // Vote operations
  async createVote(vote: Omit<Vote, "id">): Promise<Vote> {
    const id = this.currentId.votes++;
    const newVote = { ...vote, id };
    this.votes.set(id, newVote);
    return newVote;
  }

  async getVote(id: number): Promise<Vote | undefined> {
    return this.votes.get(id);
  }

  async getVotesByCoin(coinId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.coinId === coinId,
    );
  }

  async createVoteResponse(response: Omit<VoteResponse, "id">): Promise<VoteResponse> {
    const id = this.currentId.voteResponses++;
    const newResponse = { ...response, id };
    this.voteResponses.set(id, newResponse);
    return newResponse;
  }

  async getVoteResponses(voteId: number): Promise<VoteResponse[]> {
    return Array.from(this.voteResponses.values()).filter(
      (response) => response.voteId === voteId,
    );
  }

  // Comment operations
  async createComment(comment: Omit<Comment, "id">): Promise<Comment> {
    const id = this.currentId.comments++;
    const newComment = { ...comment, id };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getCommentsByCoin(coinId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.coinId === coinId,
    );
  }

  async getLastComments(userId: number, limit: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
