# Dermalūm — Checklist de Funcionalidades

> Documento atualizado em 20/03/2026 para referência técnica.

---

## 1. Autenticação & Segurança

- [x] Login com e-mail e senha
- [x] Recuperação de senha ("Esqueci a senha") com token seguro via edge function
- [x] Redefinição de senha com link temporário
- [x] Controlo de sessão (auto-logout, token refresh)
- [x] Rotas protegidas — utilizadores não autenticados são redirecionados para login
- [x] Sistema de papéis (Administrador, Especialista, Recepcionista) com tabela `user_roles`
- [x] Permissões granulares por módulo (Visualizar, Criar, Editar, Remover)
- [x] Row-Level Security (RLS) em todas as tabelas do banco de dados
- [x] Funções `has_role()` e `is_admin()` para validação server-side
- [x] Signup público desativado (apenas admins criam utilizadores)
- [x] Anonymous users desativados
- [x] Auditoria de segurança completa (Março 2026):
  - [x] 14 políticas RLS corrigidas (remoção de acesso `public`/`anon` indevido)
  - [x] `integration_settings` restrito apenas a admin (contém API keys)
  - [x] `password_reset_tokens` com policy deny-all (gerido apenas via service_role)
  - [x] Políticas anon removidas de `profiles`, `user_roles`, `calendar_feeds`
  - [x] RPC `public_specialists()` (SECURITY DEFINER) para agendamento público seguro
  - [x] Edge function `weekly-inactive-report` protegida com `CRON_SECRET` + admin JWT
  - [x] Dependências vulneráveis atualizadas (`html2pdf.js` 0.14.0)

---

## 2. Dashboard

- [x] Agenda visual FullCalendar (vista diária/semanal com time grid)
- [x] Alerta de clientes inativos no topo do dashboard
- [x] Criação rápida de agendamento via clique no calendário
- [x] Popover de seleção rápida ao arrastar no calendário
- [x] Bloqueios de agenda visíveis no calendário
- [x] Navegação responsiva (desktop e mobile com menu hamburger)

---

## 3. Gestão de Clientes

- [x] Listagem com pesquisa (busca server-side via `search_clients`)
- [x] Paginação (20 registos por página)
- [x] Criar novo cliente (nome, e-mail, telefone, CPF, data nascimento)
- [x] Editar cliente
- [x] Detalhe do cliente com abas:
  - [x] Informações pessoais
  - [x] Histórico de atendimentos (timeline)
  - [x] Produtos utilizados
  - [x] Imagens clínicas (antes/depois)
  - [x] Documentos (upload e visualização)
  - [x] Notas clínicas (acesso restrito a Admin + Especialista)
  - [x] Dados físicos (peso, altura, tipo de pele)
  - [x] Interesses e preferências
  - [x] Fichas de anamnese (Rosto e Corpo com diagrama interativo)
  - [x] Consentimentos (assinatura digital + exportação PDF)
- [x] Excluir cliente (somente Admin)
- [x] Consentimento do cliente (checkbox + PDF)
- [x] Métricas do cliente (via função `client_metrics`)

---

## 4. Agendamentos (Atendimentos)

- [x] Criar novo agendamento (cliente, serviço, especialista, data/hora)
- [x] Seleção múltipla de serviços por agendamento
- [x] Cálculo automático de horário de término baseado na duração dos serviços
- [x] Atribuição automática ou manual de especialista
- [x] Edição inline na agenda (data, hora, especialista) com conversão timezone-safe
- [x] Detalhe do agendamento com:
  - [x] Status (Agendado, Em andamento, Concluído, Cancelado)
  - [x] Serviços associados
  - [x] Produtos utilizados no atendimento
  - [x] Formulário dinâmico por serviço (campos personalizáveis)
  - [x] Upload de fotos antes/depois
  - [x] Feedback/avaliação do cliente (rating + comentário)
  - [x] Notas do atendimento
- [x] Exclusão total (hard delete) para Admin e Especialista via edge function
- [x] Formulários dinâmicos por serviço (text, textarea, select, checkbox, file)
- [x] Deteção de atendimentos esquecidos (edge function `check-stuck-appointments`)
  - [x] Alerta após +30 min do horário previsto de término
  - [x] Encerramento automático após +60 min com nota no atendimento
  - [x] Notificação a administradores e recepcionistas via n8n
- [x] Webhooks automáticos para eventos: confirmed, cancelled, changed
  - [x] Payloads com mensagens pré-resolvidas e subjects dinâmicos
  - [x] Fallbacks robustos — nenhum campo de payload é enviado vazio
  - [x] Remoção automática de links de cancelamento em eventos de cancelamento

