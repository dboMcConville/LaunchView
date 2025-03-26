import { useState, useEffect } from "react";
import { getTokenMetadata } from "@/lib/token-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink, TrendingUp, Users, Wallet, Copy, Check } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface TokenMetadataProps {
  address: string;
}

interface TokenSupplyResponse {
  success: boolean;
  data?: {
    amount: string;
    decimals: number;
  };
  error?: string;
}

interface PriceData {
  data: {
    [key: string]: {
      price: number;
      extraInfo?: {
        priceUsd: number;
      };
    };
  };
}

export function TokenMetadata({ address }: TokenMetadataProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use TanStack Query for token supply
  const { data: tokenSupply } = useQuery<TokenSupplyResponse>({
    queryKey: [`/api/token-supply/${address}`],
    enabled: !!address,
  });

  // Use TanStack Query for price data
  const { data: priceData } = useQuery<PriceData>({
    queryKey: [`https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`],
    queryFn: async () => {
      const response = await fetch(
        `https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch price data");
      const data = await response.json();
      console.log('Jupiter API response:', data);
      return data;
    },
    enabled: !!address,
  });

  // Calculate market cap
  const marketCap = React.useMemo(() => {
    if (!tokenSupply?.data || !priceData?.data?.[address]?.price) return null;

    const price = priceData.data[address].price;
    const supply = parseFloat(tokenSupply.data.amount);
    const decimals = tokenSupply.data.decimals;

    return (supply / 10 ** decimals) * price;
  }, [tokenSupply, priceData, address]);

  // Format price with proper decimal places
  const price = (priceData as PriceData | undefined)?.data?.[address]?.extraInfo?.priceUsd || 
                (priceData as PriceData | undefined)?.data?.[address]?.price;
  const formattedPrice = React.useMemo(() => {
    console.log('Raw price:', price);
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      console.log('Price is not a valid number');
      return '0.00';
    }
    if (numericPrice < 0.000001) {
      // Convert to string with full precision
      const priceStr = numericPrice.toString();
      const match = priceStr.match(/^0\.0+/);
      if (match) {
        // Count the number of zeros after the decimal point (excluding the first zero)
        const zeros = match[0].length - 2;
        // Get the significant digits after the zeros
        const significantDigits = priceStr.slice(match[0].length);
        // Convert number to subscript using Unicode subscript numbers
        const subscriptNumber = zeros.toString().split('').map(digit => {
          const subscriptDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
          return subscriptDigits[parseInt(digit)];
        }).join('');
        // Create the formatted string with subscript notation
        const formatted = `0.0${subscriptNumber}${significantDigits}`;
        console.log('Formatted small price:', formatted);
        return formatted;
      }
    }
    // For normal numbers, show 6 decimal places
    const formatted = numericPrice.toFixed(6);
    console.log('Formatted normal price:', formatted);
    return formatted;
  }, [price]);

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
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-6 px-8 py-6">
          {metadata?.logoURI && (
            <img
              src={metadata.logoURI}
              alt={metadata.name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {metadata?.name}
              <span className="text-muted-foreground text-xl">
                ({metadata?.symbol})
              </span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono mt-1">
              {address}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-semibold">
                ${formattedPrice}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://dexscreener.com/solana/${address}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on DexScreener
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketCap !== null
                  ? `$${Math.round(marketCap).toLocaleString()}`
                  : "Calculating..."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metadata?.holder_count?.toLocaleString() || "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                24h Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.round(Number(metadata?.daily_volume || 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Created</h3>
                    <p className="text-sm">
                      {metadata?.created_at
                        ? getTimeAgo(metadata.created_at)
                        : "Unknown"}
                    </p>
                  </div>

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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="holders">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Holder data coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transactions">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Transaction history coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}