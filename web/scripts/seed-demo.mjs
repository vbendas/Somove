// Seeds fictional demo accounts + activity for the public DEMO_MODE deployment.
// Run: cd web && set -a && . ./.env.local && set +a && node scripts/seed-demo.mjs
// Idempotent: accounts matched by email, other rows by stable keys/names.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const TZ = "Europe/Lisbon";
const counts = {};
const bump = (t, k) => ((counts[t] ??= { created: 0, updated: 0 })[k]++);
const must = (res, what) => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
};

// ---- helpers ---------------------------------------------------------------
function lisbonOffsetMin(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUtc - date.getTime()) / 60000);
}
// 10:00 Lisbon wall time, `days` from today (Lisbon date).
function lisbonTenAm(days) {
  const now = new Date();
  const lis = new Date(now.getTime() + lisbonOffsetMin(now) * 60000);
  const guess = Date.UTC(lis.getUTCFullYear(), lis.getUTCMonth(), lis.getUTCDate() + days, 10, 0, 0);
  const off = lisbonOffsetMin(new Date(guess));
  return new Date(guess - off * 60000);
}

const weekly = (days, slots) => Object.fromEntries(days.map((d) => [d, slots]));
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const rules = (w) => ({ weekly: w, timezone: TZ, overrides: {}, bufferMinutes: 15 });

const ACCOUNTS = {
  client: { email: "demo-client@example.com", name: "Alex Morgan", role: "client" },
  admin: { email: "demo-admin@example.com", name: "Sam Rivera", role: "admin" },
};
const PROS = [
  {
    email: "demo-pro@example.com", name: "Dr. Ana Ribeiro",
    bio: "I am a licensed clinical psychologist working mainly with adults dealing with anxiety and stress. My sessions are structured and practical, built on cognitive behavioural therapy. I work in English and Portuguese.",
    credentials: ["Licensed Psychologist", "PhD Clinical Psychology"],
    modalities: ["CBT", "Anxiety and stress"],
    price: 8000, duration: 50,
    availability: rules({
      ...weekly(["monday", "tuesday", "wednesday", "thursday"], ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]),
      friday: ["09:00", "10:00", "11:00"],
    }),
    types: [
      { name: "Free intro call", description: "A short call to talk about what you need and see if we are a good fit.", duration_min: 20, price_cents: 0 },
      { name: "Therapy session", description: "A 50-minute individual session.", duration_min: 50, price_cents: 8000 },
      { name: "Package of 5 sessions", description: "Five 50-minute sessions at a reduced price.", duration_min: 50, price_cents: 36000, is_bundle: true, bundle_sessions: 5 },
    ],
  },
  {
    email: "demo-pro2@example.com", name: "Tom Keller",
    bio: "I am an ICF-certified career coach. I help people prepare for job changes, promotions and interviews with clear goals and concrete next steps.",
    credentials: ["ICF-certified coach"],
    modalities: ["Career coaching", "Interview preparation"],
    price: 6500, duration: 45,
    availability: rules(weekly(WEEKDAYS, ["10:00", "11:00", "13:00", "14:00", "15:00"])),
    types: [
      { name: "Free intro call", description: "A 20-minute call to understand your goals.", duration_min: 20, price_cents: 0 },
      { name: "Coaching session", description: "A 45-minute one-to-one coaching session.", duration_min: 45, price_cents: 6500 },
      { name: "Interview preparation", description: "A mock interview with detailed feedback.", duration_min: 60, price_cents: 8500 },
    ],
  },
  {
    email: "demo-pro3@example.com", name: "Marta Silva",
    bio: "I am a certified teacher of Portuguese and English for adult learners. Lessons are conversation-based and adapted to your level and goals, including exam preparation.",
    credentials: ["Certified teacher"],
    modalities: ["Language teaching", "Exam preparation"],
    price: 3500, duration: 60,
    availability: rules(weekly(["monday", "tuesday", "wednesday", "thursday", "friday"], ["09:00", "10:00", "17:00", "18:00", "19:00"])),
    types: [
      { name: "Free trial lesson", description: "A 20-minute trial to assess your level.", duration_min: 20, price_cents: 0 },
      { name: "Language lesson", description: "A 60-minute one-to-one lesson.", duration_min: 60, price_cents: 3500 },
      { name: "Package of 10 lessons", description: "Ten 60-minute lessons at a reduced price.", duration_min: 60, price_cents: 31500, is_bundle: true, bundle_sessions: 10 },
    ],
  },
];