---

## 5. Serviços

- [x] CRUD completo de serviços (nome, descrição, duração, preço, cor)
- [x] Categorias de serviços (agrupamento visual)
- [x] Ordenação drag-and-drop dos serviços
- [x] Configurações por serviço:
  - [x] Requer formulário de avaliação (Rosto, Corpo ou Ambos)
  - [x] Requer termo de consentimento
  - [x] Requer fotos antes/depois
  - [x] Requer assinatura de conclusão
  - [x] Moeda e taxa de IVA
  - [x] Visibilidade na página de agendamento público
  - [x] Mostrar/ocultar preço na página pública
- [x] Campos de formulário personalizáveis por serviço (Service Form Fields)
- [x] Associação de especialistas a serviços
- [x] Importação em massa de serviços (JSON)

---

## 6. Produtos

- [x] Listagem com pesquisa e filtros
- [x] Criar/editar produto (nome, preço, SKU, marca, categoria, descrição)
- [x] Controlo de stock (quantidade em inventário)
- [x] Imagem do produto (upload)
- [x] Ativar/desativar produto
- [x] Categorias de produtos (CRUD de categorias)
- [x] Detalhe do produto
- [x] Excluir produto (somente Admin)

---

## 7. Cobranças

- [x] Listagem com pesquisa, filtro por status e paginação
- [x] Criar nova cobrança (cliente, itens, valor, data de vencimento, notas)
- [x] Itens de cobrança (serviços e produtos com quantidade e preço unitário)
- [x] Associação opcional a agendamento
- [x] Status: Pendente, Pago, Cancelado
- [x] Detalhe da cobrança
- [x] Editar cobrança
- [x] Exportar cobrança em PDF (geração client-side)
- [x] Envio de cobrança por e-mail (Resend) e WhatsApp (Evolution API)
- [x] Registo de envios (charge_sends) com histórico
- [x] Marcar como pago

---

## 8. Faturamento

- [x] Vista consolidada de faturamento
- [x] Listagem de atendimentos com valor e status de pagamento
- [x] Filtros por período e status
- [x] Pesquisa por nome de cliente
- [x] Paginação
- [x] Indicadores de tendência (sparkline)

---

## 9. Relatórios

- [x] Filtro global por período (intervalo de datas)
- [x] Presets rápidos (7 dias, 30 dias, 90 dias)
- [x] **Resumo Executivo**: KPIs principais (clientes, atendimentos, receita)
- [x] **Relatório Financeiro**: receita, ticket médio, gráficos
- [x] **Relatório de Clientes**: novos clientes, inativos, distribuição
- [x] **Relatório de Atendimentos**: volume, status, horários populares
- [x] **Relatório de Produtos**: mais utilizados, stock
- [x] **Relatório de Especialistas**: receita por profissional, nº atendimentos
- [x] Exportação para Excel (XLSX)
- [x] Exportação para PDF (via impressão)

---

## 10. Agendamento Público (Online Booking)

- [x] Página pública acessível sem login (`/agendamento`)
- [x] Fluxo de 6 etapas guiadas:
  1. [x] Escolha de categoria (cards visuais)
  2. [x] Seleção de serviço(s)
  3. [x] Escolha de especialista (com avatar) — auto-skip se só há 1
  4. [x] Seleção de data e horário (agrupados por período: Manhã, Tarde, Noite)
  5. [x] Resumo e confirmação (nome, e-mail, telefone, notas)
  6. [x] Tela de sucesso com confetes e exportação para calendário externo
- [x] Cálculo de disponibilidade via edge function (`availability`)
- [x] Suporte a turnos divididos (ex: 09-12h e 14-18h)
- [x] Fallback automático: horário do especialista → horário da empresa
- [x] Verificação de conflitos de agenda
- [x] Verificação de bloqueios de calendário
- [x] Link compartilhável (dialog de compartilhamento)
- [x] Campos obrigatórios configuráveis (e-mail, género, data nascimento, NIF)
- [x] Aceitação de Termos de Utilização e consentimento Marketing (opcional)
- [x] Código de incorporação iframe para websites externos
- [x] Cancelamento de marcação via link com token único

---

## 11. Configurações (Admin)

### 11.1 Agenda
- [x] Nome, morada e telefone da clínica
- [x] Fuso horário e moeda
- [x] Intervalo de slots do calendário (15m, 30m, 45m, 1h)
- [x] Antecedência do lembrete de agendamento
- [x] Dias de inatividade configuráveis
- [x] Permitir agendamento multi-serviço
- [x] Configurações avançadas de otimização e booking

