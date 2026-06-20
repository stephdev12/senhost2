"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Mail, User, Lock, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, navigate to dashboard directly
    router.push("/dashboard");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-background">
      {/* Grid Pattern Background */}
      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        squares={[
          [3, 3],
          [6, 8],
          [10, 5],
          [15, 12],
          [20, 3],
          [8, 15],
        ]}
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-50",
        )}
      />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(263_70%_50.4%/0.1),transparent_60%)] blur-[40px]"
      />

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            SenHost
          </span>
        </Link>

        <Card className="w-full shadow-2xl rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-center text-foreground">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to manage your bots."
                : "Sign up and start deploying bots instantly."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/80">
                    Full Name
                  </Label>
                  <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent p-0 h-auto"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">
                  Email Address
                </Label>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent p-0 h-auto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">
                  Password
                </Label>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent p-0 h-auto"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl text-white font-medium shadow-md bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all duration-300 cursor-pointer h-11"
              >
                {isLogin ? "Sign In" : "Get Started"}
              </Button>
            </form>

            {/* Toggle login/register */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <span className="text-primary font-medium hover:underline">
                  {isLogin ? "Sign up" : "Sign in"}
                </span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center mt-4">
              By continuing, you agree to our{" "}
              <span className="text-primary/80 font-medium cursor-pointer hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-primary/80 font-medium cursor-pointer hover:underline">
                Privacy Policy
              </span>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