// ---- accounts ---------------------------------------------------------------
async function findAuthUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser({ email, name, role }) {
  let user = await findAuthUserByEmail(email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email, email_confirm: true, password: randomBytes(24).toString("base64url"),
      user_metadata: { name, role },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = data.user;
    bump("auth.users", "created");
  } else bump("auth.users", "updated");
  const { data: existing } = await db.from("users").select("id").eq("id", user.id).maybeSingle();
  must(
    await db.from("users").upsert(
      { id: user.id, email, name, role, country: "PT", setup_completed: true },
      { onConflict: "id" }
    ),
    `upsert users ${email}`
  );
  bump("users", existing ? "updated" : "created");
  return user.id;
}

async function ensureProfile(id, p) {
  const { data: existing } = await db.from("therapist_profile").select("id").eq("user_id", id).maybeSingle();
  must(
    await db.from("therapist_profile").upsert(
      {
        user_id: id, bio: p.bio, credentials: p.credentials, modalities: p.modalities,
        session_price_cents: p.price, default_session_duration: p.duration,
        free_first_session: false, availability_rules: p.availability,
        timezone: TZ, status: "active", video_provider: "daily",
      },
      { onConflict: "user_id" }
    ),
    `upsert therapist_profile ${p.email}`
  );
  bump("therapist_profile", existing ? "updated" : "created");
}

async function ensureSessionTypes(id, types) {
  const out = {};
  for (const t of types) {
    const row = { currency: "EUR", is_active: true, is_bundle: false, bundle_sessions: null, ...t, therapist_id: id };
    const { data: ex } = await db.from("session_types").select("id").eq("therapist_id", id).eq("name", t.name).maybeSingle();
    if (ex) {
      must(await db.from("session_types").update(row).eq("id", ex.id), "update session_types");
      bump("session_types", "updated");
      out[t.name] = ex.id;
    } else {
      const d = must(await db.from("session_types").insert(row).select("id").single(), "insert session_types");
      bump("session_types", "created");
      out[t.name] = d.id;
    }
  }
  return out;
}

