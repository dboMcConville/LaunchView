import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume: number | null;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string;
  extensions: Record<string, unknown>;
  marketCap?: number;
}

export async function getTokenMetadata(address: string): Promise<TokenMetadata & { marketCap?: number }> {
  try {
    console.log(`Fetching token metadata from Jupiter for ${address}`);
    const [metadataResponse, priceResponse] = await Promise.all([
      axios.get(`https://api.jup.ag/tokens/v1/token/${address}`),
      axios.get(`https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`)
    ]);

    if (!metadataResponse.data) {
      throw new Error("Token not found in Jupiter API");
    }

    console.log("Found token in Jupiter:", metadataResponse.data);

    const marketCap = priceResponse.data?.data?.[address]?.marketCap;
    return {
      ...metadataResponse.data,
      marketCap
    };
  } catch (error) {
    console.error('Jupiter API error:', error.response?.data || error.message);
    throw new Error("Token not found");
  }
}