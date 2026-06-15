# Backlog — Bellex

> Última atualização: 2026-06-11
> Organizado por área → prioridade → sprint sugerido

---

## 🌐 Landing Page & Conversão

> Baseado na análise competitiva vs Clínica Experts + sessão CEO/Copywriter.
> Premissas validadas: ICP = dona de clínica solo, CTA = demo assistida, sem analytics ainda.

### Sprint LP-1 — Fundação (semana 1)
| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| LP-01 | Instalar GA4 + Microsoft Clarity + eventos no CTA "Agendar Demo" | 2h | 🔴 Base |
| LP-02 | Reescrever headline do hero — foco na dor da dona de clínica solo | 30min | 🔴 Alto |
| LP-03 | Adicionar badge de garantia no hero ("7 dias grátis · sem cartão · cancela quando quiser") | 1h | 🔴 Alto |
| LP-04 | Adicionar linha de credibilidade no hero ("Migração gratuita · setup 30min · suporte BR") | 30min | 🔴 Alto |
| LP-05 | Coletar depoimentos reais: e-mail para 5 clientes beta pedindo texto + foto | 1 email | 🔴 Crítico |

### Sprint LP-2 — Copy e Prova Social (semana 2-3)
| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| LP-06 | Substituir depoimentos fictícios por depoimentos reais com foto + cidade | 3h | 🔴 Alto |
| LP-07 | Reescrever seção LandingProblem — copy de "status quo" específico (planilha, WhatsApp, sistema ruim) | 2h | 🟡 Médio-alto |
| LP-08 | Adicionar avatar stack + contador real de clínicas no hero | 2h | 🟡 Médio |
| LP-09 | Seção "Como é a demo" — desmistifica o CTA, embed Calendly inline | 3h | 🟡 Médio |
| LP-10 | CTA segmentado: "Clínica pequena (1-4 pessoas)" vs "Equipe maior / múltiplas unidades" | 2h | 🟡 Médio |

### Sprint LP-3 — Conversão Avançada (semana 4+)
| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| LP-11 | Garantia de 30 dias explícita no hero e em pricing | 1h | 🟡 Médio |
| LP-12 | Seção LGPD dedicada com 4 pilares visuais (não só mencionar no rodapé) | 3h | 🟡 Médio |
| LP-13 | Vídeos de depoimento — pedir vídeo vertical 60s para 3 clientes reais | 1 semana | 🔴 Muito alto |
| LP-14 | Quiz de onboarding inline — "Qual seu maior desafio?" → segmenta lead antes da demo | 1 dia | 🟡 Médio |
| LP-15 | Segmentação por nicho (estética / odonto / psicologia) nas páginas de recursos | 2 dias | 🟢 Baixo |

---

---

## 📋 Fichas Clínicas — Sistema de Registry

> Arquitetura: cada ficha é um componente React independente. Registry central ativa/desativa por clínica. Cada ficha é associada a serviços específicos. Carregamento lazy. SVG interativo em todas.

### Sprint FICHAS-0 — Infraestrutura
| # | Item |
|---|------|
| F-00 | Criar `src/fichas/registry.ts` — metadados de todas as fichas (id, label, desc, category, lazy import) |
| F-01 | Tabela `ficha_configs` no Supabase — `{ clinica_id, ficha_id, ativo }` |
| F-02 | Tabela `servico_fichas` — `{ servico_id, ficha_id }` — associação many-to-many |
| F-03 | UI na tela de Admin/Configurações — listar fichas disponíveis, toggle ativar/desativar |
| F-04 | UI na tela de Serviços — associar fichas ativas ao serviço |
| F-05 | Tela de Atendimento — carregar fichas do serviço dinamicamente (lazy + Suspense) |

### Sprint FICHAS-1 — Ficha Nutricional
| # | Item |
|---|------|
| F-10 | SVG: 3 silhuetas selecionáveis (ectomorfo/mesomorfo/endomorfo) — influencia cálculos |
| F-11 | Campos: peso, altura, idade, sexo, circunferência do punho, % gordura |
| F-12 | Cálculo: IMC + classificação automática (abaixo/normal/sobrepeso/obeso) |
| F-13 | Cálculo: TMB — Harris-Benedict (fórmula homem/mulher) |
| F-14 | Cálculo: VET = TMB × fator de atividade física (sedentário 1.2 → muito ativo 1.9) |
| F-15 | Cálculo: Estrutura óssea via circunferência do punho (pequena/média/grande) |
| F-16 | Export PDF da ficha preenchida com todos os resultados |

