import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { services, specialists, clients, agenda, generate_charges, email_uid_map } = await req.json();
    const results: any = { services: 0, specialists: 0, specialist_hours: 0, specialist_services: 0, clients: 0, appointments: 0, charges: 0, calendar_blocks: 0, errors: [], matched_specialists: 0 };

    // Build custom email→UID map from user input (overrides hardcoded emailMap)
    const customEmailUidMap = new Map<string, string>();
    if (email_uid_map && typeof email_uid_map === "object") {
      for (const [email, uid] of Object.entries(email_uid_map)) {
        customEmailUidMap.set(email.toLowerCase().trim(), uid as string);
      }
    }

    // ═══════════════════ 1. IMPORT SERVICES ═══════════════════
    if (services?.data) {
      const bukIdToUuid = new Map<number, string>();

      const sorted = [...services.data].sort((a: any, b: any) => {
        if (a.category && !b.category) return -1;
        if (!a.category && b.category) return 1;
        return 0;
      });

      let displayOrder = 0;
      for (const svc of sorted) {
        // Skip category rows - categories are now in service_categories table
        if (svc.category === true) {
          displayOrder++;
          continue;
        }
        const row: any = {
          name: svc.name,
          duration_minutes: svc.duration || null,
          price: svc.price || 0,
          color: svc.color || "#3B82F6",
          currency: svc.currency || "EUR",
          show_on_booking_page: svc.showOnBookingPage ?? true,
          show_price_on_booking_page: svc.showPriceOnBookingPage ?? true,
          vat_rate: svc.vatRate ?? 0,
          description: svc.description || null,
          display_order: displayOrder++,
          active: true,
        };

        const { data: inserted, error } = await adminClient
          .from("services")
          .insert(row)
          .select("id")
          .single();

        if (error) {
          results.errors.push(`Service "${svc.name}": ${error.message}`);
        } else {
          bukIdToUuid.set(svc.id, inserted.id);
          results.services++;
        }
      }

      (results as any)._bukIdMap = Object.fromEntries(bukIdToUuid);
    }

    const bukIdMap = new Map<number, string>(
      Object.entries((results as any)._bukIdMap || {}).map(([k, v]) => [Number(k), v as string])
    );

    // ═══════════════════ 2. IMPORT SPECIALISTS ═══════════════════
    // Pre-load existing profiles and auth users for matching
    const { data: existingProfiles } = await adminClient.from("profiles").select("user_id, full_name");
    const profileNameMap = new Map<string, string>();
    if (existingProfiles) {
      for (const p of existingProfiles) {
        if (p.full_name) profileNameMap.set(p.full_name.toLowerCase().trim(), p.user_id);
      }
    }

    // Build email → user_id map from auth users
    const emailToUserId = new Map<string, string>();
    const { data: authListData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (authListData?.users) {
      for (const u of authListData.users) {
        if (u.email) emailToUserId.set(u.email.toLowerCase().trim(), u.id);
      }
    }

    if (specialists?.data) {
      for (const spec of specialists.data) {
        const specName = spec.name?.trim() || "";

        // Try to resolve UID from custom email→UID map first, then by slug-based email
        let userId: string | null = null;
        let matched = false;

        // 1. Match by custom email→UID map (user-provided)
        if (spec.email) {
          const mappedUid = customEmailUidMap.get(spec.email.toLowerCase().trim());
          if (mappedUid) {
            userId = mappedUid;
            matched = true;
          }
        }
        // Also try slug-based email in custom map
        if (!userId) {
          const slugEmail = `${spec.slug}@clinic.local`.toLowerCase();
          const mappedUid = customEmailUidMap.get(slugEmail);
          if (mappedUid) {
            userId = mappedUid;
            matched = true;
          }
        }

        // 2. Match by email in existing auth users
        if (!userId) {
          const email = spec.email || `${spec.slug}@clinic.local`;
          const existingByEmail = emailToUserId.get(email.toLowerCase().trim());
          if (existingByEmail) {
            userId = existingByEmail;
            matched = true;
          }
        }

        // 3. Match by name
        if (!userId && specName) {
          const nameLower = specName.toLowerCase().trim();
          for (const [profileName, profileUserId] of profileNameMap.entries()) {
            if (profileName === nameLower || profileName.includes(nameLower) || nameLower.includes(profileName)) {
              userId = profileUserId;
              matched = true;
              break;
            }
          }
        }

        // 4. Create new user if no match
        if (!userId) {
          const email = spec.email || `${spec.slug}@clinic.local`;
          const password = crypto.randomUUID().slice(0, 12) + "A1!";
          const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: specName },
          });

          if (authError) {
            results.errors.push(`Specialist "${specName}": ${authError.message}`);
            continue;
          }

          userId = authUser.user.id;

          // Upsert profile
          await adminClient.from("profiles").upsert({
            user_id: userId,
            full_name: specName,
            avatar_url: spec.profileImage || null,
          }, { onConflict: "user_id" });

          // Set role
          await adminClient.from("user_roles").insert({
            user_id: userId,
            role: "especialista",
          });

          results.specialists++;
        } else {
          results.matched_specialists++;
        }

        // Import workplan → specialist_hours (clear existing first for matched users)
        if (matched) {
          await adminClient.from("specialist_hours").delete().eq("specialist_id", userId);
          await adminClient.from("specialist_services").delete().eq("specialist_id", userId);
        }

        if (spec.workplan) {
          for (const [dayKey, intervals] of Object.entries(spec.workplan)) {
            if (!intervals || !Array.isArray(intervals)) continue;
            const weekday = WEEKDAY_MAP[dayKey];
            if (weekday === undefined) continue;

            for (const interval of intervals as any[]) {
              const { error: hErr } = await adminClient.from("specialist_hours").insert({
                specialist_id: userId,
                weekday,
                start_time: interval.start,
                end_time: interval.end,
              });
              if (hErr) {
                results.errors.push(`Hours ${specName}/${dayKey}: ${hErr.message}`);
              } else {
                results.specialist_hours++;
              }
            }
          }
        }

        // Import services → specialist_services
        if (spec.services) {
          for (const specSvc of spec.services) {
            const serviceUuid = bukIdMap.get(specSvc.id);
            if (!serviceUuid) continue;

            const globalSvc = services?.data?.find((s: any) => s.id === specSvc.id);
            const customDuration = globalSvc && specSvc.duration !== globalSvc.duration
              ? specSvc.duration
              : null;

            const { error: ssErr } = await adminClient.from("specialist_services").insert({
              specialist_id: userId,
              service_id: serviceUuid,
              custom_duration_minutes: customDuration,
            });
            if (ssErr) {
              results.errors.push(`SpecSvc ${specName}/${specSvc.name}: ${ssErr.message}`);
            } else {
              results.specialist_services++;
            }
          }
        }
      }
    }

    // ═══════════════════ 3. IMPORT CLIENTS ═══════════════════
    if (clients?.data) {
      const clientRows = clients.data.map((c: any) => ({
        full_name: [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Sem nome",
        email: c.email || null,
        phone: c.phoneNumber || null,
        birth_date: c.dob || null,
        notes: c.notes || null,
        created_at: c.createdAt || new Date().toISOString(),
      }));

      for (let i = 0; i < clientRows.length; i += 100) {
        const batch = clientRows.slice(i, i + 100);
        const { error: cErr, data: inserted } = await adminClient
          .from("clients")
          .insert(batch)
          .select("id");

        if (cErr) {
          results.errors.push(`Clients batch ${i}: ${cErr.message}`);
        } else {
          results.clients += inserted?.length ?? 0;
        }
      }
    }

    // ═══════════════════ 4. IMPORT APPOINTMENTS (AGENDA) ═══════════════════
    if (agenda?.data) {
      const { data: allServices } = await adminClient.from("services").select("id, name, price");
      const serviceMap = new Map<string, string>();
      if (allServices) {
        for (const svc of allServices) {
          serviceMap.set(svc.name.toLowerCase().trim(), svc.id);
        }
      }

      let allClients: any[] = [];
      let clientPage = 0;
      while (true) {
        const { data: batch } = await adminClient.from("clients").select("id, phone, full_name").range(clientPage * 1000, (clientPage + 1) * 1000 - 1);
        if (!batch || batch.length === 0) break;
        allClients = allClients.concat(batch);
        if (batch.length < 1000) break;
        clientPage++;
      }
      const clientPhoneMap = new Map<string, string>();
      const clientNameMap = new Map<string, string>();
      for (const cli of allClients) {
        if (cli.phone) clientPhoneMap.set(cli.phone.toLowerCase().trim(), cli.id);
        if (cli.full_name) clientNameMap.set(cli.full_name.toLowerCase().trim(), cli.id);
      }

      const { data: allProfiles } = await adminClient.from("profiles").select("user_id, full_name");
      const specialistMap = new Map<string, string>();
      if (allProfiles) {
        for (const prof of allProfiles) {
          if (!prof.full_name) continue;
          const name = prof.full_name.toLowerCase().trim();
          // Create slug-like key and also map by name
          const slug = name.replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          specialistMap.set(slug, prof.user_id);
          specialistMap.set(name, prof.user_id);
        }
      }

      let existingAppts: any[] = [];
      let apptPage = 0;
      while (true) {
        const { data: batch } = await adminClient.from("appointments").select("client_id, start_time").range(apptPage * 1000, (apptPage + 1) * 1000 - 1);
        if (!batch || batch.length === 0) break;
        existingAppts = existingAppts.concat(batch);
        if (batch.length < 1000) break;
        apptPage++;
      }
      const existingSet = new Set(existingAppts.map((a: any) => `${a.client_id}|${a.start_time}`));
      let skippedDuplicates = 0;

      const apptRows: any[] = [];
      const blockRows: any[] = [];

      for (const day of agenda.data) {
        if (!day.events || day.events.length === 0) continue;

        for (const evt of day.events) {
          // ── Import holidays as calendar_blocks ──
          if (evt.type === "holiday") {
            const hol = evt.data;
            // Resolve specialist from store.slug or store.name
            const storeSlug = hol.store?.slug?.toLowerCase().trim();
            const storeName = hol.store?.name?.toLowerCase().trim();
            let blockSpecId = storeSlug ? specialistMap.get(storeSlug) : null;
            if (!blockSpecId && storeName) blockSpecId = specialistMap.get(storeName) || null;

            if (blockSpecId) {
              // Convert "2026-03-25 09:00" to ISO
              const startDt = hol.dateInitISO8601 || (hol.dateInit ? hol.dateInit.replace(" ", "T") + ":00" : null);
              const endDt = hol.dateEndISO8601 || (hol.dateEnd ? hol.dateEnd.replace(" ", "T") + ":00" : null);
              if (startDt && endDt) {
                blockRows.push({
                  specialist_id: blockSpecId,
                  start_datetime: startDt,
                  end_datetime: endDt,
                  reason: hol.reason || null,
                });
              }
            } else {
              results.errors.push(`Block ${hol.id}: Especialista "${hol.store?.name}" não encontrado`);
            }
            continue;
          }

          if (evt.type !== "booking") continue;
          const booking = evt.data;

          const serviceName = booking.service?.name?.toLowerCase().trim();
          const serviceId = serviceName ? serviceMap.get(serviceName) : null;
          if (!serviceId) {
            results.errors.push(`Appointment ${booking.id}: Serviço "${booking.service?.name}" não encontrado`);
            continue;
          }

          const clientPhone = booking.client?.phoneNumber?.toLowerCase().trim();
          const clientFullName = [booking.client?.firstName, booking.client?.lastName]
            .filter(Boolean).join(" ").toLowerCase().trim();
          let clientId = clientPhone ? clientPhoneMap.get(clientPhone) : null;
          if (!clientId && clientFullName) clientId = clientNameMap.get(clientFullName);
          if (!clientId) {
            results.errors.push(`Appointment ${booking.id}: Cliente "${booking.client?.firstName} ${booking.client?.lastName}" não encontrado`);
            continue;
          }

          const dupKey = `${clientId}|${booking.dateInitISO8601}`;
          if (existingSet.has(dupKey)) {
            skippedDuplicates++;
            continue;
          }
          existingSet.add(dupKey);

          const providerSlug = booking.provider?.slug?.toLowerCase().trim();
          const providerName = booking.provider?.name?.toLowerCase().trim();
          let specialistId = providerSlug ? specialistMap.get(providerSlug) : null;
          if (!specialistId && providerName) specialistId = specialistMap.get(providerName) || null;

          let status = "agendado";
          if (booking.noshow) {
            status = "faltou";
          } else if (booking.status === "cancelled") {
            status = "cancelado";
           } else if (booking.status === "completed") {
            status = "realizado";
          } else {
            const startDate = new Date(booking.dateInitISO8601);
            status = startDate < new Date() ? "realizado" : "agendado";
          }

          apptRows.push({
            client_id: clientId,
            service_id: serviceId,
            specialist_id: specialistId || null,
            start_time: booking.dateInitISO8601,
            end_time: booking.dateEndISO8601,
            status,
            notes: booking.notes || null,
            created_at: booking.createdAt || new Date().toISOString(),
          });
        }
      }

      // Build a service price map for charge generation
      const servicePriceMap = new Map<string, number>();
      if (allServices) {
        for (const svc of allServices) {
          servicePriceMap.set(svc.id, (svc as any).price ?? 0);
        }
      }

      // Re-fetch services with price if not already included
      if (generate_charges && servicePriceMap.size === 0) {
        const { data: svcPrices } = await adminClient.from("services").select("id, price");
        if (svcPrices) {
          for (const s of svcPrices) {
            servicePriceMap.set(s.id, s.price ?? 0);
          }
        }
      }

      const chargeRows: any[] = [];

      for (let i = 0; i < apptRows.length; i += 50) {
        const batch = apptRows.slice(i, i + 50);
        const { error: batchErr, data: inserted } = await adminClient
          .from("appointments")
          .insert(batch)
          .select("id, client_id, service_id, start_time, status");

        if (batchErr) {
          results.errors.push(`Appointments batch ${i}: ${batchErr.message}`);
        } else {
          results.appointments += inserted?.length ?? 0;

          // Collect charge rows for realized appointments before current date
          if (generate_charges && inserted) {
            const now = new Date();
            for (const appt of inserted) {
              if (appt.status === "realizado" && new Date(appt.start_time) < now) {
                const price = appt.service_id ? servicePriceMap.get(appt.service_id) ?? 0 : 0;
                if (price > 0) {
                  const startDate = appt.start_time.split("T")[0]; // extract date for due_date
                  chargeRows.push({
                    client_id: appt.client_id,
                    appointment_id: appt.id,
                    amount: price,
                    status: "pago",
                    paid_at: appt.start_time,
                    due_date: startDate,
                    created_at: appt.start_time,
                    created_by: caller.id,
                  });
                }
              }
            }
          }
        }
      }

      // Insert charges in batches
      if (chargeRows.length > 0) {
        for (let i = 0; i < chargeRows.length; i += 50) {
          const batch = chargeRows.slice(i, i + 50);
          const { error: chErr, data: chInserted } = await adminClient
            .from("charges")
            .insert(batch)
            .select("id");
          if (chErr) {
            results.errors.push(`Charges batch ${i}: ${chErr.message}`);
          } else {
            results.charges += chInserted?.length ?? 0;
          }
        }
      }

      results.skipped_duplicates = skippedDuplicates;

      // ── Insert calendar blocks (holidays) ──
      if (blockRows.length > 0) {
        for (let i = 0; i < blockRows.length; i += 50) {
          const batch = blockRows.slice(i, i + 50);
          const { error: blkErr, data: blkInserted } = await adminClient
            .from("calendar_blocks")
            .insert(batch)
            .select("id");
          if (blkErr) {
            results.errors.push(`Blocks batch ${i}: ${blkErr.message}`);
          } else {
            results.calendar_blocks += blkInserted?.length ?? 0;
          }
        }
      }
    }

    delete (results as any)._bukIdMap;

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
