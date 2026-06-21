"use client";

import { useEffect, useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/ui/pricing-card";
import {
  CheckCircle2,
  XCircleIcon,
  Coins,
  Zap,
  Crown,
  Gem,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface CoinPack {
  name: string;
  coins: number;
  priceText: string;
  priceVal: number; // in FCFA
  originalPrice?: string;
  badge?: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  lockedFeatures?: string[];
  popular?: boolean;
}

const coinPacks: CoinPack[] = [
  {
    name: "Starter",
    coins: 300,
    priceText: "1,500 FCFA",
    priceVal: 1500,
    badge: "2 Bots Deployable",
    icon: <Zap className="h-4 w-4" />,
    gradient: "from-blue-500 to-blue-600 shadow-[0_10px_25px_rgba(59,130,246,0.3)]",
    features: [
      "300 coins",
      "Deploy up to 2 bots active",
      "30 days of uptime (1 bot)",
      "Community support",
      "+50 bonus coins",
    ],
    lockedFeatures: ["Priority support"],
  },
  {
    name: "Popular",
    coins: 1200,
    priceText: "5,000 FCFA",
    priceVal: 5000,
    originalPrice: "6,000 FCFA",
    badge: "Best Value",
    icon: <Crown className="h-4 w-4" />,
    gradient:
      "from-primary to-purple-600 shadow-[0_10px_25px_rgba(139,92,246,0.3)]",
    features: [
      "1,200 coins",
      "Deploy up to 10 bots",
      "120 days of uptime (1 bot)",
      "Priority support",
      "+200 bonus coins",
    ],
    popular: true,
  },
  {
    name: "Pro",
    coins: 3000,
    priceText: "10,000 FCFA",
    priceVal: 10000,
    originalPrice: "15,000 FCFA",
    badge: "Power Users",
    icon: <Gem className="h-4 w-4" />,
    gradient:
      "from-amber-500 to-orange-600 shadow-[0_10px_25px_rgba(245,158,11,0.3)]",
    features: [
      "3,000 coins",
      "Unlimited bots",
      "300 days of uptime (1 bot)",
      "Priority support",
      "+600 bonus coins",
      "Early access features",
    ],
  },
];

function CoinsContent() {
  const [balance, setBalance] = useState<number>(150);
  const [isVerifying, setIsVerifying] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Country routing and information input modal states
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [country, setCountry] = useState<"cameroun" | "autre" | "">("");
  const [clientName, setClientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Load balance from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem("coins_balance");
    if (savedBalance) {
      setBalance(parseInt(savedBalance));
    }
  }, []);

  // Handle transaction confirmation on redirection
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const transId = searchParams.get("transId");
    const coinsToAdd = searchParams.get("coins");
    const gateway = searchParams.get("gateway");

    if (paymentStatus === "success" && transId && coinsToAdd) {
      setIsVerifying(true);
      const verifyPayment = async () => {
        try {
          const endpoint = gateway === "moneyfusion"
            ? `/api/payments/moneyfusion?transId=${transId}`
            : `/api/payments/fapshi?transId=${transId}`;

          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            // NOTE: sandbox flag is intentionally excluded — coins must only be
            // awarded after a real confirmed payment (status from the gateway).
            const isSuccess = data.status === "SUCCESSFUL" || data.status === "paid";

            if (isSuccess) {
              const currentBalance = localStorage.getItem("coins_balance")
                ? parseInt(localStorage.getItem("coins_balance")!)
                : 150;
              const addedVal = parseInt(coinsToAdd);
              const bonus = addedVal === 300 ? 50 : addedVal === 1200 ? 200 : addedVal === 3000 ? 600 : 0;
              const finalCoins = addedVal + bonus;
              const newBalance = currentBalance + finalCoins;
              
              setBalance(newBalance);
              localStorage.setItem("coins_balance", newBalance.toString());

              // Sync with current user & users database
              const currentUserStr = localStorage.getItem("current_user");
              if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                currentUser.coins = newBalance;
                localStorage.setItem("current_user", JSON.stringify(currentUser));

                const usersStr = localStorage.getItem("users");
                if (usersStr) {
                  const users = JSON.parse(usersStr);
                  const updatedUsers = users.map((u: any) =>
                    u.email.toLowerCase() === currentUser.email.toLowerCase() ? { ...u, coins: newBalance } : u
                  );
                  localStorage.setItem("users", JSON.stringify(updatedUsers));
                }
              }

              // Save to completed transactions in localStorage for admin metrics
              const pendingTransactions = localStorage.getItem("pending_transactions")
                ? JSON.parse(localStorage.getItem("pending_transactions")!)
                : [];
              
              const matchedTx = pendingTransactions.find((tx: any) => tx.transId === transId);
              const txAmount = matchedTx ? matchedTx.amount : (parseInt(coinsToAdd) === 50 ? 2500 : parseInt(coinsToAdd) === 200 ? 7500 : 15000);
              const txEmail = matchedTx ? matchedTx.email : (currentUserStr ? JSON.parse(currentUserStr).email : "guest@senhost.com");

              const completedTransactions = localStorage.getItem("completed_transactions")
                ? JSON.parse(localStorage.getItem("completed_transactions")!)
                : [];

              if (!completedTransactions.some((tx: any) => tx.transId === transId)) {
                completedTransactions.push({
                  transId,
                  amount: txAmount,
                  coins: finalCoins,
                  email: txEmail,
                  gateway: gateway || "fapshi",
                  date: new Date().toISOString().split("T")[0]
                });
                localStorage.setItem("completed_transactions", JSON.stringify(completedTransactions));
              }

              alert(`Successfully bought ${finalCoins} Coins! Your new balance is ${newBalance} coins.`);
            } else {
              alert("Payment transaction was not completed successfully.");
            }
          }
        } catch (error) {
          console.error("Verification failed:", error);
        } finally {
          setIsVerifying(false);
          // Clear query params
          router.replace("/dashboard/coins");
        }
      };
      verifyPayment();
    }
  }, [searchParams, router]);

  const initiatePurchaseClick = (pack: CoinPack) => {
    setSelectedPack(pack);
    setCountry("");
    setClientName("");
    setPhoneNumber("");
    setIsModalOpen(true);
    // Scroll to top so the modal is always visible on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePurchase = async (pack: CoinPack | null, chosenCountry: "cameroun" | "autre" | "") => {
    if (!pack || !chosenCountry) return;
    setPurchaseLoading(pack.name);
    setIsModalOpen(false);

    const pendingTransactions = localStorage.getItem("pending_transactions")
      ? JSON.parse(localStorage.getItem("pending_transactions")!)
      : [];

    const newTrans = {
      transId: "",
      amount: pack.priceVal,
      coins: pack.coins,
      email: JSON.parse(localStorage.getItem("current_user") || "{}").email || "guest@senhost.com",
      clientName: chosenCountry === "autre" ? clientName : "Cameroon Customer",
      gateway: chosenCountry === "cameroun" ? "fapshi" : "moneyfusion",
      date: new Date().toISOString().split("T")[0]
    };

    try {
      const endpoint = chosenCountry === "cameroun" ? "/api/payments/fapshi" : "/api/payments/moneyfusion";
      const payload = chosenCountry === "cameroun"
        ? {
            tierName: pack.name,
            coins: pack.coins,
            price: pack.priceVal,
          }
        : {
            tierName: pack.name,
            coins: pack.coins,
            price: pack.priceVal,
            phoneNumber,
            clientName,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.link) {
          // Safety guard: never redirect to a local/internal URL.
          // This prevents sandbox mode from silently crediting coins by
          // redirecting straight to the success callback URL.
          const isExternalCheckout =
            data.link.startsWith("https://") &&
            !data.link.includes(window.location.hostname) &&
            !data.link.includes("localhost") &&
            !data.link.includes("127.0.0.1");

          if (!isExternalCheckout) {
            alert("Le gateway de paiement n'est pas encore configuré sur ce serveur. Contactez l'administrateur.");
            setPurchaseLoading(null);
            return;
          }

          newTrans.transId = data.transId || data.token;
          pendingTransactions.push(newTrans);
          localStorage.setItem("pending_transactions", JSON.stringify(pendingTransactions));

          window.location.href = data.link; // Redirect to real external checkout
        }
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error contacting payment gateway.");
    } finally {
      setPurchaseLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5 text-xs font-medium text-amber-400 mb-4">
          <Coins className="h-3 w-3" />
          Coin System
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Power Your Bots With{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Coins
          </span>
        </h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          10 coins to deploy a bot · 10 coins per day to keep it running
        </p>
      </div>

      {/* Verification Banner */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 max-w-md mx-auto">
          <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
          <p className="text-sm font-medium text-amber-400">
            Verifying Mobile Money payment status...
          </p>
        </div>
      )}

      {/* Current Balance */}
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-6 w-6 text-amber-400" />
            <span className="text-4xl font-bold text-foreground">{balance}</span>
          </div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>
              ≈ <span className="text-foreground font-medium">{Math.floor(balance / 10)}</span> deploys
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              ≈ <span className="text-foreground font-medium">{Math.floor(balance / 10)}</span> days uptime
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.03) 0.8px, transparent 0.8px)",
            backgroundSize: "14px 14px",
            maskImage:
              "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.6), rgba(0,0,0,0) 70%)",
          }}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-1/2 h-[50vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/4 rounded-full",
            "bg-[radial-gradient(ellipse_at_center,hsl(263_70%_50.4%/0.08),transparent_50%)]",
            "blur-[30px]"
          )}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start justify-items-center">
          {coinPacks.map((pack) => (
            <div key={pack.name} className={cn("relative w-full max-w-sm mx-auto", pack.popular && "scale-105 z-10")}>
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}
              <PricingCard.Card
                className={cn(pack.popular && "border-primary/40 shadow-primary/10", "mx-auto")}
              >
                <PricingCard.Header>
                  <PricingCard.Plan>
                    <PricingCard.PlanName>
                      {pack.icon}
                      <span className="text-muted-foreground">{pack.name}</span>
                    </PricingCard.PlanName>
                    {pack.badge && <PricingCard.Badge>{pack.badge}</PricingCard.Badge>}
                  </PricingCard.Plan>
                  <PricingCard.Price>
                    <PricingCard.MainPrice>{pack.priceText}</PricingCard.MainPrice>
                    <PricingCard.Period>/ one-time</PricingCard.Period>
                    {pack.originalPrice && (
                      <PricingCard.OriginalPrice className="ml-auto text-xs">
                        {pack.originalPrice}
                      </PricingCard.OriginalPrice>
                    )}
                  </PricingCard.Price>
                  <Button
                    onClick={() => initiatePurchaseClick(pack)}
                    disabled={purchaseLoading !== null}
                    className={cn(
                      "w-full font-semibold text-white cursor-pointer h-10 rounded-xl",
                      "bg-gradient-to-b",
                      pack.gradient
                    )}
                  >
                    {purchaseLoading === pack.name ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Connecting...
                      </span>
                    ) : (
                      `Buy ${pack.coins} Coins`
                    )}
                  </Button>
                </PricingCard.Header>
                <PricingCard.Body>
                  <PricingCard.List>
                    {pack.features.map((item) => (
                      <PricingCard.ListItem key={item}>
                        <span className="mt-0.5">
                          <CheckCircle2
                             className="h-4 w-4 text-emerald-500"
                            aria-hidden="true"
                          />
                        </span>
                        <span>{item}</span>
                      </PricingCard.ListItem>
                    ))}
                  </PricingCard.List>
                  {pack.lockedFeatures && pack.lockedFeatures.length > 0 && (
                    <>
                      <PricingCard.Separator>Upgrade for more</PricingCard.Separator>
                      <PricingCard.List>
                        {pack.lockedFeatures.map((item) => (
                          <PricingCard.ListItem key={item} className="opacity-75">
                            <span className="mt-0.5">
                              <XCircleIcon
                                className="text-destructive h-4 w-4"
                                aria-hidden="true"
                              />
                            </span>
                            <span>{item}</span>
                          </PricingCard.ListItem>
                        ))}
                      </PricingCard.List>
                    </>
                  )}
                </PricingCard.Body>
              </PricingCard.Card>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          How Coins Work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Buy Coins</h3>
            <p className="text-xs text-muted-foreground">
              Choose a pack and pay via Fapshi (Cameroon) or MoneyFusion (Other countries)
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <span className="text-lg font-bold text-primary">2</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Deploy</h3>
            <p className="text-xs text-muted-foreground">
              Spend 10 coins to deploy any bot template
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <span className="text-lg font-bold text-primary">3</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Maintain</h3>
            <p className="text-xs text-muted-foreground">
              10 coins/day deducted while your bot runs
            </p>
          </div>
        </div>
      </div>

      {/* Country & Payment Method Selection Modal */}
      {isModalOpen && selectedPack && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Buy {selectedPack.coins} Coins
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select payment country and fill required info
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Select Country
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCountry("cameroun")}
                    className={cn(
                      "flex flex-col items-center justify-center border-2 rounded-xl p-4 transition-all cursor-pointer bg-muted/20 text-center gap-1.5",
                      country === "cameroun"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-2xl">🇨🇲</span>
                    <span className="text-xs font-bold">Cameroun</span>
                    <span className="text-[10px] opacity-75">Fapshi (MoMo/Orange)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountry("autre")}
                    className={cn(
                      "flex flex-col items-center justify-center border-2 rounded-xl p-4 transition-all cursor-pointer bg-muted/20 text-center gap-1.5",
                      country === "autre"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-2xl">🌍</span>
                    <span className="text-xs font-bold">Autre pays</span>
                    <span className="text-[10px] opacity-75">MoneyFusion API</span>
                  </button>
                </div>
              </div>

              {country === "autre" && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Mobile Money Number
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 22890123456"
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 px-6 py-4 bg-muted/20 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handlePurchase(selectedPack, country)}
                disabled={!country || (country === "autre" && (!clientName || !phoneNumber))}
                className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold"
              >
                Proceed to Pay {selectedPack.priceText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoinsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading payment portal...</p>
      </div>
    }>
      <CoinsContent />
    </Suspense>
  );
}
