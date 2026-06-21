"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Edit2,
  Plus,
  Activity,
  Clock,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BotInstance {
  id: string;
  templateId: string;
  config: Record<string, string>;
  createdAt: string;
  status: "online" | "stopped" | "errored" | "launching";
  uptime: string;
  memory: string;
  cpu: number;
  restarts: number;
}

const statusConfig = {
  online: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    dot: "bg-emerald-500",
    label: "Online",
  },
  stopped: {
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    dot: "bg-muted-foreground",
    label: "Stopped",
  },
  errored: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    dot: "bg-red-500",
    label: "Error",
  },
  launching: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    dot: "bg-blue-500",
    label: "Starting",
  },
};

function BotCard({
  instance,
  onStart,
  onStop,
  onReload,
  onDelete,
  onEdit,
}: {
  instance: BotInstance;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onReload: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (instance: BotInstance) => void;
}) {
  const status = statusConfig[instance.status] || statusConfig.stopped;
  const displayName = instance.config?.name || instance.id;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card border-border shadow-sm p-5 transition-all duration-300",
        "hover:shadow-md hover:border-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="font-semibold text-foreground text-base truncate" title={displayName}>
            {displayName}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Uptime: <span className="font-medium text-foreground">{instance.uptime || "—"}</span>
          </p>
        </div>

        {/* Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
            status.bg,
            status.color
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {instance.status === "online" && (
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  status.dot
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-1.5 w-1.5",
                status.dot
              )}
            />
          </span>
          {status.label}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/55">
        {/* Start / Stop */}
        {instance.status === "online" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStop(instance.id)}
            className="flex-1 h-8 text-xs cursor-pointer rounded-lg bg-background hover:bg-muted"
            title="Stop Bot"
          >
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStart(instance.id)}
            className="flex-1 h-8 text-xs cursor-pointer rounded-lg bg-background text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500"
            title="Start Bot"
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}

        {/* Reload */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReload(instance.id)}
          className="h-8 w-8 p-0 cursor-pointer rounded-lg bg-background hover:bg-muted"
          title="Reload Bot"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Edit */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(instance)}
          className="h-8 w-8 p-0 cursor-pointer rounded-lg bg-background hover:bg-muted"
          title="Edit Configuration"
        >
          <Edit2 className="h-3 w-3" />
        </Button>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(instance.id)}
          className="h-8 w-8 p-0 cursor-pointer rounded-lg bg-background text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
          title="Delete Bot"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstance, setEditingInstance] = useState<BotInstance | null>(null);
  const [editName, setEditName] = useState("");
  const [editToken, setEditToken] = useState("");
  const [balance, setBalance] = useState(150);


  const fetchInstances = async () => {
    try {
      const currentUserStr = localStorage.getItem("current_user");
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      const emailQuery = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : "";

      const response = await fetch(`/api/instances${emailQuery}`);
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances || []);
      }
    } catch (error) {
      console.error("Failed to fetch instances:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    
    // Load coins balance from localStorage
    const savedBalance = localStorage.getItem("coins_balance");
    if (savedBalance) {
      setBalance(parseInt(savedBalance));
    }

    // Poll every 4 seconds to keep uptime and status live
    const interval = setInterval(fetchInstances, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: string) => {
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (response.ok) fetchInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async (id: string) => {
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      if (response.ok) fetchInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReload = async (id: string) => {
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      if (response.ok) fetchInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this bot instance?")) return;
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: "DELETE",
      });
      if (response.ok) fetchInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (instance: BotInstance) => {
    setEditingInstance(instance);
    setEditName(instance.config?.name || instance.id);
    setEditToken(instance.config?.token || "");
  };

  const handleSaveConfig = async () => {
    if (!editingInstance) return;
    try {
      const response = await fetch(`/api/instances/${editingInstance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          config: {
            ...editingInstance.config,
            name: editName,
            token: editToken,
          },
        }),
      });
      if (response.ok) {
        setEditingInstance(null);
        fetchInstances();
      } else {
        alert("Failed to save configuration");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onlineCount = instances.filter((i) => i.status === "online").length;
  const totalCount = instances.length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your deployed bot instances
          </p>
        </div>
        <Link href="/dashboard/templates">
          <Button className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Deploy New Bot
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Bots</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
              <Coins className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{balance}</p>
              <p className="text-xs text-muted-foreground">Coins Balance</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {onlineCount * 10}/day
              </p>
              <p className="text-xs text-muted-foreground">Daily Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Instances Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="animate-spin h-8 w-8 text-primary mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted-foreground">Loading instances...</p>
        </div>
      ) : instances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <BotCard
              key={instance.id}
              instance={instance}
              onStart={handleStart}
              onStop={handleStop}
              onReload={handleReload}
              onDelete={handleDelete}
              onEdit={handleEditClick}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No bots deployed yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Get started by selecting a template and deploying your first bot.
          </p>
          <Link href="/dashboard/templates">
            <Button className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Your First Bot
            </Button>
          </Link>
        </div>
      )}

      {/* Edit Modal */}
      {editingInstance && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Edit Bot Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Bot Instance Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="My WhatsApp Bot"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  API Token / Secret Key
                </label>
                <input
                  type="password"
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setEditingInstance(null)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
