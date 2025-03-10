import { useState, useEffect } from 'react';
import { getTokenMetadata } from '@/lib/token-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TokenMetadataProps {
  address: string;
}

export function TokenMetadata({ address }: TokenMetadataProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTokenMetadata(address);
        setMetadata(data);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(
          errorMessage.includes('Token not found') 
            ? `Token ${address} was not found on Jupiter or Solana.`
            : `Error fetching token data: ${errorMessage}`
        );
        console.error('Token metadata error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchMetadata();
    }
  }, [address]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm text-muted-foreground break-all">
                Contract Address: {address}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{metadata?.name || 'Unknown Token'}</CardTitle>
        <CardDescription>Token Details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h3 className="font-medium mb-1">Symbol</h3>
            <p className="text-sm">{metadata?.symbol}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Total Supply</h3>
            <p className="text-sm">{metadata?.totalSupply}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Decimals</h3>
            <p className="text-sm">{metadata?.decimals}</p>
          </div>
          {metadata?.holders !== undefined && (
            <div>
              <h3 className="font-medium mb-1">Holders</h3>
              <p className="text-sm">{metadata.holders.toLocaleString()}</p>
            </div>
          )}
          <div>
            <h3 className="font-medium mb-1">Contract Address</h3>
            <p className="text-sm font-mono break-all">{address}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Mint Authority</h3>
            <p className="text-sm font-mono break-all">
              {metadata?.mintAuthority || 'No mint authority'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}