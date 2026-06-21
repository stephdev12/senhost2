import { execSync, exec } from "child_process";
import path from "path";

export interface BotStatus {
  name: string;
  pid: number;
  pm_id: number;
  status: "online" | "stopped" | "errored" | "launching";
  memory: number;
  cpu: number;
  uptime: number;
  restarts: number;
}

/**
 * List all PM2 processes
 */
export function listBots(): BotStatus[] {
  try {
    const result = execSync("npx pm2 jlist", { encoding: "utf-8" });
    const processes = JSON.parse(result);

    return processes.map((proc: any) => ({
      name: proc.name,
      pid: proc.pid,
      pm_id: proc.pm_id,
      status: proc.pm2_env?.status || "stopped",
      memory: proc.monit?.memory || 0,
      cpu: proc.monit?.cpu || 0,
      uptime: proc.pm2_env?.pm_uptime || 0,
      restarts: proc.pm2_env?.restart_time || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Start a bot instance via PM2
 */
export function startBot(instanceId: string, scriptPath: string): boolean {
  try {
    const instanceDir = path.dirname(scriptPath);
    execSync(`npx pm2 start ${scriptPath} --cwd "${instanceDir}" --name "${instanceId}"`, {
      encoding: "utf-8",
    });
    return true;
  } catch (error) {
    console.error(`Failed to start bot ${instanceId}:`, error);
    return false;
  }
}

/**
 * Stop a bot instance
 */
export function stopBot(instanceId: string): boolean {
  try {
    execSync(`npx pm2 stop "${instanceId}"`, { encoding: "utf-8" });
    return true;
  } catch (error) {
    console.error(`Failed to stop bot ${instanceId}:`, error);
    return false;
  }
}

/**
 * Restart a bot instance
 */
export function restartBot(instanceId: string): boolean {
  try {
    execSync(`npx pm2 restart "${instanceId}"`, { encoding: "utf-8" });
    return true;
  } catch (error) {
    console.error(`Failed to restart bot ${instanceId}:`, error);
    return false;
  }
}

/**
 * Delete a bot from PM2 (stop + delete to fully remove the process)
 */
export function deleteBot(instanceId: string): boolean {
  try {
    // Stop first (ignore error if already stopped)
    try {
      execSync(`npx pm2 stop "${instanceId}"`, { encoding: "utf-8", stdio: "pipe" });
    } catch { /* already stopped — ignore */ }
    // Remove from PM2 process list
    execSync(`npx pm2 delete "${instanceId}"`, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch (error) {
    console.error(`Failed to delete bot ${instanceId}:`, error);
    return false;
  }
}

/**
 * Get status of a specific bot
 */
export function getBotStatus(instanceId: string): BotStatus | null {
  const bots = listBots();
  return bots.find((b) => b.name === instanceId) || null;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Format uptime in ms to human readable
 */
export function formatUptime(uptimeMs: number): string {
  if (!uptimeMs) return "—";
  const now = Date.now();
  const diff = now - uptimeMs;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
