"use client";

import { useState } from "react";
import { InteractiveProductCard } from "@/components/ui/interactive-card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Search,
  ArrowRight,
  Coins,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
}

const templates: Template[] = [
  {
    id: "discord-bot",
    name: "Discord Bot",
    description: "Full-featured Discord bot with commands",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1974&auto=format&fit=crop",
    category: "Chat",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    description: "Telegram automation & notifications",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop",
    category: "Chat",
  },
  {
    id: "whatsapp-bot",
    name: "WhatsApp Bot",
    description: "WhatsApp business automation",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=2070&auto=format&fit=crop",
    category: "Chat",
  },
  {
    id: "twitter-bot",
    name: "Twitter Bot",
    description: "Auto-post & engagement bot",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1611605698335-8b1569810432?q=80&w=1974&auto=format&fit=crop",
    category: "Social",
  },
  {
    id: "moderation-bot",
    name: "Moderation Bot",
    description: "Auto-mod & content filtering",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
    category: "Tools",
  },
  {
    id: "music-bot",
    name: "Music Bot",
    description: "Stream music in voice channels",
    price: "10 coins",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop",
    category: "Entertainment",
  },
];

const categories = ["All", "Chat", "Social", "Tools", "Entertainment"];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeploy = (templateId: string) => {
    setDeployingId(templateId);
    // Simulate deployment
    setTimeout(() => {
      setDeployingId(null);
      alert(`Bot "${templates.find(t => t.id === templateId)?.name}" deployed successfully! 🚀`);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Templates
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to deploy your bot
        </p>
      </div>

      {/* Search & Filters */}
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="flex flex-col items-center gap-4 w-full max-w-[340px]">
              <InteractiveProductCard
                title={template.name}
                description={template.description}
                price={template.price}
                imageUrl={template.imageUrl}
              />
              <Button
                onClick={() => handleDeploy(template.id)}
                disabled={deployingId === template.id}
                className={cn(
                  "w-full rounded-xl cursor-pointer font-medium transition-all h-10",
                  "bg-gradient-to-r from-primary to-purple-500 text-white",
                  "hover:shadow-lg hover:shadow-primary/20",
                  deployingId === template.id && "opacity-70"
                )}
              >
                {deployingId === template.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deploying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Deploy
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No templates found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
