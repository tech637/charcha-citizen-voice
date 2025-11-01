import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Minimal email sender using Mailgun as primary provider. Replace with your provider as needed.
// Required secrets to set in Supabase project:
// - MAILGUN_API_KEY (primary, no domain verification needed)
// - MAILGUN_DOMAIN (your Mailgun domain)
// - FROM_EMAIL (e.g. notifications@yourdomain.com)
// Alternative providers: SENDGRID_API_KEY, RESEND_API_KEY

type MembershipRow = {
  id: string;
  user_id: string;
  community_id: string;
};

type CommunityRow = {
  id: string;
  name: string;
};

type UserRow = {
  id: string;
  email: string | null;
  full_name?: string | null;
};

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

function getEnv(name: string, required = true): string {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing required env: ${name}`);
  return value!;
}

function getFirstEnv(names: string[], required = true): string {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v) return v;
  }
  if (required) throw new Error(`Missing required env. Tried: ${names.join(', ')}`);
  return "";
}

async function getMembership(baseUrl: string, serviceKey: string, membershipId: string): Promise<MembershipRow> {
  const url = `${baseUrl}/rest/v1/user_communities?id=eq.${membershipId}&select=id,user_id,community_id`;
  const data = await fetchJson<MembershipRow[]>(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!data.length) throw new Error("Membership not found");
  return data[0];
}

async function getCommunity(baseUrl: string, serviceKey: string, communityId: string): Promise<CommunityRow> {
  const url = `${baseUrl}/rest/v1/communities?id=eq.${communityId}&select=id,name`;
  const data = await fetchJson<CommunityRow[]>(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!data.length) throw new Error("Community not found");
  return data[0];
}

async function getUser(baseUrl: string, serviceKey: string, userId: string): Promise<UserRow> {
  const url = `${baseUrl}/rest/v1/users?id=eq.${userId}&select=id,email,full_name`;
  const data = await fetchJson<UserRow[]>(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!data.length) throw new Error("User not found");
  return data[0];
}

async function sendEmailResend(to: string, subject: string, html: string) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("FROM_EMAIL");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed: ${res.status} ${text}`);
  }
}

// Alternative provider: SendGrid (supports Single Sender verification)
async function sendEmailSendgrid(to: string, subject: string, html: string) {
  const apiKey = getEnv("SENDGRID_API_KEY");
  const from = getEnv("FROM_EMAIL");
  const payload = {
    personalizations: [
      { to: [{ email: to }] }
    ],
    from: { email: from },
    subject,
    content: [{ type: "text/html", value: html }]
  };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid failed: ${res.status} ${text}`);
  }
}

// Alternative provider: Mailgun (no domain verification needed)
async function sendEmailMailgun(to: string, subject: string, html: string) {
  const apiKey = getEnv("MAILGUN_API_KEY");
  const domain = getEnv("MAILGUN_DOMAIN");
  const from = getEnv("FROM_EMAIL");
  
  console.log("Mailgun send attempt", { to, from, subject, domain });
  
  const formData = new URLSearchParams({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
  
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`api:${apiKey}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Mailgun send failed", { status: res.status, body: text });
    throw new Error(`Mailgun failed: ${res.status} ${text}`);
  }
  
  const result = await res.json();
  console.log("Mailgun send succeeded", { to, subject, messageId: result.id });
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const { membershipId } = await req.json().catch(() => ({}));
    if (!membershipId) {
      return new Response(JSON.stringify({ error: "membershipId is required" }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // SUPABASE_URL is injected automatically by the platform. Do NOT add it as a secret.
    const url = getEnv("SUPABASE_URL")!;
    // Use SERVICE_ROLE_KEY (recommended). Fallback to legacy name if present.
    const serviceRoleKey = getFirstEnv(["SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"])!;

    // Fetch membership -> user -> community
    console.log("send-membership-approved invoked", { membershipId });
    const membership = await getMembership(url, serviceRoleKey, membershipId);
    const [user, community] = await Promise.all([
      getUser(url, serviceRoleKey, membership.user_id),
      getCommunity(url, serviceRoleKey, membership.community_id),
    ]);

    if (!user.email) {
      console.warn("Approved user has no email; skipping email");
      return new Response(JSON.stringify({ skipped: true }), { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const subject = `You're approved to join ${community.name}`;
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to ${community.name}!</h2>
        <p>Hi ${user.full_name || "there"},</p>
        <p>Your request to join <strong>${community.name}</strong> has been approved.</p>
        <p>You can now access the community page, participate in discussions, and file complaints.</p>
        <p>Thanks,<br/>Charcha Team</p>
      </div>
    `;

    // Choose provider priority:
    // 1) Mailgun (no domain verification needed, can send to anyone)
    // 2) SendGrid (single sender)
    // 3) Resend (requires verified domain or sandbox recipient)
    if (Deno.env.get("MAILGUN_API_KEY")) {
      await sendEmailMailgun(user.email, subject, html);
    } else if (Deno.env.get("SENDGRID_API_KEY")) {
      await sendEmailSendgrid(user.email, subject, html);
    } else {
      await sendEmailResend(user.email, subject, html);
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (err: any) {
    console.error("send-membership-approved error:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
});