### 11.2 Horários da Empresa
- [x] Definir horários de funcionamento por dia da semana
- [x] Suporte a múltiplos turnos por dia (ex: manhã e tarde)
- [x] Ativar/desativar dias
- [x] Webhook automático ao n8n ao salvar (envia janela de horário comercial)

### 11.3 Horários dos Especialistas
- [x] Horários personalizados por especialista e dia da semana
- [x] Suporte a múltiplos turnos por dia
- [x] Fallback automático para horário da empresa quando não definido
- [x] Indicação visual de sobreposição vs. horário base

### 11.4 Equipa (Gestão de Utilizadores)
- [x] Listagem de todos os utilizadores com perfil, e-mail e data de cadastro
- [x] Coluna de e-mail na tabela (via RPC `list_user_emails()`)
- [x] Badge de função (Admin, Especialista, Atendimento)
- [x] Criar novo utilizador (via edge function `create-user`)
- [x] Detalhe do utilizador com e-mail, função e data de criação
- [x] Editar utilizador (nome, telefone, papel)
- [x] Excluir utilizador (via edge function `delete-user` com limpeza em cascata)
- [x] Reset de senha administrativo (via edge function `admin-reset-password`)
- [x] Atribuição de papel (Admin, Especialista, Recepcionista)

### 11.5 Permissões
- [x] Matriz visual de permissões por papel e módulo
- [x] Exibição read-only para referência

### 11.6 E-mail (Templates de Sistema)
- [x] Editor HTML visual (rich editor) para templates:
  - [x] Boas-vindas
  - [x] Recuperação de senha
  - [x] Cliente inativo
- [x] Configuração Resend (API Key + endereço de remetente)
- [x] Campos de remetente e reply-to com fallbacks automáticos

### 11.7 Notificações
- [x] Gestão centralizada de 3 canais: **E-mail, SMS, WhatsApp**
- [x] Templates de notificação por canal:
  - [x] Confirmação de agendamento
  - [x] Alteração de agendamento
  - [x] Cancelamento
  - [x] Lembrete
  - [x] Aniversário
  - [x] Inatividade
- [x] Ativar/desativar cada template individualmente
- [x] Edição do conteúdo de cada mensagem com pré-visualização HTML
- [x] Variáveis dinâmicas nos templates:
  - [x] `{nome}`, `{nome_completo}`, `{cartao_cidadao}`, `{data}`, `{horario}`
  - [x] `{negocio}`, `{servico}`, `{especialista}`
  - [x] `{link_agendamento}`, `{link_cancelamento}`, `{link_cancelar}`
  - [x] `{link_site}`, `{link_instagram}`, `{link_facebook}`, `{telefone}`
- [x] Subjects de e-mail editáveis com fallbacks por evento
- [x] Remoção automática de links de cancelamento em notificações de cancelamento

### 11.8 Integrações
- [x] Configuração de WhatsApp (Evolution API: URL, API Key, instância)
  - [x] Verificação de conexão em tempo real
  - [x] Geração de QR Code para vincular dispositivo
  - [x] Envio de mensagem de teste
- [x] Configuração de SMS (URL da API, ativação, teste)
- [x] Webhook de marcações (URL n8n para confirmação/cancelamento/lembrete)
- [x] Webhook de marketing (URL n8n dedicada para campanhas)
- [x] Webhook de atendimentos esquecidos (URL n8n + endpoint de verificação)
- [x] Automação diária (aniversariantes + inativos via n8n)
- [x] Código de incorporação iframe para agendamento em websites externos
- [x] Exportação SQL da base de dados (dump)
- [x] Limpeza de dados com backup obrigatório e confirmação dupla

### 11.9 Google Calendar
- [x] Feed iCal para sincronização (token gerado automaticamente)
- [x] Feeds por especialista ou da clínica inteira
- [x] Ativar/desativar feeds
- [x] URL copiável para Google Calendar

### 11.10 Página de Agendamento
- [x] Personalização visual (logo, capa, cor de fundo, título)
- [x] Configuração de campos obrigatórios
- [x] Links de redes sociais
- [x] Notas de rodapé e termos de uso
- [x] Código de tracking (analytics)
- [x] Escolha de especialista ativável/desativável
- [x] Categorias expandidas por defeito (configurável)

---

## 12. Marketing (Campanhas & Avaliações)

