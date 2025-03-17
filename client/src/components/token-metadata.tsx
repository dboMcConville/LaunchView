import { useState, useEffect } from "react";
import { getTokenMetadata } from "@/lib/token-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { intervalToDuration, formatDuration } from "date-fns";
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import React from "react";

interface TokenMetadataProps {
  address: string;
}

export function TokenMetadata({ address }: TokenMetadataProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use TanStack Query for token supply
  const { data: tokenSupply, isError: isSupplyError } = useQuery({
    queryKey: [`/api/token-supply/${address}`],
    enabled: !!address,
  });

  // Use TanStack Query for price data
  const { data: priceData } = useQuery({
    queryKey: [`https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`],
    queryFn: async () => {
      const response = await fetch(
        `https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch price data");
      return response.json();
    },
    enabled: !!address,
  });

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching token metadata from Jupiter for", address);
        const data = await getTokenMetadata(address);
        console.log("Found token in Jupiter:", data);
        setMetadata(data || {});
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(
          errorMessage.includes("Token not found")
            ? `Token ${address} was not found on Jupiter or Solana.`
            : `Error fetching token data: ${errorMessage}`,
        );
        console.error("Token metadata error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchMetadata();
    }
  }, [address]);

  // Calculate market cap
  const marketCap = React.useMemo(() => {
    if (!tokenSupply?.data || !priceData?.data?.[address]?.price) return null;

    const price = priceData.data[address].price;
    const supply = parseFloat(tokenSupply.data.amount);
    const decimals = tokenSupply.data.decimals;

    return (supply / 10 ** decimals) * price;
  }, [tokenSupply, priceData, address]);

  const getTimeAgo = (createdAt: string) => {
    if (!createdAt) return "Unknown";

    const createdDate = new Date(createdAt);
    const now = new Date();

    const duration = intervalToDuration({ start: createdDate, end: now });

    return (
      formatDuration(duration, {
        format: ["years", "months", "days", "hours", "minutes"],
        delimiter: ", ",
      }) + " ago"
    );
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || isSupplyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to fetch token supply"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          {metadata?.logoURI && (
            <img
              src={metadata.logoURI}
              alt={metadata.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          {metadata?.name} ({metadata?.symbol})
        </CardTitle>
        <CardDescription>Token Details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Market Cap */}
          <div>
            <h3 className="font-medium mb-1">Market Cap</h3>
            <p className="text-sm">
              {marketCap !== null
                ? `$${Math.round(marketCap).toLocaleString()}`
                : "Calculating..."}
            </p>
          </div>

          {/* Contract Address */}
          <div>
            <h3 className="font-medium mb-1">Contract Address</h3>
            <p className="text-sm font-mono break-all">{address}</p>
          </div>

          {/* Created Time */}
          <div>
            <h3 className="font-medium mb-1">Created</h3>
            <p className="text-sm">
              {metadata?.created_at
                ? getTimeAgo(metadata.created_at)
                : "Unknown"}
            </p>
          </div>

          {/* Tags */}
          {metadata?.tags && metadata.tags.length > 0 && (
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

          {/* 24h Volume */}
          {metadata?.daily_volume !== undefined &&
            metadata?.daily_volume !== null && (
              <div>
                <h3 className="font-medium mb-1">24h Volume</h3>
                <p className="text-sm">
                  ${Math.round(Number(metadata.daily_volume)).toLocaleString()}
                </p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
