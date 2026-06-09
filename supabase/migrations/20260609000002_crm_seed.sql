-- Seed: Mock leads, conversations e messages para demo
-- Usa os stages já criados na migration anterior (busca por label)

DO $$
DECLARE
  stage_novo    UUID;
  stage_quali   UUID;
  stage_prop    UUID;
  stage_fech    UUID;

  lead_ana      UUID;
  lead_beatriz  UUID;
  lead_carla    UUID;
  lead_daniela  UUID;
  lead_eliane   UUID;
  lead_fernanda UUID;
  lead_juliana  UUID;
  lead_patricia UUID;
  lead_mariana  UUID;
  lead_camila   UUID;

  conv_ana      UUID;
  conv_beatriz  UUID;
  conv_carla    UUID;
  conv_daniela  UUID;
  conv_eliane   UUID;
  conv_fernanda UUID;
  conv_juliana  UUID;
  conv_patricia UUID;
  conv_mariana  UUID;
  conv_camila   UUID;
BEGIN
  -- Pega IDs dos stages
  SELECT id INTO stage_novo  FROM public.pipeline_stages WHERE label = 'Novo Lead'    LIMIT 1;
  SELECT id INTO stage_quali FROM public.pipeline_stages WHERE label = 'Qualificando' LIMIT 1;
  SELECT id INTO stage_prop  FROM public.pipeline_stages WHERE label = 'Proposta'     LIMIT 1;
  SELECT id INTO stage_fech  FROM public.pipeline_stages WHERE label = 'Fechado'      LIMIT 1;

  IF stage_novo IS NULL THEN RAISE NOTICE 'Stages não encontrados, abortando seed.'; RETURN; END IF;

  -- Limpa seed anterior (idempotente)
  DELETE FROM public.leads WHERE source IN ('whatsapp','instagram') AND name IN (
    'Ana Paula','Beatriz Souza','Carla Mendes','Daniela Costa','Eliane Moreira',
    'Fernanda Lima','Juliana Pires','Patricia Lima','Mariana Vieira','Camila Ferreira'
  );

  -- ── Novo Lead ──────────────────────────────────────────────
  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Ana Paula',      '(11) 98888-1234', 'whatsapp',  stage_novo, 'Oi, quero saber sobre depilação a laser...')
  RETURNING id INTO lead_ana;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Beatriz Souza',  '(21) 97777-5678', 'whatsapp',  stage_novo, 'Vocês têm horário na sexta à tarde?')
  RETURNING id INTO lead_beatriz;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Fernanda Lima',  '(11) 91234-5678', 'instagram', stage_novo, 'Vi o post sobre promoção de limpeza de pele!')
  RETURNING id INTO lead_fernanda;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Juliana Pires',  '(21) 99876-5432', 'whatsapp',  stage_novo, 'Quanto custa o pacote de 6 sessões?')
  RETURNING id INTO lead_juliana;

  -- ── Qualificando ────────────────────────────────────────────
  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Carla Mendes',   '(31) 96666-9012', 'instagram', stage_quali, 'Tenho interesse em harmonização facial...')
  RETURNING id INTO lead_carla;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Patricia Lima',  '(11) 97654-3210', 'whatsapp',  stage_quali, 'Quero mais info sobre botox preventivo')
  RETURNING id INTO lead_patricia;

  -- ── Proposta ────────────────────────────────────────────────
  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Daniela Costa',  '(11) 95555-3344', 'whatsapp',  stage_prop, 'Ok, me manda a proposta no WhatsApp')
  RETURNING id INTO lead_daniela;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Mariana Vieira', '(31) 94444-8899', 'instagram', stage_prop, 'Vou pensar e te aviso até amanhã')
  RETURNING id INTO lead_mariana;

  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Camila Ferreira','(11) 93333-1122', 'whatsapp',  stage_prop, 'Quero fechar o pacote completo')
  RETURNING id INTO lead_camila;

  -- ── Fechado ─────────────────────────────────────────────────
  INSERT INTO public.leads (id, name, phone, source, stage_id, last_message)
  VALUES
    (gen_random_uuid(), 'Eliane Moreira', '(21) 94444-5566', 'whatsapp',  stage_fech, 'Fechado! Nos vemos na quinta 🎉')
  RETURNING id INTO lead_eliane;

  -- ── Conversations ────────────────────────────────────────────
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_ana,      'whatsapp',  'open', now() - interval '10 min') RETURNING id INTO conv_ana;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_beatriz,  'whatsapp',  'open', now() - interval '30 min') RETURNING id INTO conv_beatriz;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_fernanda, 'instagram', 'open', now() - interval '1 hour') RETURNING id INTO conv_fernanda;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_juliana,  'whatsapp',  'open', now() - interval '2 hours') RETURNING id INTO conv_juliana;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_carla,    'instagram', 'open', now() - interval '1 day') RETURNING id INTO conv_carla;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_patricia, 'whatsapp',  'open', now() - interval '1 day') RETURNING id INTO conv_patricia;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_daniela,  'whatsapp',  'open', now() - interval '3 days') RETURNING id INTO conv_daniela;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_mariana,  'instagram', 'open', now() - interval '3 days') RETURNING id INTO conv_mariana;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_camila,   'whatsapp',  'open', now() - interval '4 days') RETURNING id INTO conv_camila;
  INSERT INTO public.conversations (id, lead_id, channel, status, last_message_at)
  VALUES
    (gen_random_uuid(), lead_eliane,   'whatsapp',  'resolved', now() - interval '5 days') RETURNING id INTO conv_eliane;

  -- ── Messages ────────────────────────────────────────────────
  -- Ana Paula
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_ana, 'Oi, tudo bem?', false, 'delivered', now() - interval '15 min'),
    (conv_ana, 'Tudo ótimo! Como posso ajudar?', true, 'read', now() - interval '13 min'),
    (conv_ana, 'Quero saber sobre depilação a laser, quais regiões vocês fazem?', false, 'delivered', now() - interval '12 min'),
    (conv_ana, 'Fazemos todas as regiões! Pernas, virilha, axilas, rosto... Qual te interessa?', true, 'read', now() - interval '11 min'),
    (conv_ana, 'Oi, quero saber sobre depilação a laser...', false, 'delivered', now() - interval '10 min');

  -- Beatriz Souza
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_beatriz, 'Vocês têm horário na sexta à tarde?', false, 'delivered', now() - interval '32 min'),
    (conv_beatriz, 'Oi Beatriz! Temos sim, às 15h ou 17h. Qual prefere?', true, 'read', now() - interval '30 min');

  -- Fernanda Lima
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_fernanda, 'Vi o post sobre promoção de limpeza de pele!', false, 'delivered', now() - interval '1 hour 5 min'),
    (conv_fernanda, 'Oi Fernanda! A promoção vai até o fim do mês 😊 Quer agendar?', true, 'read', now() - interval '1 hour');

  -- Juliana
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_juliana, 'Olá! Quanto custa o pacote de 6 sessões de laser?', false, 'delivered', now() - interval '2 hours 10 min'),
    (conv_juliana, 'Oi Juliana! O pacote de 6 sessões para pernas completas é R$ 1.800. Tem interesse?', true, 'read', now() - interval '2 hours 5 min'),
    (conv_juliana, 'Quanto custa o pacote de 6 sessões?', false, 'delivered', now() - interval '2 hours');

  -- Carla Mendes
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_carla, 'Tenho interesse em harmonização facial, vocês fazem?', false, 'delivered', now() - interval '1 day 2 hours'),
    (conv_carla, 'Sim! Trabalhamos com harmonização orofacial. Posso agendar uma avaliação gratuita pra você.', true, 'read', now() - interval '1 day 1 hour'),
    (conv_carla, 'Que ótimo! Qual o próximo passo?', false, 'delivered', now() - interval '1 day');

  -- Patricia Lima
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_patricia, 'Quero mais info sobre botox preventivo', false, 'delivered', now() - interval '1 day 30 min'),
    (conv_patricia, 'Oi Patricia! O botox preventivo é indicado a partir dos 25 anos. Você tem interesse em marcar uma avaliação?', true, 'read', now() - interval '1 day');

  -- Daniela Costa
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_daniela, 'Quero fechar o pacote de skincare, qual o preço?', false, 'delivered', now() - interval '3 days 2 hours'),
    (conv_daniela, 'Oi Daniela! O pacote completo inclui 4 sessões por R$ 1.200. Posso te mandar os detalhes?', true, 'read', now() - interval '3 days 1 hour'),
    (conv_daniela, 'Sim! Ok, me manda a proposta no WhatsApp', false, 'delivered', now() - interval '3 days');

  -- Mariana Vieira
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_mariana, 'Gostei da proposta, vou pensar.', false, 'delivered', now() - interval '3 days 3 hours'),
    (conv_mariana, 'Claro! Qualquer dúvida estou aqui 😊', true, 'read', now() - interval '3 days 2 hours'),
    (conv_mariana, 'Vou pensar e te aviso até amanhã', false, 'delivered', now() - interval '3 days');

  -- Camila Ferreira
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_camila, 'Vim pelo Instagram, quero fechar o pacote completo!', false, 'delivered', now() - interval '4 days 1 hour'),
    (conv_camila, 'Oi Camila! Que ótimo! Vou te enviar os detalhes do pacote agora mesmo.', true, 'read', now() - interval '4 days 30 min'),
    (conv_camila, 'Quero fechar o pacote completo', false, 'delivered', now() - interval '4 days');

  -- Eliane Moreira
  INSERT INTO public.messages (conversation_id, text, from_me, status, created_at) VALUES
    (conv_eliane, 'Oi! Quero agendar para quinta.', false, 'delivered', now() - interval '5 days 2 hours'),
    (conv_eliane, 'Perfeito! Quinta às 14h está reservado para você ✅', true, 'read', now() - interval '5 days 1 hour'),
    (conv_eliane, 'Fechado! Nos vemos na quinta 🎉', false, 'delivered', now() - interval '5 days');

  RAISE NOTICE 'Seed concluído com sucesso!';
END $$;
