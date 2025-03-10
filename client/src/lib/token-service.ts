import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

interface TokenMetadata {
  name: string;
  symbol: string;
  totalSupply?: string;
  decimals: number;
  holders?: number;
  mintAuthority?: string;
}

export async function getTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
    console.log('Fetching token metadata from Jupiter');
    const jupiterResponse = await axios.get(`https://token.jup.ag/token/${address}`);
    console.log('Jupiter API Response:', jupiterResponse.data);

    if (jupiterResponse.data) {
      const tokenData = jupiterResponse.data;
      return {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals || 0,
        holders: tokenData.holder_count,
        totalSupply: tokenData.supply?.toLocaleString() || 'Unknown',
        mintAuthority: tokenData.mint_authority || 'Unknown'
      };
    }

    // Fallback to Solana RPC
    console.log('Token not found in Jupiter, falling back to Solana RPC');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const mintPubkey = new PublicKey(address);

    const accountInfo = await connection.getParsedAccountInfo(mintPubkey);
    console.log('Solana RPC Response:', accountInfo);

    if (!accountInfo.value) {
      throw new Error('Token not found on Solana blockchain');
    }

    const parsedData = accountInfo.value.data as any;
    return {
      name: 'Unknown Token',
      symbol: 'Unknown',
      decimals: parsedData.parsed?.info?.decimals || 0,
      totalSupply: 'Unknown',
      mintAuthority: parsedData.parsed?.info?.mintAuthority || 'Unknown'
    };

  } catch (error) {
    console.error('Error fetching token metadata:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Token not found in Jupiter API: ${error.message}`);
    }
    throw new Error(`Token not found on Solana blockchain: ${(error as Error).message}`);
  }
}