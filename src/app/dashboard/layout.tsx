"use client";

import { NavBar } from "@/components/ui/tubelight-navbar";
import { LayoutDashboard, Layers, Coins, Bot } from "lucide-react";
import Link from "next/link";

const navItems = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Templates", url: "/dashboard/templates", icon: Layers },
  { name: "Coins", url: "/dashboard/coins", icon: Coins },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Logo Bar */}
      <div className="fixed top-0 left-0 z-50 p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground hidden sm:inline">
            SenHost
          </span>
        </Link>
      </div>

      {/* Tubelight Navbar */}
      <NavBar items={navItems} />

      {/* Main content with padding for navbar */}
      <main className="pt-20 sm:pt-24 pb-24 sm:pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
