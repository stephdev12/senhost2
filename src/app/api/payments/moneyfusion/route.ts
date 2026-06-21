import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/moneyfusion — Initiate a MoneyFusion Mobile Money checkout
 * Body: { tierName: string, coins: number, price: number, phoneNumber: string, clientName: string }
 */
/**
 * Returns the public-facing base URL of the app.
 * Prefers the NEXT_PUBLIC_APP_URL env var (set in production .env)
 * to avoid leaking the internal 127.0.0.1 address when behind Nginx.
 */
function getBaseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    req.nextUrl.origin
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tierName, coins, price, phoneNumber, clientName } = body;

    const apiUrl = process.env.MONEYFUSION_API_URL;
    const token = `mf_${Math.random().toString(36).substring(2, 15)}`;
    const baseUrl = getBaseUrl(request);

    const returnUrl = `${baseUrl}/dashboard/coins?payment_status=success&transId=${token}&coins=${coins}&gateway=moneyfusion`;

    // Fallback for sandbox testing if MoneyFusion API URL isn't configured
    if (!apiUrl) {
      return Response.json({
        link: returnUrl, // In sandbox, directly redirect back with success query params
        token,
        sandbox: true,
      });
    }

    // Call real MoneyFusion API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        totalPrice: price,
        article: [
          {
            name: tierName,
            price: price,
          },
        ],
        numeroSend: phoneNumber || "00000000",
        nomclient: clientName || "SenHost Customer",
        return_url: returnUrl,
        webhook_url: `${baseUrl}/api/payments/moneyfusion/webhook`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoneyFusion API Error: ${errorText}`);
    }

    const data = await response.json();
    // MoneyFusion returns { statut: true, token: "...", message: "...", url: "..." }
    if (data.statut && data.url) {
      return Response.json({
        link: data.url,
        token: data.token,
      });
    } else {
      throw new Error(data.message || "Invalid response from MoneyFusion");
    }
  } catch (error: any) {
    console.error("MoneyFusion Initiate failed:", error);
    return Response.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/moneyfusion — Query MoneyFusion status on redirect
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("transId"); // token maps to transId on redirect query param

    if (!token) {
      return Response.json({ error: "token/transId is required" }, { status: 400 });
    }

    // If sandbox token format or no credentials
    if (token.startsWith("mf_") || !process.env.MONEYFUSION_API_URL) {
      return Response.json({ status: "paid", sandbox: true });
    }

    const response = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${token}`, {
      method: "GET",
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to fetch status from MoneyFusion" }, { status: 500 });
    }

    const data = await response.json();
    // MoneyFusion status returns { statut: true, data: { statut: "paid" } }
    if (data.statut && data.data && data.data.statut === "paid") {
      return Response.json({ status: "paid" });
    } else {
      return Response.json({ status: "pending" });
    }
  } catch (error: any) {
    console.error("MoneyFusion Query Status failed:", error);
    return Response.json(
      { error: error.message || "Failed to query status" },
      { status: 500 }
    );
  }
}
