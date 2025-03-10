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
    // Fetch token data from Jupiter token list API
    const response = await axios.get(
      `https://token.jup.ag/strict/all`
    );

    const tokenList = response.data;
    const tokenData = tokenList.find((token: any) => token.address === address);

    if (!tokenData) {
      throw new Error('Token not found. Please verify the contract address.');
    }

    return {
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      // These fields might not be available from token list API
      totalSupply: 'Data not available',
      holders: undefined,
      mintAuthority: undefined
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw new Error('Failed to fetch token metadata');
  }
}