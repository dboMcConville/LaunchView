import { pgTable, text, serial, integer, boolean, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  connectedWallets: text("connected_wallets").array(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const coins = pgTable("coins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  contractAddress: text("contract_address").notNull().unique(),
  creatorId: integer("creator_id").notNull(),
});

export const communityWallets = pgTable("community_wallets", {
  id: serial("id").primaryKey(),
  coinId: integer("coin_id").notNull().unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  privateKey: text("private_key").notNull(),
  balance: numeric("balance").notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  coinId: integer("coin_id").notNull(),
  title: text("title").notNull(),
  options: json("options").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closesAt: timestamp("closes_at").notNull(),
  creatorId: integer("creator_id").notNull(),
});

export const voteResponses = pgTable("vote_responses", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id").notNull(),
  userId: integer("user_id").notNull(),
  selectedOption: integer("selected_option").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  coinId: integer("coin_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  coinId: integer("coin_id").notNull(),
  amount: numeric("amount").notNull(),
  senderAddress: text("sender_address").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  description: text("description"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCoinSchema = createInsertSchema(coins).pick({
  name: true,
  symbol: true,
  contractAddress: true,
});

export const insertCommunityWalletSchema = createInsertSchema(communityWallets).pick({
  coinId: true,
  walletAddress: true,
  privateKey: true
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  coinId: true,
  title: true,
  options: true,
  closesAt: true,
});

export const insertVoteResponseSchema = createInsertSchema(voteResponses).pick({
  voteId: true,
  selectedOption: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  coinId: true,
  content: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).pick({
  coinId: true,
  amount: true,
  senderAddress: true,
  description: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Coin = typeof coins.$inferSelect;
export type CommunityWallet = typeof communityWallets.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type VoteResponse = typeof voteResponses.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertCommunityWallet = z.infer<typeof insertCommunityWalletSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type InsertVoteResponse = z.infer<typeof insertVoteResponseSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type InsertCoin = z.infer<typeof insertCoinSchema>;

export const tokenSupplyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    amount: z.string(),
    decimals: z.number()
  }).optional(),
  error: z.string().optional()
});

export const mintAddressSchema = z.object({
  mintAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address format")
});

export type TokenSupplyResponse = z.infer<typeof tokenSupplyResponseSchema>;