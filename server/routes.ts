// Add new endpoint to get token accounts for a wallet
app.get("/api/admin/community-wallets/:walletId/tokens", requireAdmin, async (req, res) => {
  try {
    const wallet = await storage.getCommunityWallet(parseInt(req.params.walletId));
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Connect to Solana network
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const walletPublicKey = new PublicKey(wallet.walletAddress);

    // Get SOL balance
    const solBalance = await connection.getBalance(walletPublicKey);

    // Format token data
    const tokens = [{
      symbol: 'SOL',
      name: 'Solana',
      mint: 'native',
      balance: solBalance / LAMPORTS_PER_SOL,
      decimals: 9,
    }];

    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      programId: token.TOKEN_PROGRAM_ID,
    });

    // Add SPL tokens
    for (const { account } of tokenAccounts.value) {
      if (!account.data.parsed || !account.data.parsed.info) continue;

      const { mint, tokenAmount } = account.data.parsed.info;
      if (!tokenAmount || tokenAmount.uiAmount <= 0) continue;

      // Special handling for IMG token
      if (mint === "iMGxCr6dz6ZmXvMAxDvBaJP9UKTQGkc4kpveiuHWkPr") {
        tokens.push({
          symbol: "IMG",
          name: "IMG Token",
          mint: mint,
          balance: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals,
        });
      } else {
        tokens.push({
          symbol: 'Unknown',
          name: 'Unknown Token',
          mint: mint,
          balance: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals,
        });
      }
    }

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});