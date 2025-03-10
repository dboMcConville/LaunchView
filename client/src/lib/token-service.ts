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
    // Try to get token metadata from Jupiter API first
    const response = await axios.get(`https://token.jup.ag/v4/token/${address}`);

    if (!response.data) {
      throw new Error('Token not found in Jupiter API');
    }

    const tokenData = response.data;

    return {
      name: tokenData.name || 'Unknown Token',
      symbol: tokenData.symbol || 'Unknown',
      decimals: tokenData.decimals || 0,
      holders: tokenData.holder_count,
      totalSupply: tokenData.supply?.toLocaleString() || 'Unknown',
      mintAuthority: tokenData.mint_authority || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw new Error(`Failed to fetch token metadata: ${(error as Error).message}`);
  }
}