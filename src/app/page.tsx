"use client";

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Bot, Zap, Shield } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Grid Pattern Background */}
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
          [15, 10],
          [10, 15],
          [20, 8],
          [25, 12],
          [18, 20],
          [3, 18],
          [22, 5],
          [28, 14],
          [7, 12],
          [14, 7],
          [24, 18],
        ]}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />

      {/* Radial spotlight glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-1/3 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 rounded-full",
          "bg-[radial-gradient(ellipse_at_center,hsl(263_70%_50.4%/0.15),transparent_60%)]",
          "blur-[60px]",
        )}
      />

      {/* Minimal Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            SenHost
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Zap className="h-3 w-3 text-primary" />
          Deploy bots in one click
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up-delay-1 max-w-3xl text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          Deploy Your Bots{" "}
          <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-2 max-w-md text-base sm:text-lg text-muted-foreground leading-relaxed">
          From template to production in seconds.
          <br className="hidden sm:block" />
          Simple. Fast. Reliable.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in-up-delay-3 mt-2">
          <Link href="/login">
            <LiquidButton size="xxl" className="text-base font-semibold">
              Get Started
            </LiquidButton>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="animate-fade-in-up-delay-3 mt-8 flex items-center gap-6 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>Secure</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>Lightning Fast</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            <span>PM2 Managed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
