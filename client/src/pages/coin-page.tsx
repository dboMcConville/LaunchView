import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useParams } from "wouter";
import { TokenMetadata } from "@/components/token-metadata";

export default function CoinPage() {
  const params = useParams();
  const address = params.address;

  if (!address) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Address</h1>
            <p className="text-muted-foreground">
              No token address was provided.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <TokenMetadata address={address} />
        </div>
      </main>
    </div>
  );
}