### 12.1 Campanhas
- [x] Listagem de campanhas com status e métricas
- [x] Criar/editar campanha (nome, canal, conteúdo, audiência)
- [x] Canais suportados: E-mail, SMS, WhatsApp
- [x] Segmentação de audiência: Todos, Novos, Ativos, Inativos
- [x] Opção de incluir clientes sem opt-in de marketing
- [x] Editor visual com:
  - [x] Assunto do e-mail
  - [x] Conteúdo da mensagem
  - [x] Imagem de cabeçalho (upload e toggle)
  - [x] Botão CTA (texto + URL)
- [x] Pré-visualização por canal (e-mail e SMS)
- [x] Controlo anti-bloqueio (batch_size + send_delay_seconds)
- [x] Estimativa de duração e hora de término do envio
- [x] Envio de teste (1 destinatário)
- [x] Envio completo via Edge Function com lotes e delay
- [x] Tracking de destinatários (campaign_recipients)
- [x] Payloads com fallbacks robustos (nenhum campo vazio)

### 12.2 Avaliações Google
- [x] Configuração de negócio Google (Place ID + nome)
- [x] Seleção multi-canal para envio (WhatsApp, E-mail, SMS — checkboxes)
- [x] Mensagem personalizada **por canal** (abas de texto independentes)
- [x] Variáveis dinâmicas: `{nome}`, `{link_google}`, `{link_confirmar}`, `{negocio}`
- [x] Intervalo de envio configurável (3 dias a 6 meses)
- [x] Máximo de envios por cliente (1 a 5)
- [x] Switch de ativação com gravação imediata
- [x] KPIs de envios, confirmados, pendentes e na fila
- [x] Listagem de pedidos pendentes e confirmados
- [x] Edge function `send-review-requests` com envio multi-canal
- [x] Edge function `confirm-review` para validação de avaliação via token

---

## 13. Perfil do Utilizador

- [x] Editar nome e telefone
- [x] Upload de avatar com recorte (crop dialog)
- [x] Visualização do e-mail (read-only)

---

## 14. Clientes Inativos

- [x] Listagem de clientes sem visita recente (via função `inactive_clients`)
- [x] Alerta visual no dashboard
- [x] Página dedicada com detalhes (dias de inatividade, último atendimento)
- [x] Relatório semanal automático (edge function `weekly-inactive-report`)

---

## 15. Importação e Exportação de Dados

- [x] Importação via JSON de:
  - [x] Serviços
  - [x] Especialistas
  - [x] Clientes
  - [x] Agendamentos
- [x] Processamento via edge function (`import-data`)
- [x] Desduplicação e matching inteligente de especialistas
- [x] Feedback visual de sucesso/erro por entidade
- [x] Exportação SQL completa da base de dados (dump-data)
- [x] Limpeza de dados com:
  - [x] Backup obrigatório antes da exclusão
  - [x] Confirmação por texto ("EXCLUIR")
  - [x] Preservação de utilizadores, perfis e configurações
- [x] Acesso restrito a Admin

---

## 16. Bloqueios de Calendário

- [x] Criar bloqueio (especialista, data/hora início e fim, motivo)
- [x] Bloqueios visíveis no calendário do dashboard
- [x] Bloqueios verificados na disponibilidade do agendamento público
- [x] Especialistas podem gerir os seus próprios bloqueios

---

## 17. Edge Functions (Backend)

| Função | Descrição |
|---|---|
| `admin-reset-password` | Reset de senha administrativo |
| `availability` | Cálculo de horários disponíveis (multi-turno) |
| `calendar-feed` | Geração de feed iCal (.ics) |
| `calendar-ics` | Exportação de calendário em formato ICS |
| `check-stuck-appointments` | Deteção e encerramento automático de atendimentos esquecidos |
| `clear-data` | Limpeza de dados transacionais (admin) |
| `confirm-review` | Confirmação de avaliação Google via token |
| `create-user` | Criação de utilizador (auth + profile + role) |
| `daily-notifications` | Dados diários de aniversariantes e inativos para n8n (com mensagens pré-resolvidas) |
| `delete-appointment` | Exclusão total de agendamento e dados associados |
| `delete-client` | Exclusão de cliente e todos os dados em cascata |
| `delete-user` | Exclusão de utilizador e dados associados (cascata) |
| `dump-data` | Exportação SQL da base de dados |
| `import-data` | Importação em massa de dados JSON |
| `notification-callback` | Callback de resultados de notificações |
| `request-password-reset` | Solicitação de redefinição de senha |
| `reset-password` | Redefinição de senha com token |
| `send-campaign` | Envio de campanha de marketing em lotes |
| `send-charge` | Envio de cobrança por e-mail ou WhatsApp |
| `send-email` | Envio de e-mail via Resend |
| `send-review-requests` | Envio automático de pedidos de avaliação Google (multi-canal) |
| `sms-callback` | Callback de status de SMS |
| `weekly-inactive-report` | Relatório semanal de clientes inativos |

