import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Email notification for membership approval using Mailgun
// Required secrets to set in Supabase project:
// - MAILGUN_API_KEY (primary, no domain verification needed)
// - MAILGUN_DOMAIN (your Mailgun domain)
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

function getEnv(name: string, required = true): string {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing required env: ${name}`);
  return value!;
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

async function sendEmailResend(to: string, subject: string, html: string) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("FROM_EMAIL");
  
  console.log("Resend send attempt", { to, from, subject });
  
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from,
      to: [to],
      subject: subject,
      html: html,
    }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Resend send failed", { status: res.status, body: text });
    throw new Error(`Resend failed: ${res.status} ${text}`);
  }
  
  const result = await res.json();
  console.log("Resend send succeeded", { to, subject, messageId: result.id });
}

async function sendEmailSendgrid(to: string, subject: string, html: string) {
  const apiKey = getEnv("SENDGRID_API_KEY");
  const from = getEnv("FROM_EMAIL");
  
  console.log("SendGrid send attempt", { to, from, subject });
  
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: subject,
    content: [{ type: "text/html", value: html }]
  };
  
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("SendGrid send failed", { status: res.status, body: text });
    throw new Error(`SendGrid failed: ${res.status} ${text}`);
  }
  
  console.log("SendGrid send succeeded", { to, subject });
}

async function sendEmailPostmark(to: string, subject: string, html: string) {
  const serverToken = getEnv("POSTMARK_SERVER_TOKEN");
  const from = getEnv("FROM_EMAIL");
  
  console.log("Postmark send attempt", { to, from, subject });
  
  const payload = {
    From: from,
    To: to,
    Subject: subject,
    HtmlBody: html
  };
  
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": serverToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Postmark send failed", { status: res.status, body: text });
    throw new Error(`Postmark failed: ${res.status} ${text}`);
  }
  
  const result = await res.json();
  console.log("Postmark send succeeded", { to, subject, messageId: result.MessageID });
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

    // SUPABASE_URL is injected automatically by the platform
    const url = getEnv("SUPABASE_URL")!;
    const serviceRoleKey = getEnv("SERVICE_ROLE_KEY")!;

    // Fetch membership -> user -> community
    console.log("send-approval-email invoked", { membershipId });
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

    // Try multiple email providers in order of preference
    let emailSent = false;
    let lastError = null;

    // Try Mailgun first
    if (Deno.env.get("MAILGUN_API_KEY") && Deno.env.get("MAILGUN_DOMAIN")) {
      try {
        await sendEmailMailgun(user.email, subject, html);
        emailSent = true;
      } catch (err) {
        console.error("Mailgun failed:", err);
        lastError = err;
      }
    }

    // Try Resend as fallback
    if (!emailSent && Deno.env.get("RESEND_API_KEY")) {
      try {
        await sendEmailResend(user.email, subject, html);
        emailSent = true;
      } catch (err) {
        console.error("Resend failed:", err);
        lastError = err;
      }
    }

    // Try SendGrid as fallback
    if (!emailSent && Deno.env.get("SENDGRID_API_KEY")) {
      try {
        await sendEmailSendgrid(user.email, subject, html);
        emailSent = true;
      } catch (err) {
        console.error("SendGrid failed:", err);
        lastError = err;
      }
    }

    // Try Postmark as fallback
    if (!emailSent && Deno.env.get("POSTMARK_SERVER_TOKEN")) {
      try {
        await sendEmailPostmark(user.email, subject, html);
        emailSent = true;
      } catch (err) {
        console.error("Postmark failed:", err);
        lastError = err;
      }
    }

    if (!emailSent) {
      throw new Error(`All email providers failed. Last error: ${lastError?.message || 'No providers configured'}`);
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (err: any) {
    console.error("send-approval-email error:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
});