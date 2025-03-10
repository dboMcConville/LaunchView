import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
  created_at?: string;
  extensions?: Record<string, unknown>;
}

export async function getTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
    console.log(`Fetching token metadata from Jupiter for ${address}`);
    const jupiterResponse = await axios.get(`https://api.jup.ag/tokens/v1/token/${address}`);

    if (!jupiterResponse.data) {
      throw new Error("Token not found in Jupiter API");
    }

    console.log("Found token in Jupiter:", jupiterResponse.data);
    return jupiterResponse.data;
  } catch (error) {
    console.error('Jupiter API error:', error);
    throw new Error("Token not found");
  }
}