import { listTemplates } from "@/lib/instances";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = listTemplates();
    return Response.json({ templates });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to list templates" },
      { status: 500 }
    );
  }
}