### Sprint FICHAS-2 — Ficha Facial
| # | Item |
|---|------|
| F-20 | SVG: face frontal com regiões clicáveis (testa, olhos, nariz, bochechas, queixo, lábios) |
| F-21 | Sistema de Baumann — 4 eixos (Oleoso/Seco, Sensível/Resistente, Pigmentado/Não pigmentado, Envelhecido/Tenso) |
| F-22 | Escala de Fitzpatrick — I a VI (fototipos de pele) |
| F-23 | Escala de Glogau — grau de envelhecimento I a IV |
| F-24 | Classificação grau de acne e tipo de cicatrizes |
| F-25 | Avaliação de rosácea — grau e subtipo (eritematotelangiectásica, papulopustulosa, fimatosa, ocular) |
| F-26 | Hiperpigmentação periocular e avaliação de discromia facial |

### Sprint FICHAS-3 — Ficha Corporal
| # | Item |
|---|------|
| F-30 | SVG: corpo frontal + dorsal alternável — regiões clicáveis para marcação |
| F-31 | Adipometria — dobras cutâneas (Jackson-Pollock 3/7 dobras) → % gordura |
| F-32 | IMC + distribuição de gordura corporal (andróide/ginóide) |
| F-33 | Perimetria — medidas de circunferências (cintura, quadril, braço, coxa, etc.) |
| F-34 | Quantificação e localização de estrias (marcação no SVG) |
| F-35 | Classificação formato corporal (retângulo, ampulheta, triângulo, triângulo invertido, oval) |
| F-36 | Classificação de William Sheldon — somatotipo (ecto/meso/endomorfo) |
| F-37 | Escala de percepção de imagem pessoal |
| F-38 | Avaliação de diástase do reto abdominal |

### Sprint FICHAS-4 — Ficha Injetáveis
| # | Item |
|---|------|
| F-40 | SVG facial: 3 ângulos (frontal, perfil direito, perfil esquerdo) — navegável por thumbnail |
| F-41 | SVG corporal: frontal + dorsal para injetáveis corporais |
| F-42 | Clique no SVG → adiciona ponto marcado com cor por produto (botox=vermelho, HA=roxo, etc.) |
| F-43 | Lista lateral — produto, unidades, localização — toggle "Exibir quantidades" |
| F-44 | Adicionar foto do paciente como camada (igual screenshot do concorrente) |

### Sprint FICHAS-5 — Odontograma
| # | Item |
|---|------|
| F-50 | SVG: arcada superior + inferior — 32 dentes clicáveis |
| F-51 | Status por dente: hígido, cariado, restaurado, ausente, implante, coroa |
| F-52 | Anotação por face do dente (mesial, distal, vestibular, lingual, oclusal) |
| F-53 | Exclusivo para serviços com especialidade = dentista |

### Sprint FICHAS-6 — Ficha Beleza
| # | Item |
|---|------|
| F-60 | SVG: rosto para classificação de formato (oval, redondo, quadrado, coração, losango) |
| F-61 | Avaliação e classificação de formato de sobrancelha |
| F-62 | SVG: mão para avaliação de formato de unhas |

### Sprint FICHAS-7 — Ficha Capilar *(nova)*
| # | Item |
|---|------|
| F-70 | SVG: couro cabeludo com regiões clicáveis (frontal, topo, lateral D/E, occipital) |
| F-71 | Classificação de queda — escala Ludwig (feminino) e Hamilton-Norwood (masculino) |
| F-72 | Avaliação do fio: espessura, oleosidade, porosidade, elasticidade |
| F-73 | Diagnóstico de couro cabeludo: oleoso, seco, misto, sensível, caspa, foliculite |
| F-74 | Histórico de químicas: coloração, descoloração, relaxamento, permanente (datas) |
| F-75 | Export PDF da ficha capilar |

### Sprint FICHAS-8 — Ficha Epilação *(nova)*
| # | Item |
|---|------|
| F-80 | SVG: corpo frontal + dorsal com regiões de epilação clicáveis (axila, virilha, pernas, buço, etc.) |
| F-81 | Tipo de pele × cor de pelo — tabela de indicação de método (laser, cera, luz pulsada) |
| F-82 | Escala de Fitzpatrick aplicada à epilação (fototipos I–VI × risco) |
| F-83 | Contraindicações: medicamentos fotossensíveis, gestação, bronzeamento recente |
| F-84 | Histórico de sessões por região — número de sessões, intervalo, resultado parcial |
| F-85 | Export PDF da ficha |