// ---- activity ---------------------------------------------------------------
async function seedActivity(clientId, anaId, typeIds) {
  const main = typeIds["Therapy session"];
  const plan = [
    { key: "demo_pi_past2", days: -12, status: "completed" },
    { key: "demo_pi_past1", days: -5, status: "completed" },
    { key: "demo_pi_up1", days: 2, status: "confirmed" },
    { key: "demo_pi_up2", days: 9, status: "confirmed" },
  ];
  const sessionIds = {};
  for (const s of plan) {
    const row = {
      client_id: clientId, therapist_id: anaId, session_type_id: main,
      scheduled_at: lisbonTenAm(s.days).toISOString(), duration_min: 50,
      status: s.status, payment_status: "paid", currency: "eur", amount_paid_cents: 8000,
      stripe_checkout_id: `demo_cs_${s.key.slice(8)}`, stripe_payment_intent_id: s.key,
      daily_room_url: `https://demo.invalid/room/${s.key}`,
    };
    const { data: ex } = await db.from("sessions").select("id").eq("stripe_payment_intent_id", s.key).maybeSingle();
    if (ex) {
      must(await db.from("sessions").update(row).eq("id", ex.id), "update sessions");
      bump("sessions", "updated");
      sessionIds[s.key] = ex.id;
    } else {
      const d = must(await db.from("sessions").insert(row).select("id").single(), "insert sessions");
      bump("sessions", "created");
      sessionIds[s.key] = d.id;
    }
    const pay = {
      client_id: clientId, therapist_id: anaId, session_id: sessionIds[s.key],
      amount_cents: 8000, currency: "EUR", method: "stripe", status: "confirmed",
      stripe_payment_intent_id: s.key, platform_fee_cents: 800, therapist_net_cents: 7200,
    };
    const { data: px } = await db.from("payments").select("id").eq("session_id", sessionIds[s.key]).maybeSingle();
    if (px) { must(await db.from("payments").update(pay).eq("id", px.id), "update payments"); bump("payments", "updated"); }
    else { must(await db.from("payments").insert(pay), "insert payments"); bump("payments", "created"); }
  }

  // reviews on the two completed sessions
  const reviews = [
    { key: "demo_pi_past2", rating: 5, body: "Ana explained the approach clearly and gave me practical exercises I could use the same week. I felt listened to." },
    { key: "demo_pi_past1", rating: 5, body: "Very structured and calm. We reviewed my progress and set a clear plan for the next sessions." },
  ];
  for (const r of reviews) {
    const row = { therapist_id: anaId, client_id: clientId, session_id: sessionIds[r.key], rating: r.rating, body: r.body };
    const { data: ex } = await db.from("reviews").select("id").eq("session_id", row.session_id).maybeSingle();
    if (ex) { must(await db.from("reviews").update(row).eq("id", ex.id), "update reviews"); bump("reviews", "updated"); }
    else { must(await db.from("reviews").insert(row), "insert reviews"); bump("reviews", "created"); }
  }

  // credits: a 5-session package, 2 used
  const credit = {
    client_id: clientId, therapist_id: anaId, total_credits: 5, used_credits: 2,
    session_type_id: typeIds["Package of 5 sessions"], stripe_payment_intent_id: "demo_pi_credits",
    expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
  };
  const { data: cx } = await db.from("session_credits").select("id").eq("stripe_payment_intent_id", "demo_pi_credits").maybeSingle();
  if (cx) { must(await db.from("session_credits").update(credit).eq("id", cx.id), "update credits"); bump("session_credits", "updated"); }
  else { must(await db.from("session_credits").insert(credit), "insert credits"); bump("session_credits", "created"); }

  // conversation + messages
  let conv = (await db.from("conversations").select("id").eq("therapist_id", anaId).eq("client_id", clientId).maybeSingle()).data;
  if (!conv) {
    conv = must(await db.from("conversations").insert({ therapist_id: anaId, client_id: clientId }).select("id").single(), "insert conversation");
    bump("conversations", "created");
  } else bump("conversations", "updated");
  const base = Date.now() - 3 * 86400000;
  const msgs = [
    [clientId, "Hi Ana, thank you for last week. I tried the thought record you suggested and it helped a bit."],
    [anaId, "Glad to hear it, Alex. Bring a few of your entries to our next session and we will go through them together."],
    [clientId, "Will do. Could we move the focus to work meetings next time? That is where the stress peaks."],
    [anaId, "Yes, absolutely. I will prepare a short exercise for that. See you on the 10:00 slot."],
  ];
  let last;
  for (let i = 0; i < msgs.length; i++) {
    const [sender, content] = msgs[i];
    last = new Date(base + i * 3600000).toISOString();
    const { data: ex } = await db.from("messages").select("id").eq("conversation_id", conv.id).eq("content", content).maybeSingle();
    if (ex) { bump("messages", "updated"); continue; }
    must(await db.from("messages").insert({ conversation_id: conv.id, sender_id: sender, content, sent_at: last, read_at: last }), "insert message");
    bump("messages", "created");
  }
  must(await db.from("conversations").update({ last_message_at: last }).eq("id", conv.id), "update conversation");
}

// ---- main ---------------------------------------------------------------------
const clientId = await ensureUser(ACCOUNTS.client);
await ensureUser(ACCOUNTS.admin);
const proIds = [];
for (const p of PROS) {
  const id = await ensureUser({ email: p.email, name: p.name, role: "therapist" });
  proIds.push(id);
  await ensureProfile(id, p);
  p.typeIds = await ensureSessionTypes(id, p.types);
}
await seedActivity(clientId, proIds[0], PROS[0].typeIds);

console.log("Seed summary (created/updated):");
for (const [t, c] of Object.entries(counts)) console.log(`  ${t}: ${c.created}/${c.updated}`);
