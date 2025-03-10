import { PublicKey } from '@solana/web3.js';
import axios from 'axios';

interface TokenMetadata {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  holders?: number;
  mintAuthority?: string;
}

export async function getTokenMetadata(address: string): Promise<TokenMetadata> {
  try {
    // Validate the address is a valid Solana public key
    const mintPubkey = new PublicKey(address);

    // Get Jupiter API metadata which includes most token information
    const jupiterResponse = await axios.get(
      `https://price.jup.ag/v4/metadata/all`
    );

    const tokenData = jupiterResponse.data.data[address];

    if (!tokenData) {
      throw new Error('Token not found in Jupiter API');
    }

    return {
      name: tokenData.name,
      symbol: tokenData.symbol,
      totalSupply: tokenData.total_supply?.toLocaleString() || 'Unknown',
      decimals: tokenData.decimals || 0,
      holders: tokenData.holders,
      mintAuthority: tokenData.mint_authority || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw new Error('Failed to fetch token metadata');
  }
}