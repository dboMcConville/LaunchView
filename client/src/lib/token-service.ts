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
    console.error('Jupiter API error:', error.response?.data || error.message);
    console.log('Token not found in Jupiter, falling back to Solana RPC');

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const mintPubkey = new PublicKey(address);
      const accountInfo = await connection.getParsedAccountInfo(mintPubkey);

      if (!accountInfo.value) {
        throw new Error('Token not found on Solana blockchain');
      }

      const parsedData = accountInfo.value.data as any;
      return {
        name: 'Unknown Token',
        symbol: 'Unknown',
        decimals: parsedData.parsed?.info?.decimals || 0,
        logoURI: undefined,
        tags: undefined,
        daily_volume: null,
        created_at: new Date().toISOString(),
        freeze_authority: parsedData.parsed?.info?.freezeAuthority || null,
        mint_authority: parsedData.parsed?.info?.mintAuthority || null,
        permanent_delegate: null,
        minted_at: new Date().toISOString(),
        extensions: {}
      };
    } catch (solanaError) {
      console.error('Solana RPC error:', solanaError);
      throw new Error(`Token not found on Solana blockchain: ${(solanaError as Error).message}`);
    }
  }
}