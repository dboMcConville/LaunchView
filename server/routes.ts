import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCoinSchema, insertVoteSchema, insertCommentSchema, mintAddressSchema, tokenSupplyResponseSchema } from "@shared/schema";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { z } from "zod";
import { insertCommunityWalletTransactionSchema } from "@shared/schema";

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Token supply endpoint
  app.get("/api/token-supply/:mintAddress", async (req, res) => {
    try {
      // Validate mint address format
      const { mintAddress } = mintAddressSchema.parse({ mintAddress: req.params.mintAddress });

      // Connect to Solana mainnet
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
      const mintPubkey = new PublicKey(mintAddress);

      // Get mint info and supply
      const mintInfo = await token.getMint(connection, mintPubkey);

      const response = tokenSupplyResponseSchema.parse({
        success: true,
        data: {
          amount: mintInfo.supply.toString(),
          decimals: mintInfo.decimals
        }
      });

      res.json(response);
    } catch (error) {
      console.error("Error fetching token supply:", error);

      const errorResponse = tokenSupplyResponseSchema.parse({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch token supply"
      });

      res.status(400).json(errorResponse);
    }
  });

  // Coin routes
  app.get("/api/coins/address/:address", async (req, res) => {
    try {
      console.log("Looking up coin with contract address:", req.params.address);
      const coins = await storage.getAllCoins();
      const coin = coins.find(c => c.contractAddress === req.params.address);

      if (coin) {
        console.log("Found coin:", coin);
        return res.json(coin);
      }

      console.log("Coin not found for contract address:", req.params.address);
      res.status(404).json({ message: "Coin not found" });
    } catch (error) {
      console.error("Error looking up coin:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/coins/add", requireAuth, async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ message: "Contract address is required" });
      }

      console.log("Adding new coin with contract address:", address);

      // Check if coin already exists
      const coins = await storage.getAllCoins();
      const existingCoin = coins.find(c => c.contractAddress === address);

      if (existingCoin) {
        console.log("Coin already exists:", existingCoin);
        return res.json(existingCoin);
      }

      // Generate a new Solana wallet for the community
      const communityWallet = Keypair.generate();
      const communityWalletAddress = communityWallet.publicKey.toString();

      // Create new coin
      const coin = await storage.createCoin({
        name: `Coin ${address.substring(0, 8)}`,
        symbol: address.substring(0, 4).toUpperCase(),
        contractAddress: address,
        communityWalletAddress,
        creatorId: req.user!.id,
        communityWalletBalance: "0",
      });

      console.log("Created new coin with community wallet:", coin);
      res.json(coin);
    } catch (error) {
      console.error("Error adding coin:", error);
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

  // Transaction routes
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

  // Add community wallet transaction routes
  app.get("/api/coins/:coinId/community-transactions", async (req, res) => {
    try {
      const transactions = await storage.getCommunityWalletTransactions(parseInt(req.params.coinId));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/coins/:coinId/community-transactions", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.createCommunityWalletTransaction({
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
        createdAt: new Date(),
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