### Sprint FICHAS-9 — Fotos e Anexos *(nova)*
| # | Item |
|---|------|
| F-90 | Upload de fotos antes/durante/depois vinculadas ao atendimento ou ao cliente |
| F-91 | Visualizador comparativo lado a lado (antes × depois) |
| F-92 | Marcação de data e especialista em cada foto |
| F-93 | Upload de anexos gerais (laudos, exames, autorizações) com tipo e descrição |
| F-94 | Armazenamento no R2, URLs assinadas com expiração |

### Sprint FICHAS-10 — Plano de Tratamento *(novo)*
| # | Item |
|---|------|
| F-100 | Criação de plano com nome, objetivo, duração estimada e observações |
| F-101 | Lista de sessões previstas com serviço, intervalo recomendado e status (pendente/realizada) |
| F-102 | Progresso visual — barra ou % de conclusão do plano |
| F-103 | Vinculação do plano a agendamentos futuros |
| F-104 | Export PDF do plano de tratamento para entregar ao cliente |

---

## 📄 Documentos — Assinatura Digital

| # | Item |
|---|------|
| DOC-01 | Integrar `signature_pad` (Szimek) — canvas de assinatura na tela do atendimento |
| DOC-02 | Salvar PNG da assinatura no R2 |
| DOC-03 | Trilha de auditoria: timestamp + IP + device fingerprint + hash SHA-256 do documento |
| DOC-04 | Embedar assinatura + metadados no rodapé do PDF gerado |
| DOC-05 | Guardar hash do PDF final no banco (detecção de adulteração) |
| DOC-06 | Documentos assinados ficam disponíveis na aba Documentos do cliente |

---

## 👤 Tela de Cliente — Estrutura de Abas

> Ao abrir um cliente, a tela deve exibir as seguintes seções em abas ou scroll navegável.

| # | Aba | Conteúdo |
|---|-----|----------|
| CLI-01 | **Dados Pessoais** | Nome, foto, contato, endereço, data de nascimento, observações, tags |
| CLI-02 | **Linha do Tempo** | Feed cronológico de todos os eventos: agendamentos, atendimentos, cobranças, documentos, mensagens |
| CLI-03 | **Prontuários** | Lista de atendimentos realizados com fichas preenchidas, notas e fotos por sessão |
| CLI-04 | **Agendamentos Futuros** | Próximos agendamentos com status, especialista, serviço e opção de reagendar/cancelar |
| CLI-05 | **Financeiro** | Histórico de cobranças, saldo devedor, total gasto no período |
| CLI-06 | **Documentos** | Termos de consentimento assinados, laudos, anexos — com preview e download |

---

## 🏗️ Infraestrutura de Negócio

> Não é feature para o usuário final — é o que permite escalar como SaaS e Whitelabel.

### Sprint INFRA-1 — Multi-tenant
| # | Item |
|---|------|
| I-01 | Tabelas: `tenants`, `licenses`, `seats` com RLS isolado por tenant |
| I-02 | `installation_type`: `saas` \| `whitelabel` |
| I-03 | Branding dinâmico carregado por domínio/subdomínio |
| I-04 | Middleware de resolução de tenant no Supabase |

### Sprint INFRA-2 — Cobrança
| # | Item |
|---|------|
| I-05 | Integração Asaas — checkout para assinatura SaaS no signup |
| I-06 | Webhook handler: cria tenant, define plano, ativa acesso |
| I-07 | Webhook de inadimplência: suspende tenant / reativa no pagamento |
| I-08 | Cobrança manual para licenças WL: boleto/Pix via Asaas, ativação via Super Admin |

---

## 👑 Super Admin — `admin.bellex.com.br`

> Painel exclusivo do founder. Vê todos os tenants SaaS + licenças Whitelabel.

### Sprint SA-1 — Painel básico
| # | Item |
|---|------|
| SA-01 | Lista de instalações com status (ativo, trial, inadimplente, cancelado) |
| SA-02 | Ativar / desativar / expirar manualmente |
| SA-03 | Uso de seats por licença |
| SA-04 | Impersonar tenant |
| SA-05 | Métricas globais: MRR, churn, seats ativos |

