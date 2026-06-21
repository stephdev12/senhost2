import { listInstances, copyTemplate, getInstanceEntryPoint } from "@/lib/instances";
import { listBots, startBot, formatBytes, formatUptime } from "@/lib/pm2";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/instances — List all instances with PM2 status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    const instances = listInstances();
    const pm2Bots = listBots();

    const enriched = instances.map((instance) => {
      const pm2Info = pm2Bots.find((b) => b.name === instance.id);

      return {
        id: instance.id,
        templateId: instance.templateId,
        config: instance.config,
        createdAt: instance.createdAt,
        status: pm2Info?.status || "stopped",
        memory: pm2Info ? formatBytes(pm2Info.memory) : "—",
        cpu: pm2Info?.cpu || 0,
        uptime: pm2Info ? formatUptime(pm2Info.uptime) : "—",
        restarts: pm2Info?.restarts || 0,
        pid: pm2Info?.pid || null,
      };
    });

    // Filter by owner email if supplied (isolate user instances)
    const filtered = email
      ? enriched.filter((i) => i.config?.ownerEmail?.toLowerCase() === email.toLowerCase())
      : enriched;

    return Response.json({ instances: filtered });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to list instances" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instances — Deploy a new bot instance
 * Body: { templateId: string, name?: string, config?: Record<string, string> }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, name, config = {} } = body;

    if (!templateId) {
      return Response.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // Generate unique instance ID
    const instanceId = `${templateId}-${name ? name.replace(/\s+/g, "-").toLowerCase() : ""}-${randomUUID().slice(0, 8)}`;

    // Copy template
    const result = copyTemplate(templateId, instanceId, config);
    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Find entry point and start with PM2
    const entryPoint = getInstanceEntryPoint(instanceId);
    if (entryPoint) {
      const started = startBot(instanceId, entryPoint);
      if (!started) {
        return Response.json(
          {
            warning: "Instance created but failed to start via PM2",
            instanceId,
          },
          { status: 201 }
        );
      }
    }

    return Response.json(
      {
        message: "Instance deployed successfully",
        instanceId,
        instancePath: result.instancePath,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to deploy instance" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instances?instanceId=xxx — Kill PM2 process + delete instance folder
 * DELETE /api/instances?ownerEmail=xxx — Kill + delete ALL instances belonging to a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const instanceId = request.nextUrl.searchParams.get("instanceId");
    const ownerEmail = request.nextUrl.searchParams.get("ownerEmail");

    const { deleteBot } = await import("@/lib/pm2");
    const { deleteInstance, listInstances } = await import("@/lib/instances");

    // ── Bulk delete by owner email ──────────────────────────────────────────
    if (ownerEmail) {
      const all = listInstances();
      const owned = all.filter(
        (i) => i.config?.ownerEmail?.toLowerCase() === ownerEmail.toLowerCase()
      );

      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const instance of owned) {
        // Kill in PM2
        deleteBot(instance.id);
        // Delete from disk
        const del = deleteInstance(instance.id);
        results.push({ id: instance.id, success: del.success, error: del.error });
      }

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        return Response.json(
          {
            message: `Deleted ${results.length - failed.length}/${results.length} instances`,
            failures: failed,
          },
          { status: 207 }
        );
      }

      return Response.json({
        message: `All ${results.length} instance(s) for "${ownerEmail}" deleted successfully`,
        deleted: results.map((r) => r.id),
      });
    }

    // ── Single instance delete ───────────────────────────────────────────────
    if (!instanceId) {
      return Response.json(
        { error: "instanceId or ownerEmail is required" },
        { status: 400 }
      );
    }

    // 1. Kill and remove from PM2 (ignore errors if not registered)
    deleteBot(instanceId);

    // 2. Delete the instance directory from disk
    const result = deleteInstance(instanceId);

    if (!result.success) {
      return Response.json(
        { error: result.error || "Failed to delete instance directory" },
        { status: 500 }
      );
    }

    return Response.json({ message: `Instance "${instanceId}" deleted successfully` });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to delete instance" },
      { status: 500 }
    );
  }
}
