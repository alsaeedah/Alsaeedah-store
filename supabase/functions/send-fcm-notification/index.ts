// ============================================================
// Supabase Edge Function: send-fcm-notification
// Runtime: Deno (NOT Node.js — do not use firebase-admin npm package)
// Deploy: supabase functions deploy send-fcm-notification
// Secret required: FIREBASE_SERVICE_ACCOUNT (full JSON string)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────────────
interface NotificationPayload {
  orderId: string;
  customerId: string;
  orderNumber: number | string;
  notificationType: string;
}

interface TokenRow {
  id: string;
  fcm_token: string;
  manager_id: string;
}

// ── CORS Headers ───────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Google OAuth2: Get access token from Service Account ───────────────────
async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: expiry,
    })
  );

  const signingInput = `${header}.${payload}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput)
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signingInput}.${sigBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

// ── Send a single FCM message ──────────────────────────────────────────────
async function sendFCMMessage(
  token: string,
  accessToken: string,
  projectId: string,
  data: NotificationPayload
): Promise<{ success: boolean; invalid: boolean }> {
  const message = {
    message: {
      token,
      notification: {
        title: "طلب جديد",
        body: "تم استلام طلب عميل جديد ويحتاج إلى مراجعة.",
      },
      data: {
        orderId: String(data.orderId),
        customerId: String(data.customerId),
        orderNumber: String(data.orderNumber),
        notificationType: data.notificationType,
        clickAction: "/orders",
      },
      webpush: {
        notification: {
          title: "طلب جديد",
          body: "تم استلام طلب عميل جديد ويحتاج إلى مراجعة.",
          icon: "/logo.png",
          badge: "/logo.png",
          requireInteraction: true,
          actions: [
            {
              action: "open_orders",
              title: "عرض الطلبات",
            },
          ],
        },
        fcm_options: {
          link: `/orders?highlight=${data.orderId}`,
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (response.ok) {
    return { success: true, invalid: false };
  }

  const errorBody = await response.json().catch(() => ({}));
  const errorCode = errorBody?.error?.details?.[0]?.errorCode ?? "";
  // UNREGISTERED or INVALID_ARGUMENT with token means the token is stale
  const isInvalid =
    response.status === 404 ||
    response.status === 410 ||
    errorCode === "UNREGISTERED" ||
    errorCode === "INVALID_ARGUMENT";

  console.error(`FCM error for token (status ${response.status}):`, errorCode, errorBody?.error?.message);
  return { success: false, invalid: isInvalid };
}

// ── Main Handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse request body
    const body: NotificationPayload = await req.json();
    const { orderId, customerId, orderNumber, notificationType } = body;

    if (!orderId || !notificationType) {
      return new Response(
        JSON.stringify({ error: "orderId and notificationType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Load Firebase Service Account from secret
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    // 3. Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Fetch all active FCM tokens
    const { data: tokens, error: fetchError } = await supabase
      .from("manager_push_tokens")
      .select("id, fcm_token, manager_id")
      .eq("active", true);

    if (fetchError) {
      throw new Error(`Failed to fetch tokens: ${fetchError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active manager FCM tokens found. Skipping notification.");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_active_tokens" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Get FCM access token
    const accessToken = await getAccessToken(serviceAccount);

    // 6. Send to each token, collect invalid ones
    const invalidTokenIds: string[] = [];
    const results = await Promise.allSettled(
      (tokens as TokenRow[]).map(async (row) => {
        const result = await sendFCMMessage(row.fcm_token, accessToken, projectId, {
          orderId,
          customerId,
          orderNumber,
          notificationType,
        });
        if (result.invalid) {
          invalidTokenIds.push(row.id);
        }
        return result;
      })
    );

    // 7. Clean up invalid/expired tokens
    if (invalidTokenIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("manager_push_tokens")
        .delete()
        .in("id", invalidTokenIds);

      if (deleteError) {
        console.error("Failed to delete invalid tokens:", deleteError.message);
      } else {
        console.log(`Removed ${invalidTokenIds.length} invalid FCM token(s).`);
      }
    }

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    console.log(
      `FCM notification for order ${orderNumber}: ${successful} delivered, ${failed} failed, ${invalidTokenIds.length} tokens removed.`
    );

    return new Response(
      JSON.stringify({
        status: "done",
        total: tokens.length,
        delivered: successful,
        failed,
        invalidRemoved: invalidTokenIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Never let notification failure surface as a hard error to the client
    console.error("send-fcm-notification error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