### Sprint SA-3 — Configuração de Custos
| # | Item |
|---|------|
| SA-20 | Cadastrar custo por conversa IA (modelo, preço/token, tokens médios por conversa) — atualizado quando o modelo mudar |
| SA-21 | Cadastrar custo de storage por GB excedente (R2) |
| SA-22 | Cadastrar custo fixo de infra por Workspace (Supabase Pro + VPS rateado) |
| SA-23 | Definir margens por plano (Clínica e Workspace) — base para cálculo de lucro em tempo real |
| SA-24 | Histórico de alterações de custo com data — para reconciliação de margem por período |

### Sprint SA-4 — Métricas e Financeiro
| # | Item |
|---|------|
| SA-30 | **MRR** — receita recorrente mensal total, por tipo (Clínica / Workspace), por plano |
| SA-31 | **Custo total da operação** — fixo + variável calculado automaticamente com base nos custos cadastrados e uso real |
| SA-32 | **Lucro líquido estimado** — MRR − custo total, por mês e acumulado |
| SA-33 | **Churn** — clientes cancelados no mês, taxa de churn % |
| SA-34 | **LTV médio** — tempo de vida × ticket médio por tipo de plano |
| SA-35 | **CAC** — campo manual para lançar gasto de aquisição (ads, parceiros) e calcular CAC do período |
| SA-36 | **Uso de IA por tenant** — conversas consumidas vs limite do plano, custo real gerado |
| SA-37 | **Uso de storage por tenant** — GB consumido vs limite, custo real no R2 |
| SA-38 | Dashboard consolidado com gráficos: MRR evolução, custo vs receita, lucro por mês |

### Sprint SA-2 — Gestão de Storage (Cloudflare R2)
| # | Item |
|---|------|
| SA-10 | Cadastrar Access Token R2 por tenant (Clínica ou Workspace) no Super Admin |
| SA-11 | Visualizar uso de storage por tenant em tempo real via API R2 |
| SA-12 | Alertas de uso: notificar Super Admin quando tenant atingir 80% e 100% do limite do plano |
| SA-13 | Ação manual: expandir limite de storage de um tenant sem trocar de plano |
| SA-14 | Investigar viabilidade da API Cloudflare R2 para leitura de uso por bucket (`CF API: GET /accounts/{id}/r2/buckets/{name}/usage`) — confirmar se o endpoint existe e retorna dados granulares |

---

## 🏢 Workspace — Tenant Admin (Frontend: DONE ✅)

> Painel para parceiros WL gerenciarem suas clínicas. Frontend entregue.
> Pendente: conectar dados reais (backend + Supabase).

### Entregue (frontend)
- ✅ Dashboard com KPIs e gráficos
- ✅ Clínicas — listagem, nova clínica (steps), configurações (6 abas)
- ✅ Domínio personalizado — DNS setup completo (TXT + CNAME + A record)
- ✅ Clientes, Planos, Financeiro, Licenças, Usuários, Relatórios
- ✅ Notificações, Suporte (tickets/feedbacks das clínicas)
- ✅ Configurações (Workspace, Integrações: Resend + WhatsApp, Notificações, Agente IA)

### Sprint WS-1 — Backend
| # | Item |
|---|------|
| WS-01 | Conectar clínicas ao Supabase real (CRUD) |
| WS-02 | Conectar licenças e seats ao backend |
| WS-03 | Integração Resend real nas configurações |
| WS-04 | Webhook WhatsApp Business API funcional |
| WS-05 | Domínio personalizado — verificação DNS real via API |

---

## 🔴 Prioridade Alta — Features para o Usuário Final

### ✅ Segmentação + Campanhas de Marketing *(entregue)*
Filtros por paciente + builder de campanha WhatsApp/e-mail (reativação, promoções, lembretes).

### Pagamento no Agendamento Online
Cobrança no último passo do `/agendamento` público — Pix e cartão.
Reduz no-shows e antecipa receita.

---

## 🔵 UX Global — Header, Busca e Assistente IA

### Sprint UX-1 — Header Superior + Busca Global

