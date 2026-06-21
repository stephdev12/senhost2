import { deleteInstance } from "@/lib/instances";
import {
  getBotStatus,
  startBot,
  stopBot,
  restartBot,
  deleteBot,
  formatBytes,
  formatUptime,
} from "@/lib/pm2";
import { getInstanceEntryPoint } from "@/lib/instances";

export const dynamic = "force-dynamic";

/**
 * GET /api/instances/[id] — Get instance details + PM2 status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pm2Info = getBotStatus(id);
    
    // Read status.json if it exists inside the instance directory
    const fs = require("fs");
    const path = require("path");
    const statusPath = path.join(process.cwd(), "instances", id, "status.json");
    let botStatusInfo = null;
    
    if (fs.existsSync(statusPath)) {
      try {
        botStatusInfo = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
      } catch (_) {}
    }

    return Response.json({
      id,
      status: pm2Info?.status || "stopped",
      memory: pm2Info ? formatBytes(pm2Info.memory) : "—",
      cpu: pm2Info?.cpu || 0,
      uptime: pm2Info ? formatUptime(pm2Info.uptime) : "—",
      restarts: pm2Info?.restarts || 0,
      pid: pm2Info?.pid || null,
      connectionStatus: botStatusInfo?.status || null,
      pairingCode: botStatusInfo?.pairingCode || null,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to get instance" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/instances/[id] — Start/Stop/Restart instance
 * Body: { action: "start" | "stop" | "restart" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    let success = false;

    switch (action) {
      case "start": {
        const entryPoint = getInstanceEntryPoint(id);
        if (entryPoint) {
          success = startBot(id, entryPoint);
        } else {
          return Response.json(
            { error: "No entry point found for this instance" },
            { status: 400 }
          );
        }
        break;
      }
      case "stop":
        success = stopBot(id);
        break;
      case "restart":
        success = restartBot(id);
        break;
      case "update_config": {
        const fs = require("fs");
        const path = require("path");
        const instancePath = path.join(process.cwd(), "instances", id);
        const configPath = path.join(instancePath, "config.json");
        try {
          if (fs.existsSync(instancePath)) {
            fs.writeFileSync(configPath, JSON.stringify(body.config || {}, null, 2));
            success = true;
          }
        } catch (e: any) {
          return Response.json({ error: e.message || "Failed to update config file" }, { status: 500 });
        }
        break;
      }
      default:
        return Response.json(
          { error: "Invalid action. Use: start, stop, restart, or update_config" },
          { status: 400 }
        );
    }

    if (!success) {
      return Response.json(
        { error: `Failed to ${action} instance "${id}"` },
        { status: 500 }
      );
    }

    return Response.json({
      message: `Instance "${id}" updated successfully`,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update instance" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instances/[id] — Delete instance (PM2 + files)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Stop and delete from PM2 first
    deleteBot(id);

    // Delete instance directory
    const result = deleteInstance(id);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      message: `Instance "${id}" deleted successfully`,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to delete instance" },
      { status: 500 }
    );
  }
}
