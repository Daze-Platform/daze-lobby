import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AlertType = "new_property" | "agreement_signed" | "device_offline";

interface AlertPayload {
  type: AlertType;
  details: Record<string, unknown>;
}

const ALERT_PREFERENCE_MAP: Record<AlertType, string> = {
  new_property: "alert_new_property",
  agreement_signed: "alert_agreement_signed",
  device_offline: "alert_device_offline",
};

function buildEmailHtml(type: AlertType, details: Record<string, unknown>, dashboardUrl: string): { subject: string; html: string } {
  const timestamp = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  const templates: Record<AlertType, { subject: string; body: string }> = {
    new_property: {
      subject: `New Property Added: ${details.name || "Unknown"}`,
      body: `
        <h2 style="color:#6C2BD9;margin:0 0 8px">New Property Added</h2>
        <p style="font-size:16px;color:#333">A new property <strong>${details.name || "Unknown"}</strong> has been added to the platform.</p>
        ${details.client_code ? `<p style="color:#666">Client Code: <strong>${details.client_code}</strong></p>` : ""}
      `,
    },
    agreement_signed: {
      subject: `Agreement Signed: ${details.client_name || "Unknown"}`,
      body: `
        <h2 style="color:#6C2BD9;margin:0 0 8px">Agreement Signed</h2>
        <p style="font-size:16px;color:#333">The pilot agreement for <strong>${details.client_name || "Unknown"}</strong> has been signed and completed.</p>
      `,
    },
    device_offline: {
      subject: `Device Offline: ${details.serial_number || "Unknown"}`,
      body: `
        <h2 style="color:#6C2BD9;margin:0 0 8px">Device Went Offline</h2>
        <p style="font-size:16px;color:#333">Device <strong>${details.serial_number || "Unknown"}</strong> (${details.device_type || "Unknown type"}) for client <strong>${details.client_name || "Unknown"}</strong> has gone offline.</p>
      `,
    },
  };

  const t = templates[type];

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="background:linear-gradient(135deg,#6C2BD9 0%,#8B5CF6 100%);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">DAZE</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px">Onboarding Platform</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px">
        ${t.body}
        <p style="color:#999;font-size:13px;margin:20px 0 0">🕐 ${timestamp}</p>
        <div style="margin-top:24px;text-align:center">
          <a href="${dashboardUrl}" style="display:inline-block;background:#6C2BD9;color:#fff;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open Dashboard</a>
        </div>
      </div>
      <p style="text-align:center;color:#aaa;font-size:11px;margin-top:16px">You're receiving this because you have alert preferences enabled. Manage them in Settings.</p>
    </div>
  `;

  return { subject: t.subject, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AlertPayload = await req.json();
    const { type, details } = payload;

    if (!type || !ALERT_PREFERENCE_MAP[type]) {
      return new Response(JSON.stringify({ error: "Invalid alert type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const preferenceColumn = ALERT_PREFERENCE_MAP[type];

    // Query admins (and ops_managers) who have this alert enabled
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "ops_manager"]);

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      return new Response(JSON.stringify({ error: "Failed to fetch admins" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found");
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserIds = adminRoles.map((r) => r.user_id);

    // Check alert preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .in("user_id", adminUserIds)
      .eq(preferenceColumn, true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(JSON.stringify({ error: "Failed to fetch preferences" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profiles || profiles.length === 0) {
      console.log("No admins opted in for this alert type:", type);
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const optedInUserIds = profiles.map((p) => p.user_id);

    // Get emails from auth.users via admin API
    const emails: string[] = [];
    for (const userId of optedInUserIds) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (!userError && userData?.user?.email) {
        emails.push(userData.user.email);
      }
    }

    if (emails.length === 0) {
      console.log("No emails found for opted-in admins");
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email
    const dashboardUrl = Deno.env.get("SITE_URL") || "https://daze-onboarding-demo.lovable.app";
    const { subject, html } = buildEmailHtml(type, details, dashboardUrl);

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Daze <onboarding@resend.dev>",
        to: emails,
        subject,
        html,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResult);
      return new Response(JSON.stringify({ error: "Failed to send email", details: resendResult }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Alert emails sent: type=${type}, recipients=${emails.length}`);
    return new Response(JSON.stringify({ sent: emails.length, resend_id: resendResult.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
