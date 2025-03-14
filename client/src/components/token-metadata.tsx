import { useState, useEffect } from 'react';
import { getTokenMetadata } from '@/lib/token-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

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

  const getTimeAgo = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();

    const years = differenceInYears(now, createdDate);
    const months = differenceInMonths(now, createdDate) % 12;
    const days = differenceInDays(now, createdDate);
    const hours = differenceInHours(now, createdDate) % 24;
    const minutes = differenceInMinutes(now, createdDate) % 60;

    let timeAgo = [];

    if (years > 0) timeAgo.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) timeAgo.push(`${months} month${months > 1 ? 's' : ''}`);

    if (days > 0) {
      timeAgo.push(`${days} day${days > 1 ? 's' : ''}`);
    } else {
      // If less than a day, show hours and minutes
      if (hours > 0) timeAgo.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) timeAgo.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    return timeAgo.join(' ') + ' ago';
  };

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
        <CardTitle className="flex items-center gap-4">
          {metadata.logoURI && (
            <img
              src={metadata.logoURI}
              alt={metadata.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          {metadata.name} ({metadata.symbol})
        </CardTitle>
        <CardDescription>Token Details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h3 className="font-medium mb-1">Contract Address</h3>
            <p className="text-sm font-mono break-all">{address}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Created</h3>
            <p className="text-sm">{getTimeAgo(metadata.created_at)}</p>
          </div>
          {metadata.tags && metadata.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-1">Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {metadata.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {metadata.daily_volume !== null && (
            <div>
              <h3 className="font-medium mb-1">24h Volume</h3>
              <p className="text-sm">
                ${Number(metadata.daily_volume).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