| # | Item | Decisão pendente |
|---|------|-----------------|
| UX-01 | **Header superior global** — barra acima do conteúdo com: Busca global (paciente, agendamento, serviço), Botão Ajuda, Botão Assistente IA | Criar header novo ou colocar Ajuda + Busca no sidebar e IA flutuante |
| UX-02 | **Botão Ajuda** — abre painel lateral com docs, tutoriais em vídeo e link pra suporte | Se não tiver header: fica no rodapé do sidebar |
| UX-03 | **Busca Global** — campo de busca universal: paciente por nome/telefone, agendamento por data/especialista, serviço, produto | Se não tiver header: fica no topo do sidebar |
| UX-04 | **Assistente IA flutuante** — botão fixo no canto inferior direito, abre chat lateral. Responde dúvidas sobre o sistema, sugere ações ("você tem 3 no-shows hoje"), acessa contexto da clínica | Independente do header — sempre flutuante |

### Sprint UX-3 — Timer de Atendimento

| # | Item | Descrição |
|---|------|-----------|
| UX-11b | **Alerta de cobrança não registrada** — mover o banner de aviso para o topo absoluto do layout (acima do sidebar e do header, não flutuante — empurra o conteúdo pra baixo). Aumentar altura e destaque visual. Fixo até a cobrança ser registrada ou dispensada | Atualmente está pequeno e posicionado só no topo do content |
| UX-12 | **Barra de atendimento ativa** — barra fixa (topo ou rodapé do content) exibida durante todo o atendimento, contendo: cronômetro `00:00:00` · "Rascunho salvo" (status) · botão Cancelar · botão Finalizar atendimento | Visível em qualquer tela enquanto há atendimento aberto |
| UX-13 | **Auto-save de rascunho** — salva automaticamente o estado do atendimento em intervalos regulares, atualiza o status "Rascunho salvo" com timestamp | Evita perda de dados |
| UX-14 | **Alerta ao sair sem finalizar** — ao tentar navegar pra outra rota com atendimento em aberto, exibe modal: "Você está em atendimento. Deseja sair sem finalizar?" · Continuar atendimento / Sair mesmo assim | Bloqueia navegação acidental |

---

### Sprint UX-2 — Filtros da Agenda

| # | Item | Descrição |
|---|------|-----------|
| UX-05 | **Botão "Filtros"** na toolbar da agenda — posicionado entre "Visão Geral" e "+ Adicionar" | Abre barra expansível abaixo da toolbar atual |
| UX-06 | **Barra de filtros expansível** — aparece ao clicar em Filtros, fecha ao clicar novamente | Animação suave, não desloca o calendário bruscamente |
| UX-07 | **Campo de busca por paciente** — dentro da barra de filtros, filtra eventos do calendário em tempo real | Funciona em todas as views: Dia, Semana, Mês, Lista |
| UX-08 | **Filtro por especialista** — checkboxes dos especialistas dentro da barra (complementa o dropdown já existente) | |
| UX-09 | **Filtro por status** — Confirmado, Pendente, Cancelado, No-show | |
| UX-10 | **Filtro por serviço** — dropdown multi-select com os serviços cadastrados | |
| UX-11 | Barra de filtros disponível em todas as views: Dia, Semana, Mês, Lista | |


---

## 🟡 Prioridade Média

| Feature | Descrição |
|---------|-----------|
| Fila de Espera | Cliente entra na lista quando não há horário; notificado ao abrir vaga |
| Google Reserve | Agendamento direto pelo Google Search / Maps |
| WhatsApp Próprio Número | Conectar número da clínica via Evolution API + QR Code |
| Comandas | Abertura por cliente, adição de itens em tempo real, fechamento no atendimento |

---

## 🟢 Prioridade Baixa

| Feature | Descrição |
|---------|-----------|
| Programa de Fidelidade | Pontos por atendimento, painel de resgate |
| NFe — Nota Fiscal Eletrônica | Focus NFe ou NFe.io, disparada ao marcar cobrança como paga |
| App Whitelabel Mobile | React Native + Expo com branding por tenant |
| IA / Assistente Inteligente | Insights com Claude: clientes rentáveis, horários de falta, tendências |
| Agente de Suporte nas Clínicas | Widget [?] nas clínicas com Claude Haiku — configurável no Workspace |

---

## 📋 Referências

- `ROADMAP_MULTITENANT.md` — checklist detalhado dos 5 blocos do multi-tenant
- Analytics a instalar: GA4, Microsoft Clarity, Meta Pixel
- Concorrente analisado: clinicaexperts.com.br
