"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { LayoutDashboard, Layers, Coins } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";

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
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const currentUserStr = localStorage.getItem("current_user");
      if (!currentUserStr) {
        router.push("/login");
        return;
      }

      // Check if user is blocked in the users list
      const currentUser = JSON.parse(currentUserStr);
      const usersStr = localStorage.getItem("users");
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const user = users.find((u: any) => u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (!user || user.isBlocked) {
          localStorage.removeItem("current_user");
          router.push("/login");
          return;
        }
      }
      setAuthorized(true);
    };

    checkSession();
    
    // Check session status periodically
    const interval = setInterval(checkSession, 3000);
    return () => clearInterval(interval);
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <svg className="animate-spin h-8 w-8 text-primary mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Logo Bar */}
      <div className="fixed top-0 left-0 z-50 p-4 sm:p-6 pointer-events-none">
        <Link href="/" className="flex items-center gap-2 pointer-events-auto">
          <span className="text-lg font-semibold tracking-tight text-foreground hidden sm:inline">
            SenHost
          </span>
        </Link>
      </div>

      {/* Theme Switcher Bar */}
      <div className="fixed top-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
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
