import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Minimal email sender using Resend as example. Replace with your provider as needed.
// Required secrets to set in Supabase project:
// - RESEND_API_KEY (or SENDGRID_API_KEY / POSTMARK_API_TOKEN)
// - FROM_EMAIL (e.g. notifications@yourdomain.com)

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

function getEnv(name: string, required = true): string | undefined {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function getFirstEnv(names: string[], required = true): string | undefined {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v) return v;
  }
  if (required) throw new Error(`Missing required env. Tried: ${names.join(', ')}`);
  return undefined;
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

// Alternative providers (example placeholders):
// async function sendEmailSendgrid(to: string, subject: string, html: string) { /* TODO */ }
// async function sendEmailPostmark(to: string, subject: string, html: string) { /* TODO */ }

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { membershipId } = await req.json().catch(() => ({}));
    if (!membershipId) {
      return new Response(JSON.stringify({ error: "membershipId is required" }), { status: 400 });
    }

    // SUPABASE_URL is injected automatically by the platform. Do NOT add it as a secret.
    const url = getEnv("SUPABASE_URL")!;
    // Use SERVICE_ROLE_KEY (recommended). Fallback to legacy name if present.
    const serviceRoleKey = getFirstEnv(["SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"])!;

    // Fetch membership -> user -> community
    const membership = await getMembership(url, serviceRoleKey, membershipId);
    const [user, community] = await Promise.all([
      getUser(url, serviceRoleKey, membership.user_id),
      getCommunity(url, serviceRoleKey, membership.community_id),
    ]);

    if (!user.email) {
      console.warn("Approved user has no email; skipping email");
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
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

    // Choose provider: default to Resend; replace with your preferred provider if needed
    await sendEmailResend(user.email, subject, html);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("send-membership-approved error:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), { status: 200 });
  }
});


