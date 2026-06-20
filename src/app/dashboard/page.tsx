"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bot,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Plus,
  Activity,
  Cpu,
  Clock,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BotInstance {
  id: string;
  name: string;
  template: string;
  status: "online" | "stopped" | "errored";
  uptime: string;
  memory: string;
  restarts: number;
}

const mockInstances: BotInstance[] = [
  {
    id: "discord-bot-1",
    name: "My Discord Bot",
    template: "Discord Bot",
    status: "online",
    uptime: "2d 14h 32m",
    memory: "45.2 MB",
    restarts: 0,
  },
  {
    id: "telegram-bot-1",
    name: "Support Bot",
    template: "Telegram Bot",
    status: "stopped",
    uptime: "—",
    memory: "—",
    restarts: 3,
  },
  {
    id: "whatsapp-bot-1",
    name: "WhatsApp Notifier",
    template: "WhatsApp Bot",
    status: "errored",
    uptime: "—",
    memory: "62.1 MB",
    restarts: 12,
  },
];

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
};

function BotCard({ instance }: { instance: BotInstance }) {
  const status = statusConfig[instance.status];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5",
        status.border
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {instance.name}
            </h3>
            <p className="text-xs text-muted-foreground">{instance.template}</p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
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

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Uptime</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {instance.uptime}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Memory</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {instance.memory}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Restarts</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {instance.restarts}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {instance.status === "online" ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs cursor-pointer rounded-lg"
          >
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs cursor-pointer rounded-lg text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10"
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs cursor-pointer rounded-lg"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs cursor-pointer rounded-lg text-red-400 border-red-400/20 hover:bg-red-400/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [instances] = useState<BotInstance[]>(mockInstances);

  const onlineCount = instances.filter((i) => i.status === "online").length;
  const totalCount = instances.length;

  return (
    <div className="space-y-8">
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
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Bots</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5">
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
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
              <Coins className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">150</p>
              <p className="text-xs text-muted-foreground">Coins Balance</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5">
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
      {instances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <BotCard key={instance.id} instance={instance} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
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
    </div>
  );
}
