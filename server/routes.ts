import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertCoinSchema,
  insertVoteSchema,
  insertCommentSchema,
  mintAddressSchema,
  tokenSupplyResponseSchema,
} from "@shared/schema";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { z } from "zod";

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check admin status
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};

// Add transfer validation schema
const transferSchema = z.object({
  amount: z.string(),
  destinationAddress: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address format"),
  tokenType: z.enum(["sol", "token"]),
  tokenAddress: z.string().nullable(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Admin routes for community wallet management
  app.get("/api/admin/community-wallets", requireAdmin, async (req, res) => {
    try {
      const coins = await storage.getAllCoins();
      const communityWallets = await storage.getAllCommunityWallets();

      // Map wallets to their corresponding coins
      const walletsWithCoinInfo = communityWallets.map((wallet) => {
        const coin = coins.find((c) => c.id === wallet.coinId);
        return {
          ...wallet,
          coinName: coin?.name || "Unknown",
          coinSymbol: coin?.symbol || "Unknown",
          contractAddress: coin?.contractAddress || "Unknown",
        };
      });

      res.json(walletsWithCoinInfo);
    } catch (error) {
      console.error("Error fetching community wallets:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Token supply endpoint
  app.get("/api/token-supply/:mintAddress", async (req, res) => {
    try {
      // Validate mint address format
      const { mintAddress } = mintAddressSchema.parse({
        mintAddress: req.params.mintAddress,
      });

      // Connect to Solana mainnet
      const connection = new Connection(
        "https://api.mainnet-beta.solana.com",
        "confirmed",
      );
      const mintPubkey = new PublicKey(mintAddress);

      // Get mint info and supply
      const mintInfo = await token.getMint(connection, mintPubkey);

      const response = tokenSupplyResponseSchema.parse({
        success: true,
        data: {
          amount: mintInfo.supply.toString(),
          decimals: mintInfo.decimals,
        },
      });

      res.json(response);
    } catch (error) {
      console.error("Error fetching token supply:", error);

      const errorResponse = tokenSupplyResponseSchema.parse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch token supply",
      });

      res.status(400).json(errorResponse);
    }
  });

  // Coin routes
  app.post("/api/coins/add", requireAuth, async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res
          .status(400)
          .json({ message: "Contract address is required" });
      }

      console.log("Adding new coin with contract address:", address);

      // Check if coin already exists
      const coins = await storage.getAllCoins();
      const existingCoin = coins.find((c) => c.contractAddress === address);

      if (existingCoin) {
        console.log("Coin already exists:", existingCoin);
        return res.json(existingCoin);
      }

      // Create new coin
      const coin = await storage.createCoin({
        name: `Coin ${address.substring(0, 8)}`,
        symbol: address.substring(0, 4).toUpperCase(),
        contractAddress: address,
        creatorId: req.user!.id,
      });

      // Generate a new Solana keypair for the community wallet
      const walletKeypair = Keypair.generate();
      const walletAddress = walletKeypair.publicKey.toString();
      const privateKeyHex = Buffer.from(walletKeypair.secretKey).toString(
        "hex",
      );

      // Create community wallet for the coin with private key stored in database
      await storage.createCommunityWallet({
        coinId: coin.id,
        walletAddress,
        privateKey: privateKeyHex,
      });

      console.log("Created new coin:", coin);
      res.json(coin);
    } catch (error) {
      console.error("Error adding coin:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Add new transfer endpoint
  app.post(
    "/api/admin/community-wallets/:walletId/transfer",
    requireAdmin,
    async (req, res) => {
      try {
        console.log('Transfer request received:', {
          walletId: req.params.walletId,
          body: req.body
        });
        const { amount, destinationAddress, tokenType, tokenAddress } =
          transferSchema.parse(req.body);

        // Connect to Solana network
        const connection = new Connection(
          "https://api.mainnet-beta.solana.com",
          "confirmed",
        );

        // Get wallet details
        const wallets = await storage.getAllCommunityWallets();
        const wallet = wallets.find(w => w.id === parseInt(req.params.walletId));
        console.log('Wallet fetch result:', wallet);
        if (!wallet) {
          return res.status(404).json({ message: "Wallet not found" });
        }

        const fromPubkey = new PublicKey(wallet.walletAddress);
        const toPubkey = new PublicKey(destinationAddress);

        let transaction = new Transaction();

        if (tokenType === "sol") {
          // Transfer SOL
          transaction.add(
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
            }),
          );
        } else if (tokenType === "token" && tokenAddress) {
          // Transfer SPL Token
          const tokenPublicKey = new PublicKey(tokenAddress);
          const fromTokenAccount = await token.getAssociatedTokenAddress(
            tokenPublicKey,
            fromPubkey,
          );
          const toTokenAccount = await token.getAssociatedTokenAddress(
            tokenPublicKey,
            toPubkey,
          );

          // Check if destination token account exists
          const toTokenAccountInfo =
            await connection.getAccountInfo(toTokenAccount);

          if (!toTokenAccountInfo) {
            // Create associated token account for destination if it doesn't exist
            transaction.add(
              token.createAssociatedTokenAccountInstruction(
                fromPubkey, // payer
                toTokenAccount,
                toPubkey,
                tokenPublicKey,
              ),
            );
          }

          // Add token transfer instruction
          transaction.add(
            token.createTransferInstruction(
              fromTokenAccount,
              toTokenAccount,
              fromPubkey,
              BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 9))), // assuming 9 decimals
            ),
          );
        }

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        // Sign and send transaction using private key from database
        const signer = Keypair.fromSecretKey(
          Buffer.from(wallet.privateKey, "hex"),
        );
        transaction.sign(signer);

        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
        );
        await connection.confirmTransaction(signature);

        // Update wallet balance in database
        const accountInfo = await connection.getAccountInfo(fromPubkey);
        const newBalance = (accountInfo?.lamports || 0).toString();
        await storage.updateCommunityWalletBalance(wallet.coinId, newBalance);

        res.json({
          message: "Transfer successful",
          signature,
          newBalance,
        });
      } catch (error) {
        console.error("Transfer error:", error);
        res.status(400).json({ message: (error as Error).message });
      }
    },
  );

  app.get("/api/coins/address/:address", async (req, res) => {
    try {
      console.log("Looking up coin with contract address:", req.params.address);
      const coins = await storage.getAllCoins();
      const coin = coins.find((c) => c.contractAddress === req.params.address);

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
      const transactions = await storage.getWalletTransactions(
        parseInt(req.params.coinId),
      );
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
        return res
          .status(400)
          .json({ message: "Cannot post more than 3 consecutive comments" });
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
    const comments = await storage.getCommentsByCoin(
      parseInt(req.params.coinId),
    );
    res.json(comments);
  });

  // Add new endpoint to get token accounts for a wallet
  app.get(
    "/api/admin/community-wallets/:walletId/tokens",
    requireAdmin,
    async (req, res) => {
      try {
        // Get wallet by ID directly from database
        const wallets = await storage.getAllCommunityWallets();
        const wallet = wallets.find(w => w.id === parseInt(req.params.walletId));
        if (!wallet) {
          return res.status(404).json({ message: "Wallet not found" });
        }

        // Connect to Solana network
        const connection = new Connection(
          "https://api.mainnet-beta.solana.com",
          "confirmed",
        );
        const walletPublicKey = new PublicKey(wallet.walletAddress);

        // Get all token accounts owned by the wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          walletPublicKey,
          {
            programId: token.TOKEN_PROGRAM_ID,
          },
        );

        // Get SOL balance
        const solBalance = await connection.getBalance(walletPublicKey);

        // Format token data
        const tokens = [
          {
            symbol: "SOL",
            name: "Solana",
            mint: "native",
            balance: solBalance / LAMPORTS_PER_SOL,
            decimals: 9,
          },
        ];

        // Add SPL tokens
        for (const { account } of tokenAccounts.value) {
          const parsedInfo = account.data.parsed.info;

          if (parsedInfo.tokenAmount && parsedInfo.tokenAmount.uiAmount > 0) {
            try {
              // Fetch token metadata from Jupiter
              const jupiterResponse = await fetch(
                `https://api.jup.ag/api/tokens/v1/token/${parsedInfo.mint}`
              );
              const tokenMetadata = await jupiterResponse.json();

              tokens.push({
                symbol: tokenMetadata.symbol || "Unknown",
                name: tokenMetadata.name || "Unknown Token",
                mint: parsedInfo.mint,
                balance: parsedInfo.tokenAmount.uiAmount,
                decimals: parsedInfo.tokenAmount.decimals,
              });
            } catch (error) {
              console.error(`Error fetching metadata for token ${parsedInfo.mint}:`, error);
              // Fallback to basic info if Jupiter API fails
              tokens.push({
                symbol: parsedInfo.symbol || "Unknown",
                name: parsedInfo.name || "Unknown Token",
                mint: parsedInfo.mint,
                balance: parsedInfo.tokenAmount.uiAmount,
                decimals: parsedInfo.tokenAmount.decimals,
              });
            }
          }
        }

        console.log("Available tokens:", tokens);
        res.json(tokens);
      } catch (error) {
        console.error("Error fetching token accounts:", error);
        res.status(500).json({ message: (error as Error).message });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}