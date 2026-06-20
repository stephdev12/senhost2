"use client";

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
} from "lucide-react";

interface CoinPack {
  name: string;
  coins: number;
  price: string;
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
    coins: 50,
    price: "$4.99",
    badge: "For Testing",
    icon: <Zap className="h-4 w-4" />,
    gradient: "from-blue-500 to-blue-600 shadow-[0_10px_25px_rgba(59,130,246,0.3)]",
    features: [
      "50 coins",
      "Deploy up to 5 bots",
      "5 days of uptime",
      "Community support",
    ],
    lockedFeatures: ["Priority support", "Bonus coins"],
  },
  {
    name: "Popular",
    coins: 200,
    price: "$14.99",
    originalPrice: "$19.99",
    badge: "Best Value",
    icon: <Crown className="h-4 w-4" />,
    gradient:
      "from-primary to-purple-600 shadow-[0_10px_25px_rgba(139,92,246,0.3)]",
    features: [
      "200 coins",
      "Deploy up to 20 bots",
      "20 days of uptime",
      "Priority support",
      "+25 bonus coins",
    ],
    popular: true,
  },
  {
    name: "Pro",
    coins: 500,
    price: "$29.99",
    originalPrice: "$49.99",
    badge: "For Power Users",
    icon: <Gem className="h-4 w-4" />,
    gradient:
      "from-amber-500 to-orange-600 shadow-[0_10px_25px_rgba(245,158,11,0.3)]",
    features: [
      "500 coins",
      "Unlimited bots",
      "50 days of uptime",
      "Priority support",
      "+100 bonus coins",
      "Early access features",
    ],
  },
];

function CoinPackCard({ pack }: { pack: CoinPack }) {
  return (
    <div className={cn("relative", pack.popular && "scale-105 z-10")}>
      {pack.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </div>
        </div>
      )}
      <PricingCard.Card
        className={cn(pack.popular && "border-primary/40 shadow-primary/10")}
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
            <PricingCard.MainPrice>{pack.price}</PricingCard.MainPrice>
            <PricingCard.Period>/ one-time</PricingCard.Period>
            {pack.originalPrice && (
              <PricingCard.OriginalPrice className="ml-auto">
                {pack.originalPrice}
              </PricingCard.OriginalPrice>
            )}
          </PricingCard.Price>
          <Button
            className={cn(
              "w-full font-semibold text-white cursor-pointer",
              "bg-gradient-to-b",
              pack.gradient
            )}
          >
            Buy {pack.coins} Coins
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
  );
}

export default function CoinsPage() {
  return (
    <div className="space-y-8">
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

      {/* Current Balance */}
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-6 w-6 text-amber-400" />
            <span className="text-4xl font-bold text-foreground">150</span>
          </div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>
              ≈ <span className="text-foreground font-medium">15</span> deploys
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              ≈ <span className="text-foreground font-medium">15</span> days
              uptime
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative">
        {/* Background glow */}
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

        {/* Radial spotlight */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-1/2 h-[50vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/4 rounded-full",
            "bg-[radial-gradient(ellipse_at_center,hsl(263_70%_50.4%/0.08),transparent_50%)]",
            "blur-[30px]"
          )}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
          {coinPacks.map((pack) => (
            <CoinPackCard key={pack.name} pack={pack} />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          How Coins Work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Buy Coins</h3>
            <p className="text-xs text-muted-foreground">
              Choose a coin pack that suits your needs
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <span className="text-lg font-bold text-primary">2</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Deploy</h3>
            <p className="text-xs text-muted-foreground">
              Spend 10 coins to deploy any bot template
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5 text-center">
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
    </div>
  );
}
