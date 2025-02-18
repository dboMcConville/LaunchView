import { pgTable, text, serial, integer, boolean, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  connectedWallets: text("connected_wallets").array(),
});

export const coins = pgTable("coins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  marketingWalletAddress: text("marketing_wallet_address").notNull(),
  marketingWalletBalance: numeric("marketing_wallet_balance").notNull().default("0"),
  creatorId: integer("creator_id").notNull(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCoinSchema = createInsertSchema(coins).pick({
  name: true,
  symbol: true,
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Coin = typeof coins.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type VoteResponse = typeof voteResponses.$inferSelect;
export type Comment = typeof comments.$inferSelect;