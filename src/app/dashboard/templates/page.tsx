"use client";

import { useState, useEffect } from "react";
import { InteractiveTravelCard } from "@/components/ui/3d-card";
import {
  Search,
  Coins,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Phone,
  Bot as BotIcon,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  subtitle: string;
  href: string;
}

const templates: Template[] = [
  {
    id: "ren",
    name: "Ren Bot",
    description: "Modular and optimized WhatsApp Bot",
    price: "10 coins",
    imageUrl: "/ren.jpg",
    subtitle: "WhatsApp Bot",
    href: "https://github.com/",
  },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Deployment configuration states
  const [activeDeployTemplate, setActiveDeployTemplate] = useState<Template | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<"pairing" | "session">("pairing");

  // WhatsApp form values
  const [botName, setBotName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [prefix, setPrefix] = useState(".");
  const [sessionId, setSessionId] = useState("");

  // Telegram form values
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgAdminId, setTgAdminId] = useState("");

  // Process control states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedInstanceId, setDeployedInstanceId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<"setup" | "creating" | "pairing" | "connected" | "error">("setup");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Filter templates list
  const filteredTemplates = templates.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Open configuration modal
  const openDeployModal = (template: Template) => {
    setActiveDeployTemplate(template);
    setBotName(template.id === "ren" ? "REN-MDX" : template.name);
    setOwnerName("Admin");
    setPhoneNumber("");
    setPrefix(".");
    setSessionId("");
    setTgBotToken("");
    setTgAdminId("");
    setDeploymentStatus("setup");
    setIsDeploying(false);
    setDeployedInstanceId(null);
    setPairingCode(null);
    setConnectionStatus(null);
  };

  // Poll instance status during pairing
  useEffect(() => {
    if (deploymentStatus !== "pairing" || !deployedInstanceId) return;

    let timer: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/instances/${deployedInstanceId}`);
        if (res.ok) {
          const data = await res.json();
          setConnectionStatus(data.connectionStatus);

          if (data.pairingCode && data.pairingCode !== "WAITING") {
            setPairingCode(data.pairingCode);
          }

          if (data.connectionStatus === "CONNECTED") {
            setDeploymentStatus("connected");
            setTimeout(() => {
              setActiveDeployTemplate(null);
              router.push("/dashboard");
            }, 2500);
            return;
          }

          if (data.connectionStatus === "ERROR" || data.status === "errored") {
            setDeploymentStatus("error");
            return;
          }
        }
      } catch (err) {
        console.error("Error polling bot state:", err);
      }

      // Poll again in 2 seconds
      timer = setTimeout(pollStatus, 2000);
    };

    pollStatus();

    return () => clearTimeout(timer);
  }, [deploymentStatus, deployedInstanceId, router]);

  // Submit deploy request to backend
  const handleDeployConfirm = async () => {
    if (!activeDeployTemplate) return;

    const currentCoins = localStorage.getItem("coins_balance")
      ? parseInt(localStorage.getItem("coins_balance")!)
      : 150;

    if (currentCoins < 10) {
      alert("You need at least 10 coins to deploy a bot. Please purchase more coins.");
      router.push("/dashboard/coins");
      return;
    }

    setDeploymentStatus("creating");
    setIsDeploying(true);

    let configObj: Record<string, string> = {};

    if (activeDeployTemplate.id === "ren" || activeDeployTemplate.id === "whatsapp-bot") {
      configObj = {
        BOT_NAME: botName || activeDeployTemplate.name,
        OWNER_NAME: ownerName || "Admin",
        PREFIX: prefix || ".",
      };

      if (connectionMethod === "pairing") {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
        if (!cleanPhone) {
          alert("Please enter a valid phone number (digits only)");
          setDeploymentStatus("setup");
          setIsDeploying(false);
          return;
        }
        configObj.OWNER_NUMBER = cleanPhone;
      } else {
        if (!sessionId.trim()) {
          alert("Please enter your WhatsApp Session ID");
          setDeploymentStatus("setup");
          setIsDeploying(false);
          return;
        }
        configObj.SESSION_NAME = sessionId.trim();
        configObj.SESSION_ID = sessionId.trim();
      }
    } else if (activeDeployTemplate.id === "telegram-bot") {
      if (!tgBotToken.trim()) {
        alert("Please enter your Telegram Bot Token");
        setDeploymentStatus("setup");
        setIsDeploying(false);
        return;
      }
      configObj = {
        BOT_NAME: botName || "Telegram Bot",
        BOT_TOKEN: tgBotToken.trim(),
        ADMIN_ID: tgAdminId.trim(),
      };
    }

    try {
      const currentUserStr = localStorage.getItem("current_user");
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      const ownerEmail = currentUser ? currentUser.email : "guest@senhost.com";

      const response = await fetch("/api/instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: activeDeployTemplate.id,
          name: botName || activeDeployTemplate.name,
          config: {
            ...configObj,
            ownerEmail: ownerEmail,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to deploy bot instance");
      }

      const data = await response.json();
      setDeployedInstanceId(data.instanceId);

      // Deduct 10 coins from local balance
      const newBalance = currentCoins - 10;
      localStorage.setItem("coins_balance", newBalance.toString());

      // Sync with localStorage users database
      if (currentUser) {
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

      // If WhatsApp Pairing method is active, enter pairing mode polling
      if (
        (activeDeployTemplate.id === "ren" || activeDeployTemplate.id === "whatsapp-bot") &&
        connectionMethod === "pairing"
      ) {
        setDeploymentStatus("pairing");
      } else {
        // Direct redirection for telegram/session-id bots
        setDeploymentStatus("connected");
        setTimeout(() => {
          setActiveDeployTemplate(null);
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Deployment failed: ${error.message || error}`);
      setDeploymentStatus("setup");
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Templates
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to deploy your bot
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-muted/30 border-border"
          />
        </div>
      </div>

      {/* Cost info */}
      <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm">
        <Coins className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-muted-foreground">
          <span className="text-amber-400 font-semibold">10 coins</span> to deploy
          &nbsp;·&nbsp;
          <span className="text-amber-400 font-semibold">10 coins/day</span> to
          maintain
        </span>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                perspective: "1000px",
              }}
              className="flex justify-center w-full"
            >
              <InteractiveTravelCard
                title={template.name}
                subtitle={template.subtitle}
                imageUrl={template.imageUrl}
                actionText={`Deploy (${template.price})`}
                href={template.href}
                onActionClick={() => openDeployModal(template)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No templates found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Deployment Configuration & Status Modal */}
      {activeDeployTemplate && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Deploy {activeDeployTemplate.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure environment variables to launch your instance
                </p>
              </div>
              {!isDeploying && (
                <button
                  onClick={() => setActiveDeployTemplate(null)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {deploymentStatus === "setup" && (
                <div className="space-y-4">
                  {/* WhatsApp Custom Tab Selectors */}
                  {(activeDeployTemplate.id === "ren" || activeDeployTemplate.id === "whatsapp-bot") && (
                    <div className="grid grid-cols-2 gap-2 border border-border p-1 rounded-xl bg-muted/20">
                      <button
                        onClick={() => setConnectionMethod("pairing")}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          connectionMethod === "pairing"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Pairing Code
                      </button>
                      <button
                        onClick={() => setConnectionMethod("session")}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          connectionMethod === "session"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Key className="h-3.5 w-3.5" />
                        Session ID
                      </button>
                    </div>
                  )}

                  {/* Standard Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Bot Instance Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. My Bot"
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        className="rounded-xl border-border"
                      />
                    </div>

                    {/* WhatsApp Bot Form Fields */}
                    {(activeDeployTemplate.id === "ren" || activeDeployTemplate.id === "whatsapp-bot") && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Owner Name
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. Admin / Owner"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className="rounded-xl border-border"
                          />
                        </div>

                        {connectionMethod === "pairing" ? (
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                              WhatsApp Phone Number
                            </label>
                            <Input
                              type="text"
                              placeholder="e.g. 237650000000 (with country code)"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="rounded-xl border-border"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Include your country code, without spaces or "+" symbol (e.g. 237650471093)
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                              WhatsApp Session ID
                            </label>
                            <Input
                              type="password"
                              placeholder="Paste your session ID here"
                              value={sessionId}
                              onChange={(e) => setSessionId(e.target.value)}
                              className="rounded-xl border-border"
                            />
                            <div className="flex items-center gap-1.5 mt-2 bg-primary/5 border border-primary/10 rounded-lg p-2.5 text-xs text-muted-foreground">
                              <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>
                                Need a Session ID? Navigate to{" "}
                                <a
                                  href="https://ren-session.site"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                                >
                                  ren-session.site
                                </a>{" "}
                                to scan, generate, and copy your session ID.
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Bot Command Prefix
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. ."
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            className="rounded-xl border-border"
                          />
                        </div>
                      </>
                    )}

                    {/* Telegram Bot Form Fields */}
                    {activeDeployTemplate.id === "telegram-bot" && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Telegram Bot Token
                          </label>
                          <Input
                            type="password"
                            placeholder="e.g. 12345678:ABCDefGhI..."
                            value={tgBotToken}
                            onChange={(e) => setTgBotToken(e.target.value)}
                            className="rounded-xl border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Admin Chat ID
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. 987654321"
                            value={tgAdminId}
                            onChange={(e) => setTgAdminId(e.target.value)}
                            className="rounded-xl border-border"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status Screens during creation & connection */}
              {deploymentStatus === "creating" && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div>
                    <h4 className="font-semibold text-foreground">Creating Bot Instance...</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Copying template files and initializing the runtime directory.
                    </p>
                  </div>
                </div>
              )}

              {deploymentStatus === "pairing" && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                  {pairingCode ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground text-lg">Your Pairing Code</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Enter this code on your WhatsApp client to link the bot.
                        </p>
                      </div>

                      {/* Display Pairing Code */}
                      <div className="bg-muted px-8 py-4 rounded-xl border border-border shadow-inner font-mono text-3xl font-extrabold tracking-[0.25em] text-primary flex items-center justify-center">
                        {pairingCode}
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-left text-muted-foreground max-w-sm space-y-2">
                        <p className="font-semibold text-foreground">How to pair:</p>
                        <ol className="list-decimal pl-4 space-y-1.5">
                          <li>Open WhatsApp on your phone.</li>
                          <li>Tap **Menu** (Android) or **Settings** (iOS) → **Linked Devices**.</li>
                          <li>Tap **Link a Device**, then select **Link with phone number instead**.</li>
                          <li>Enter the code shown above.</li>
                        </ol>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Waiting for connection...</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <div>
                        <h4 className="font-semibold text-foreground">Generating Pairing Code...</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Starting the bot process to obtain the WhatsApp connection code.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {deploymentStatus === "connected" && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-foreground">Bot Successfully Connected!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Redirecting you to the dashboard...
                    </p>
                  </div>
                </div>
              )}

              {deploymentStatus === "error" && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-400" />
                  <div>
                    <h4 className="font-semibold text-foreground">Session Error</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Failed to establish connection. Please verify your phone number and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border/50 px-6 py-4 bg-muted/20 flex justify-end gap-3">
              {deploymentStatus === "setup" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setActiveDeployTemplate(null)}
                    className="rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeployConfirm}
                    className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    Confirm Deployment
                  </Button>
                </>
              )}

              {deploymentStatus === "error" && (
                <Button
                  onClick={() => setDeploymentStatus("setup")}
                  className="bg-primary text-white rounded-xl cursor-pointer"
                >
                  Try Again
                </Button>
              )}

              {deploymentStatus === "pairing" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveDeployTemplate(null);
                    router.push("/dashboard");
                  }}
                  className="rounded-xl cursor-pointer"
                >
                  Deploy in Background
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
