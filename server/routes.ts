import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCoinSchema, insertVoteSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Wallet routes
  app.post("/api/wallets", requireAuth, async (req, res) => {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ message: "Wallet address required" });

    try {
      const user = await storage.addWalletToUser(req.user!.id, wallet);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Coin routes
  app.post("/api/coins", requireAuth, async (req, res) => {
    try {
      const data = insertCoinSchema.parse(req.body);

      // Generate a deterministic marketing wallet address for the coin
      // In production, this would involve actual wallet creation logic
      const marketingWalletAddress = `0x${Buffer.from(data.name + data.symbol).toString('hex')}`;

      const coin = await storage.createCoin({
        ...data,
        creatorId: req.user!.id,
        marketingWalletAddress,
      });
      res.json(coin);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/coins", async (req, res) => {
    try {
      const coins = await storage.getAllCoins();
      res.json(coins);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/coins/:id", async (req, res) => {
    try {
      const coin = await storage.getCoin(parseInt(req.params.id));
      if (!coin) return res.status(404).json({ message: "Coin not found" });
      res.json(coin);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  //Transaction routes
  app.get("/api/coins/:coinId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getWalletTransactions(parseInt(req.params.coinId));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/coins/:coinId/transactions", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.createWalletTransaction({
        ...req.body,
        coinId: parseInt(req.params.coinId),
        timestamp: new Date(),
      });
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });


  // Vote routes
  app.post("/api/votes", requireAuth, async (req, res) => {
    try {
      const data = insertVoteSchema.parse(req.body);
      const vote = await storage.createVote({
        ...data,
        creatorId: req.user!.id,
      });
      res.json(vote);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/coins/:coinId/votes", async (req, res) => {
    const votes = await storage.getVotesByCoin(parseInt(req.params.coinId));
    res.json(votes);
  });

  app.post("/api/votes/:id/respond", requireAuth, async (req, res) => {
    const voteId = parseInt(req.params.id);
    const { selectedOption } = req.body;

    try {
      const response = await storage.createVoteResponse({
        voteId,
        userId: req.user!.id,
        selectedOption,
        createdAt: new Date(),
      });
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Comment routes
  app.post("/api/coins/:coinId/comments", requireAuth, async (req, res) => {
    try {
      const data = insertCommentSchema.parse(req.body);
      const lastComments = await storage.getLastComments(req.user!.id, 3);

      if (lastComments.length === 3) {
        return res.status(400).json({ message: "Cannot post more than 3 consecutive comments" });
      }

      const comment = await storage.createComment({
        ...data,
        userId: req.user!.id,
        coinId: parseInt(req.params.coinId),
        createdAt: new Date(),
      });
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/coins/:coinId/comments", async (req, res) => {
    const comments = await storage.getCommentsByCoin(parseInt(req.params.coinId));
    res.json(comments);
  });

  const httpServer = createServer(app);
  return httpServer;
}