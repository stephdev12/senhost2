import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/fapshi — Initiate a Fapshi Mobile Money checkout
 * Body: { tierName: string, coins: number, price: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tierName, coins, price } = body;

    const apiKey = process.env.FAPSHI_API_KEY;
    const apiUser = process.env.FAPSHI_API_USER;
    const transId = `fap_${Math.random().toString(36).substring(2, 15)}`;

    // Fallback URL for testing sandbox if API credentials aren't supplied yet
    if (!apiKey || !apiUser) {
      return Response.json({
        link: `https://live.fapshi.com/checkout?transId=${transId}&amount=${price}`,
        transId,
        sandbox: true,
      });
    }

    const response = await fetch("https://live.fapshi.com/initiate-pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "apiuser": apiUser,
      },
      body: JSON.stringify({
        amount: price,
        email: "client@senhost.com",
        redirectUrl: `${request.nextUrl.origin}/dashboard/coins?payment_status=success&transId=${transId}&coins=${coins}`,
        userId: "user_senhost",
        externalId: transId,
        message: `Purchase of ${coins} Coins on SenHost`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fapshi API Error: ${errorText}`);
    }

    const data = await response.json();
    return Response.json({
      link: data.link,
      transId,
    });
  } catch (error: any) {
    console.error("Fapshi Initiate Pay failed:", error);
    return Response.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/fapshi — Query Fapshi Payment status on redirect
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transId = searchParams.get("transId");

    if (!transId) {
      return Response.json({ error: "transId is required" }, { status: 400 });
    }

    const apiKey = process.env.FAPSHI_API_KEY;
    const apiUser = process.env.FAPSHI_API_USER;

    if (!apiKey || !apiUser) {
      // Simulate SUCCESS in sandbox mode without keys
      return Response.json({ status: "SUCCESSFUL", sandbox: true });
    }

    const response = await fetch(`https://live.fapshi.com/payment-status/${transId}`, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "apiuser": apiUser,
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to fetch status from Fapshi" }, { status: 500 });
    }

    const data = await response.json();
    return Response.json({ status: data.status });
  } catch (error: any) {
    console.error("Fapshi Query Status failed:", error);
    return Response.json(
      { error: error.message || "Failed to query status" },
      { status: 500 }
    );
  }
}
