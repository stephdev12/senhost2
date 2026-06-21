"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  DollarSign,
  UserCheck,
  UserX,
  Coins,
  ShieldAlert,
  Trash2,
  PlusCircle,
  MinusCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  coins: number;
  isBlocked: boolean;
  createdAt: string;
}

interface CompletedTransaction {
  transId: string;
  amount: number;
  coins: number;
  email: string;
  gateway: string;
  date: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [transactions, setTransactions] = useState<CompletedTransaction[]>([]);
  const [activeBotsCount, setActiveBotsCount] = useState<number>(0);
  const [allInstances, setAllInstances] = useState<any[]>([]);
  const [viewingBotsUser, setViewingBotsUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Inputs for coin modification
  const [modifyingUser, setModifyingUser] = useState<UserRecord | null>(null);
  const [coinChangeAmount, setCoinChangeAmount] = useState<string>("50");

  const verifyAdminAndLoadData = async () => {
    try {
      const currentUserStr = localStorage.getItem("current_user");
      if (!currentUserStr) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      // Hardcoded admin email
      if (currentUser.email !== "stephaneboyce@gmail.com") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load users
      const usersStr = localStorage.getItem("users");
      const usersList = usersStr ? JSON.parse(usersStr) : [];
      setUsers(usersList);

      // Load completed transactions
      const txStr = localStorage.getItem("completed_transactions");
      const txList = txStr ? JSON.parse(txStr) : [];
      setTransactions(txList);

      // Fetch running PM2 bots count from instances api
      const res = await fetch("/api/instances");
      if (res.ok) {
        const data = await res.json();
        const instances = data.instances || [];
        setAllInstances(instances);
        const activeBots = instances.filter(
          (i: any) => i.status === "online"
        ).length;
        setActiveBotsCount(activeBots);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAdminAndLoadData();
  }, []);

  const handleToggleBlock = (userId: string) => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        // Prevent admin from blocking themselves
        if (u.email === "sen@senhost.com") return u;
        return { ...u, isBlocked: !u.isBlocked };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Force updates in session storage if active user is current modified user
    const currentUserStr = localStorage.getItem("current_user");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const targetUser = updatedUsers.find((u) => u.id === userId);
      if (targetUser && currentUser.email === targetUser.email) {
        localStorage.setItem("current_user", JSON.stringify(targetUser));
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email === "sen@senhost.com") {
      alert("You cannot delete the admin account.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${targetUser.name}" and ALL of their active bots?`)) {
      return;
    }

    try {
      // Delete user's active instances
      const res = await fetch(`/api/instances?ownerEmail=${encodeURIComponent(targetUser.email)}`, {
        method: "DELETE"
      });

      if (!res.ok && res.status !== 207) {
        const errorData = await res.json();
        alert(`Warning: Failed to delete user instances: ${errorData.error || errorData.message}`);
      }
    } catch (err) {
      console.error("Error deleting instances:", err);
      alert("Failed to delete user instances, but proceeding with account deletion.");
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Refresh metrics/instances
    verifyAdminAndLoadData();
  };

  const handleUpdateCoins = (isAdd: boolean) => {
    if (!modifyingUser) return;
    const change = parseInt(coinChangeAmount);
    if (isNaN(change) || change <= 0) {
      alert("Please enter a valid positive number for coin adjustment.");
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.id === modifyingUser.id) {
        const finalCoins = isAdd ? u.coins + change : Math.max(0, u.coins - change);
        return { ...u, coins: finalCoins };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Sync with active session balance if modifying current admin session
    const currentUserStr = localStorage.getItem("current_user");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const targetUser = updatedUsers.find((u) => u.id === modifyingUser.id);
      if (targetUser && currentUser.email === targetUser.email) {
        localStorage.setItem("current_user", JSON.stringify(targetUser));
        localStorage.setItem("coins_balance", targetUser.coins.toString());
      }
    }

    setModifyingUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading admin settings...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Access Denied
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          This area is restricted to SenHost platform administrators. Please sign in with admin credentials.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/login">
            <Button className="bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl">
              Sign In
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              Back to Safety
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalUsers = users.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">Admin Control Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                S
              </div>
              <span className="text-sm font-medium hidden sm:inline text-muted-foreground">
                Steph (Sen)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-fade-in-up">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Registered Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">{totalUsers}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Registered database accounts
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Active Bots
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">{activeBotsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Currently running in PM2 status
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Revenue Generated
              </CardTitle>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">
                {totalRevenue.toLocaleString()} FCFA
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Validated Mobile Money checkouts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table Card */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Account Management</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Coins</th>
                  <th className="py-3 px-4">Bots</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground">{user.name}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{user.createdAt}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                        <Coins className="h-3.5 w-3.5" />
                        {user.coins}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const userInstances = allInstances.filter(
                          (i) => i.config?.ownerEmail?.toLowerCase() === user.email.toLowerCase()
                        );
                        const activeCount = userInstances.filter((i) => i.status === "online").length;
                        return (
                          <button
                            onClick={() => setViewingBotsUser(user)}
                            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            title="Click to view and manage bots"
                          >
                            <Activity className={cn("h-3 w-3", activeCount > 0 ? "text-emerald-400 animate-pulse" : "text-muted-foreground")} />
                            {activeCount} / {userInstances.length}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          user.isBlocked
                            ? "bg-red-400/10 text-red-400"
                            : "bg-emerald-400/10 text-emerald-400"
                        )}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Adjust Coins */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModifyingUser(user)}
                          className="h-8 rounded-lg text-xs"
                        >
                          Coins
                        </Button>

                        {/* Block/Unblock toggle */}
                        {user.email !== "sen@senhost.com" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleBlock(user.id)}
                              className={cn(
                                "h-8 rounded-lg text-xs cursor-pointer",
                                user.isBlocked
                                  ? "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                                  : "text-red-400 border-red-500/20 hover:bg-red-500/10"
                              )}
                              title={user.isBlocked ? "Unblock User" : "Block User"}
                            >
                              {user.isBlocked ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                            </Button>

                            {/* Delete Account */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="h-8 w-8 p-0 text-red-500 border-red-500/20 hover:bg-red-500/10 rounded-lg cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Transaction History Card */}
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Verified Transactions History</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Client Email</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Coins Credited</th>
                    <th className="py-3 px-4">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx.transId} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 text-foreground">{tx.transId}</td>
                      <td className="py-3 px-4 text-muted-foreground">{tx.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {tx.amount.toLocaleString()} FCFA
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-semibold">{tx.coins} Coins</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                        {tx.gateway}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No verified transactions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Adjust Coins Modal */}
      {modifyingUser && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Adjust Coins balance
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Modify coin balance for user <strong>{modifyingUser.name}</strong> (Current: {modifyingUser.coins} coins)
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Amount of Coins
                </label>
                <input
                  type="number"
                  value={coinChangeAmount}
                  onChange={(e) => setCoinChangeAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                  placeholder="50"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setModifyingUser(null)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateCoins(false)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer transition-all flex items-center gap-1 text-xs"
              >
                <MinusCircle className="h-3.5 w-3.5" />
                Subtract
              </Button>
              <Button
                onClick={() => handleUpdateCoins(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl cursor-pointer transition-all flex items-center gap-1 text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Coins
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Bots Modal */}
      {viewingBotsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Bots for {viewingBotsUser.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {viewingBotsUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingBotsUser(null)}
                className="rounded-lg"
              >
                Close
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[400px] space-y-4 pr-1">
              {(() => {
                const userInstances = allInstances.filter(
                  (i) => i.config?.ownerEmail?.toLowerCase() === viewingBotsUser.email.toLowerCase()
                );

                if (userInstances.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      This user has no instances.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-semibold text-xs">
                        <th className="py-2">Bot ID</th>
                        <th className="py-2">Template</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Uptime</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {userInstances.map((inst) => (
                        <tr key={inst.id} className="text-xs">
                          <td className="py-3 font-mono font-medium max-w-[200px] truncate" title={inst.id}>
                            {inst.id}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {inst.templateId}
                          </td>
                          <td className="py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                inst.status === "online"
                                  ? "bg-emerald-400/10 text-emerald-400"
                                  : "bg-red-400/10 text-red-400"
                              )}
                            >
                              {inst.status}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground font-mono">
                            {inst.uptime}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Are you sure you want to permanently delete bot "${inst.id}"? This stops the PM2 process and deletes all file contents.`
                                  )
                                ) {
                                  try {
                                    const res = await fetch(
                                      `/api/instances?instanceId=${encodeURIComponent(
                                        inst.id
                                      )}`,
                                      { method: "DELETE" }
                                    );
                                    if (res.ok) {
                                      // Refresh data
                                      verifyAdminAndLoadData();
                                    } else {
                                      const data = await res.json();
                                      alert(
                                        `Failed to delete bot: ${
                                          data.error || data.message
                                        }`
                                      );
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    alert("Error deleting bot.");
                                  }
                                }
                              }}
                              className="h-7 px-2 text-red-500 border-red-500/20 hover:bg-red-500/10 rounded-lg cursor-pointer"
                              title="Delete Bot Instance"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
