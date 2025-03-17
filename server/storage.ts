import { User, InsertUser, Coin, Vote, VoteResponse, Comment, WalletTransaction, CommunityWallet, InsertCommunityWallet } from "@shared/schema";
import { users, coins, votes, voteResponses, comments, walletTransactions, communityWallets } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

  // Community wallet operations
  createCommunityWallet(wallet: InsertCommunityWallet): Promise<CommunityWallet>;
  getCommunityWallet(coinId: number): Promise<CommunityWallet | undefined>;
  updateCommunityWalletBalance(coinId: number, balance: string): Promise<CommunityWallet>;
  getAllCommunityWallets(): Promise<CommunityWallet[]>;

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

  // Wallet transaction operations
  createWalletTransaction(transaction: Omit<WalletTransaction, "id">): Promise<WalletTransaction>;
  getWalletTransactions(coinId: number): Promise<WalletTransaction[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async addWalletToUser(userId: number, wallet: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const [updatedUser] = await db
      .update(users)
      .set({
        connectedWallets: [...(user.connectedWallets || []), wallet],
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Coin operations
  async createCoin(coin: Omit<Coin, "id">): Promise<Coin> {
    const [newCoin] = await db.insert(coins).values(coin).returning();
    return newCoin;
  }

  async getCoin(id: number): Promise<Coin | undefined> {
    const [coin] = await db.select().from(coins).where(eq(coins.id, id));
    return coin;
  }

  async getAllCoins(): Promise<Coin[]> {
    return await db.select().from(coins);
  }

  // Community wallet methods
  async createCommunityWallet(wallet: InsertCommunityWallet): Promise<CommunityWallet> {
    const [newWallet] = await db.insert(communityWallets).values(wallet).returning();
    return newWallet;
  }

  async getCommunityWallet(coinId: number): Promise<CommunityWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(communityWallets)
      .where(eq(communityWallets.coinId, coinId));
    return wallet;
  }

  async updateCommunityWalletBalance(coinId: number, balance: string): Promise<CommunityWallet> {
    const [updatedWallet] = await db
      .update(communityWallets)
      .set({
        balance,
        lastUpdated: new Date(),
      })
      .where(eq(communityWallets.coinId, coinId))
      .returning();
    return updatedWallet;
  }

  async getAllCommunityWallets(): Promise<CommunityWallet[]> {
    return await db.select().from(communityWallets);
  }

  // Vote operations
  async createVote(vote: Omit<Vote, "id">): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    return newVote;
  }

  async getVote(id: number): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    return vote;
  }

  async getVotesByCoin(coinId: number): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.coinId, coinId));
  }

  async createVoteResponse(response: Omit<VoteResponse, "id">): Promise<VoteResponse> {
    const [newResponse] = await db.insert(voteResponses).values(response).returning();
    return newResponse;
  }

  async getVoteResponses(voteId: number): Promise<VoteResponse[]> {
    return await db.select().from(voteResponses).where(eq(voteResponses.voteId, voteId));
  }

  // Comment operations
  async createComment(comment: Omit<Comment, "id">): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsByCoin(coinId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.coinId, coinId))
      .orderBy(desc(comments.createdAt));
  }

  async getLastComments(userId: number, limit: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(limit);
  }

  // Wallet transaction operations
  async createWalletTransaction(transaction: Omit<WalletTransaction, "id">): Promise<WalletTransaction> {
    const [newTransaction] = await db
      .insert(walletTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getWalletTransactions(coinId: number): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.coinId, coinId))
      .orderBy(desc(walletTransactions.timestamp));
  }
}

export const storage = new DatabaseStorage();