---

## 18. Design System & UX

- [x] Design system documentado (`/design-system`)
- [x] Tema claro/escuro (tokens CSS semânticos)
- [x] Componentes reutilizáveis (shadcn/ui customizados)
- [x] Animações de entrada (BlurFade, GSAP)
- [x] Layout responsivo (desktop + mobile)
- [x] Navegação com ícone + label expansível
- [x] Toasts e notificações (Sonner)
- [x] Loading states com skeletons
- [x] Lazy loading de páginas (code splitting)
- [x] Tipografia personalizada (fonte Morien)

---

## 19. Automações & Webhooks

- [x] Webhook de marcações (confirmação, cancelamento, alteração, lembrete) via `src/lib/webhook.ts`
  - [x] Payloads com mensagens pré-resolvidas e subjects dinâmicos
  - [x] Fallbacks robustos em todos os campos (sender, from, reply_to, subject, message)
  - [x] Remoção automática de links de cancelamento em eventos já cancelados
- [x] Webhook de horários comerciais ao n8n (ao salvar business_hours)
- [x] Webhook de campanhas de marketing (send-campaign)
- [x] Deteção de atendimentos esquecidos (cron 30min via n8n + edge function)
- [x] Relatório semanal de inativos (edge function + Resend)
- [x] Dados diários de aniversariantes e inativos (edge function para n8n com canais pré-resolvidos)
- [x] Polling de lembretes pendentes (edge function `pending-reminders` + `reminder-callback`)
- [x] Avaliações Google automatizadas (edge functions `send-review-requests` + `confirm-review`)
- [x] 6 workflows n8n documentados (`N8N_WORKFLOWS.md`)

---

## 20. Funcionalidades Transversais

- [x] Pesquisa com debounce em todas as listagens
- [x] Pesquisa sem acentos (unaccent) na busca de clientes
- [x] Paginação server-side (clientes) e client-side
- [x] Formatação de datas em português (date-fns/pt)
- [x] Formatação de moeda (EUR)
- [x] Conversão de horários timezone-safe (UTC ↔ Europe/Lisbon)
- [x] Input de telefone internacional (PhoneInput)
- [x] Rich text editor (TipTap) para templates HTML
- [x] Geração de PDF client-side (cobranças, consentimentos)
- [x] Exportação Excel (XLSX)
- [x] SEO básico (meta tags, OG image, robots.txt, favicon)
- [x] Página 404 personalizada

---

## 21. Segurança & Auditoria

- [x] Auditoria completa de RLS policies (14 correções aplicadas em 12/03/2026)
- [x] Tabelas sensíveis protegidas contra acesso anónimo:
  - [x] `client_images`, `client_documents`, `appointment_feedback` — apenas `authenticated`
  - [x] `notification_settings` — leitura `authenticated`, gestão apenas admin
  - [x] `integration_settings` — apenas admin (contém API keys e segredos)
  - [x] `password_reset_tokens` — deny-all (service_role only)
  - [x] `calendar_feeds` — tokens não enumeráveis por anon
  - [x] `charges` — INSERT/UPDATE apenas `authenticated`
  - [x] `appointment_services` — SELECT apenas `authenticated`
- [x] Políticas anon removidas de `profiles` e `user_roles` (booking usa RPC seguro)
- [x] RPC `public_specialists()` com SECURITY DEFINER para agendamento público
- [x] Edge functions com autenticação:
  - [x] `weekly-inactive-report` — protegida com `CRON_SECRET` ou admin JWT
  - [x] `check-stuck-appointments` — acesso via ANON_KEY (verify_jwt=false, sem dados sensíveis)
  - [x] `clear-data`, `dump-data` — admin JWT obrigatório
- [x] Signup público desativado, anonymous users desativados
- [x] Scan de dependências: `html2pdf.js` atualizado para 0.14.0 (CVE jspdf corrigida)

---

## 22. Documentação

- [x] `FUNCIONALIDADES.md` — Checklist técnica de funcionalidades (este documento)
- [x] `DOCUMENTACAO.md` — Manual do utilizador para o cliente
- [x] `N8N_WORKFLOWS.md` — Guia completo dos 6 workflows n8n (lembretes, campanhas, avaliações)
- [x] `README.md` — Visão geral do projeto e stack tecnológica

---

*Total: **290+ funcionalidades** implementadas e operacionais.*
