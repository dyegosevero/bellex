/**
 * Bellex — Demo Seed Script
 * Usage: SUPABASE_SERVICE_KEY=<key> npx tsx scripts/seed-demo.ts
 *
 * Creates:
 *  - 2 especialistas (auth users + profiles + user_roles)
 *  - 1 categoria de serviços
 *  - 8 serviços de estética
 *  - 25 clientes
 *  - 150 agendamentos (últimos 90 dias + próximos 30)
 *  - cobranças vinculadas aos agendamentos realizados
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://jrvkdekyupcxzbxtlnwu.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SERVICE_KEY) {
  console.error("❌  Defina SUPABASE_SERVICE_KEY=<service_role_key> antes de rodar.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysAhead(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function toISO(d: Date) {
  return d.toISOString();
}
function setHour(d: Date, h: number, m = 0): Date {
  const r = new Date(d);
  r.setHours(h, m, 0, 0);
  return r;
}

// ── Data ──────────────────────────────────────────────────────────────────

const SPECIALISTS = [
  { name: "Dra. Ana Lima", email: "ana.lima@bellex.demo", password: "Demo@1234", color: "#f5c5b8" },
  { name: "Bianca Santos", email: "bianca.santos@bellex.demo", password: "Demo@1234", color: "#b8d4f5" },
];

const SERVICES_DATA = [
  { name: "Limpeza de Pele", price: 180, duration: 60, color: "#f5c5b8" },
  { name: "Peeling Químico", price: 250, duration: 50, color: "#f5d9b8" },
  { name: "Botox Preventivo", price: 650, duration: 45, color: "#e2b8f5" },
  { name: "Design de Sobrancelha", price: 90, duration: 30, color: "#b8e8f5" },
  { name: "Tratamento Facial Profundo", price: 320, duration: 90, color: "#b8f5c5" },
  { name: "Massagem Relaxante", price: 120, duration: 60, color: "#f5f0b8" },
  { name: "Microagulhamento", price: 380, duration: 75, color: "#f5b8d9" },
  { name: "Preenchimento Labial", price: 750, duration: 40, color: "#d9b8f5" },
];

const CLIENT_NAMES = [
  "Camila Ferreira", "Juliana Martins", "Fernanda Rocha", "Patricia Lima",
  "Andrea Costa", "Renata Barbosa", "Mariana Silva", "Luciana Pereira",
  "Cristiane Alves", "Daniela Santos", "Beatriz Oliveira", "Tatiana Mendes",
  "Claudia Ribeiro", "Carla Nascimento", "Simone Souza", "Adriana Torres",
  "Vanessa Cardoso", "Priscila Gomes", "Aline Rodrigues", "Fabiana Freitas",
  "Monica Araujo", "Katia Vieira", "Eliane Moreira", "Sandra Castro",
  "Rosana Ferreira",
];

const CLIENT_PHONES = [
  "+5511999990001", "+5511999990002", "+5511999990003", "+5511999990004",
  "+5511999990005", "+5511999990006", "+5511999990007", "+5511999990008",
  "+5511999990009", "+5511999990010", "+5511999990011", "+5511999990012",
  "+5511999990013", "+5511999990014", "+5511999990015", "+5511999990016",
  "+5511999990017", "+5511999990018", "+5511999990019", "+5511999990020",
  "+5511999990021", "+5511999990022", "+5511999990023", "+5511999990024",
  "+5511999990025",
];

const STATUSES_PAST = ["realizado", "realizado", "realizado", "realizado", "cancelado", "realizado", "concluido", "realizado"];
const STATUSES_FUTURE = ["agendado", "agendado", "agendado", "agendado"];
const HOURS = [8, 9, 10, 11, 14, 15, 16, 17];

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Iniciando seed de dados demo...\n");

  // 1. Categoria de serviços
  console.log("📂  Criando categoria de serviços...");
  const { data: catData, error: catErr } = await supabase
    .from("service_categories")
    .insert({ name: "Estética e Beleza" })
    .select("id")
    .single();
  if (catErr) {
    // pode já existir
    console.log("  ⚠️  Categoria já existe ou erro:", catErr.message);
  }
  const categoryId = catData?.id ?? null;

  // 2. Serviços
  console.log("✨  Criando serviços...");
  const { data: services, error: svcErr } = await supabase
    .from("services")
    .insert(
      SERVICES_DATA.map((s) => ({
        name: s.name,
        price: s.price,
        duration_minutes: s.duration,
        color: s.color,
        currency: "BRL",
        active: true,
        show_on_booking_page: true,
        show_price_on_booking_page: true,
        category_id: categoryId,
      }))
    )
    .select("id, name, price, duration_minutes");
  if (svcErr) {
    console.error("❌  Erro ao criar serviços:", svcErr.message);
    process.exit(1);
  }
  console.log(`  ✅  ${services!.length} serviços criados`);

  // 3. Especialistas
  console.log("\n👩‍⚕️  Criando especialistas...");
  const specialistIds: string[] = [];

  for (const spec of SPECIALISTS) {
    // Criar usuário auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.name },
    });

    if (authErr) {
      console.log(`  ⚠️  Usuário ${spec.email} já existe ou erro: ${authErr.message}`);
      // Tentar buscar o user existente
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email === spec.email);
      if (found) {
        specialistIds.push(found.id);
        console.log(`  ✅  Usando usuário existente: ${spec.name} (${found.id})`);
      }
      continue;
    }

    const userId = authData.user.id;
    specialistIds.push(userId);

    // Profile
    await supabase.from("profiles").upsert({
      user_id: userId,
      full_name: spec.name,
    });

    // Role: especialista
    await supabase.from("user_roles").upsert({
      user_id: userId,
      role: "especialista",
    });

    console.log(`  ✅  ${spec.name} (${userId})`);
  }

  if (specialistIds.length === 0) {
    console.error("❌  Nenhum especialista disponível. Abortando.");
    process.exit(1);
  }

  // Link specialists to all services
  const specServiceLinks = specialistIds.flatMap((sid) =>
    services!.map((svc) => ({ specialist_id: sid, service_id: svc.id }))
  );
  await supabase.from("specialist_services").insert(specServiceLinks).select();

  // 4. Clientes
  console.log("\n👥  Criando 25 clientes...");
  const skinTypes = ["Normal", "Seca", "Oleosa", "Mista", "Sensível"];
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .insert(
      CLIENT_NAMES.map((name, i) => ({
        full_name: name,
        email: `${name.toLowerCase().replace(/\s+/g, ".").replace(/[áàâã]/g, "a").replace(/[éê]/g, "e").replace(/[íi]/g, "i").replace(/[óô]/g, "o").replace(/[ú]/g, "u")}@email.demo`,
        phone: CLIENT_PHONES[i],
        birth_date: `${randInt(1975, 2000)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
        skin_type: rand(skinTypes),
        consent_given: true,
        opt_in: Math.random() > 0.3,
        notes: Math.random() > 0.6 ? rand(["Cliente VIP", "Alérgica a parabenos", "Prefere atendimento com Bianca", "Retorno a cada 30 dias"]) : null,
      }))
    )
    .select("id, full_name");
  if (clientErr) {
    console.error("❌  Erro ao criar clientes:", clientErr.message);
    process.exit(1);
  }
  console.log(`  ✅  ${clients!.length} clientes criados`);

  // 5. Agendamentos (150)
  console.log("\n📅  Criando 150 agendamentos...");
  const appointments: any[] = [];

  // 120 no passado (últimos 90 dias)
  for (let i = 0; i < 120; i++) {
    const daysBack = randInt(1, 90);
    const date = daysAgo(daysBack);
    const hour = rand(HOURS);
    const svc = rand(services!);
    const client = rand(clients!);
    const specialistId = rand(specialistIds);
    const status = rand(STATUSES_PAST);

    const startTime = setHour(date, hour);
    const endTime = new Date(startTime.getTime() + svc.duration_minutes * 60000);

    appointments.push({
      client_id: client.id,
      specialist_id: specialistId,
      service_id: svc.id,
      start_time: toISO(startTime),
      end_time: toISO(endTime),
      status,
      notes: Math.random() > 0.7 ? rand(["Cliente satisfeita", "Retorno agendado", "Pele sensível", "Primeira sessão"]) : null,
    });
  }

  // 30 no futuro (próximos 30 dias)
  for (let i = 0; i < 30; i++) {
    const daysForward = randInt(1, 30);
    const date = daysAhead(daysForward);
    const hour = rand(HOURS);
    const svc = rand(services!);
    const client = rand(clients!);
    const specialistId = rand(specialistIds);

    const startTime = setHour(date, hour);
    const endTime = new Date(startTime.getTime() + svc.duration_minutes * 60000);

    appointments.push({
      client_id: client.id,
      specialist_id: specialistId,
      service_id: svc.id,
      start_time: toISO(startTime),
      end_time: toISO(endTime),
      status: "agendado",
      notes: null,
    });
  }

  // Insert in batches of 50
  let totalAppts = 0;
  for (let i = 0; i < appointments.length; i += 50) {
    const batch = appointments.slice(i, i + 50);
    const { data: apptData, error: apptErr } = await supabase
      .from("appointments")
      .insert(batch)
      .select("id, status, client_id, service_id, start_time");
    if (apptErr) {
      console.error(`  ❌  Erro no batch ${i / 50 + 1}:`, apptErr.message);
    } else {
      totalAppts += apptData!.length;
    }
  }
  console.log(`  ✅  ${totalAppts} agendamentos criados`);

  // 6. Cobranças — apenas para agendamentos realizados/concluídos
  console.log("\n💰  Criando cobranças...");

  // Re-fetch all appointments with status realizado/concluido
  const { data: doneAppts } = await supabase
    .from("appointments")
    .select("id, client_id, service_id, start_time, status")
    .in("status", ["realizado", "concluido"]);

  if (doneAppts && doneAppts.length > 0) {
    const serviceMap = new Map(services!.map((s) => [s.id, s]));
    const payMethods = ["dinheiro", "cartao_credito", "cartao_debito", "pix", "pix"];
    const chargeStatuses = ["pago", "pago", "pago", "pendente", "pago"];

    const charges = doneAppts.map((appt) => {
      const svc = serviceMap.get(appt.service_id);
      const amount = svc?.price ?? 150;
      const isPaid = rand(chargeStatuses) === "pago";
      const apptDate = new Date(appt.start_time);

      return {
        client_id: appt.client_id,
        appointment_id: appt.id,
        amount,
        status: isPaid ? "pago" : "pendente",
        due_date: apptDate.toISOString().split("T")[0],
        paid_at: isPaid ? toISO(apptDate) : null,
        notes: `${svc?.name ?? "Serviço"} — ${rand(payMethods)}`,
      };
    });

    let totalCharges = 0;
    for (let i = 0; i < charges.length; i += 50) {
      const batch = charges.slice(i, i + 50);
      const { data: chargeData, error: chargeErr } = await supabase
        .from("charges")
        .insert(batch)
        .select("id");
      if (chargeErr) {
        console.error(`  ❌  Erro nas cobranças batch ${i / 50 + 1}:`, chargeErr.message);
      } else {
        totalCharges += chargeData!.length;
      }
    }
    console.log(`  ✅  ${totalCharges} cobranças criadas`);
  }

  // ── Summary ──
  const { count: totalClients } = await supabase.from("clients").select("*", { count: "exact", head: true });
  const { count: totalAppointments } = await supabase.from("appointments").select("*", { count: "exact", head: true });
  const { count: totalChargesCount } = await supabase.from("charges").select("*", { count: "exact", head: true });

  console.log("\n✅  SEED CONCLUÍDO");
  console.log("═══════════════════════════════════════════");
  console.log(`  Especialistas:   ${specialistIds.length}`);
  console.log(`  Serviços:        ${services!.length}`);
  console.log(`  Clientes:        ${totalClients}`);
  console.log(`  Agendamentos:    ${totalAppointments}`);
  console.log(`  Cobranças:       ${totalChargesCount}`);
  console.log("═══════════════════════════════════════════");
  console.log("\n  Logins dos especialistas:");
  for (const s of SPECIALISTS) {
    console.log(`  📧  ${s.email}  🔑  ${s.password}`);
  }
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
