import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useParams } from "wouter";
import { TokenMetadata } from "@/components/token-metadata";

export default function CoinPage() {
  // Get the address parameter from the URL
  const { address } = useParams<{ address: string }>();

  // Render the TokenMetadata component with the address
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {address ? (
            <TokenMetadata address={address} />
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Invalid Address</h1>
              <p className="text-muted-foreground">
                No token address was provided.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}