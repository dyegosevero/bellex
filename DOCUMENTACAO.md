# Bellex — Manual do Utilizador

> Guia completo de utilização do sistema Bellex.
> Versão 1.1 — Março 2026

---

## Índice

1. [Introdução](#1-introdução)
2. [Acesso ao Sistema](#2-acesso-ao-sistema)
3. [Dashboard](#3-dashboard)
4. [Gestão de Clientes](#4-gestão-de-clientes)
5. [Agendamentos](#5-agendamentos)
6. [Workspace Clínica (Atendimento)](#6-workspace-clínica-atendimento)
7. [Agendamento Público (Online)](#7-agendamento-público-online)
8. [Serviços](#8-serviços)
9. [Produtos](#9-produtos)
10. [Cobranças](#10-cobranças)
11. [Faturamento](#11-faturamento)
12. [Relatórios](#12-relatórios)
13. [Clientes Inativos](#13-clientes-inativos)
14. [Marketing (Campanhas & Avaliações Google)](#14-marketing-campanhas--avaliações-google)
15. [Configurações](#15-configurações)
16. [Perfil do Utilizador](#16-perfil-do-utilizador)
17. [Referência de Status](#17-referência-de-status)
18. [Perguntas Frequentes](#18-perguntas-frequentes)

---

## 1. Introdução

O **Bellex** é um sistema de gestão completo para clínicas de estética. Permite gerir clientes, agendamentos, serviços, produtos, cobranças, campanhas de marketing e relatórios — tudo num único lugar.

### Papéis de Utilizador

O sistema possui três níveis de acesso:

| Papel | Descrição |
|---|---|
| **Administrador** | Acesso total. Pode gerir utilizadores, configurações, relatórios e todos os módulos. |
| **Especialista** | Profissional que realiza atendimentos. Pode ver a sua agenda, gerir os seus atendimentos e preencher fichas clínicas. |
| **Atendimento (Recepcionista)** | Gere a agenda, regista clientes e cria agendamentos. Não tem acesso a notas clínicas nem configurações avançadas. |

---

## 2. Acesso ao Sistema

### Como entrar

1. Aceda ao endereço do sistema no navegador
2. Introduza o seu **e-mail** e **senha**
3. Clique em **Entrar**

### Esqueci a senha

1. Na página de login, clique em **"Esqueceu a senha?"**
2. Introduza o seu e-mail
3. Receberá um link para redefinir a senha (válido por tempo limitado)
4. Siga o link e escolha uma nova senha

### Segurança

- A sessão expira automaticamente após um período de inatividade
- Todos os dados são protegidos por políticas de segurança ao nível da base de dados
- Cada utilizador só acede ao que o seu papel permite

---

## 3. Dashboard

O Dashboard é a página inicial após o login. Apresenta uma visão geral da sua clínica.

### O que encontra aqui

- **Calendário visual** — Mostra todos os agendamentos do dia/semana numa grelha de horários
- **Alerta de clientes inativos** — Notificação no topo quando existem clientes sem visita recente
- **Criação rápida** — Clique num horário vazio do calendário para criar um agendamento rapidamente

### Como usar o calendário

- **Navegação**: Use as setas para avançar/recuar dias ou semanas
- **Vista diária/semanal**: Alterne entre vistas no topo do calendário
- **Criar agendamento**: Clique ou arraste num horário vazio → abre o formulário rápido
- **Ver detalhes**: Clique num agendamento existente para ver os seus detalhes
- **Bloqueios**: Aparecem como faixas sombreadas (ex: almoço, férias)

### Adaptação ao dispositivo

- **Desktop**: Calendário completo com vista semanal
- **Telemóvel**: Menu acessível pelo ícone ☰ no canto superior, calendário em vista diária

---

## 4. Gestão de Clientes

### Listagem de clientes

Aceda pelo menu lateral **Clientes**. Verá a lista com:

- Nome, e-mail, telefone
- Data de criação
- Pesquisa por nome, e-mail ou telefone (com suporte a busca sem acentos)
- Paginação automática (20 clientes por página)

### Criar novo cliente

1. Clique em **"Novo Cliente"**
2. Preencha os dados obrigatórios: **Nome completo**
3. Campos opcionais: e-mail, telefone, CPF/NIF, data de nascimento, morada, profissão
4. Clique em **Guardar**

### Ficha do cliente

Ao clicar num cliente, acede à ficha completa com as seguintes secções:

#### Indicadores (KPIs)
No topo, 5 métricas resumidas:
- **Total Gasto** — Valor total pago pelo cliente
- **Total Serviços** — Número de serviços realizados
- **Total Produtos** — Produtos consumidos nos atendimentos
- **Procedimentos** — Número de atendimentos concluídos
- **Ticket Médio** — Valor médio por atendimento

#### Abas disponíveis

| Aba | Conteúdo |
|---|---|
| **Informações** | Dados pessoais, morada, tipo de pele, peso, altura, interesses e preferências |
| **Histórico** | Timeline com todos os atendimentos, serviços, produtos e avaliações |
| **Produtos** | Produtos utilizados nos atendimentos do cliente |
| **Imagens** | Fotos clínicas (antes/depois), organizadas por atendimento |
| **Documentos** | Ficheiros anexados ao perfil do cliente |
| **Notas Clínicas** | Observações clínicas (visível apenas para Admin e Especialista) |
| **Fichas** | Fichas de anamnese (Rosto e/ou Corpo com diagrama interativo) |
| **Consentimentos** | Termos assinados pelo cliente, com visualização e exportação em PDF |

### Eliminar cliente

Apenas **Administradores** podem eliminar clientes. Esta ação é irreversível.

---

## 5. Agendamentos

### Criar um agendamento

1. Aceda a **Agendamentos → Novo** ou clique num horário vazio no calendário
2. Selecione o **cliente** (ou crie um novo)
3. Escolha um ou mais **serviços**
4. Selecione o **especialista** (ou deixe em automático)
5. Escolha **data e hora** de início
6. O horário de término é calculado automaticamente com base na duração dos serviços
7. Adicione **notas** se necessário
8. Clique em **Confirmar**

### Detalhes do agendamento

Ao abrir um agendamento, pode:

- Ver e alterar o **status** (ver secção [Status dos Agendamentos](#status-dos-agendamentos))
- Editar **data, hora e especialista** diretamente na agenda
- Ver os **serviços** associados
- Registar **produtos utilizados** durante o atendimento
- Preencher **formulários dinâmicos** (se configurados no serviço)
- Fazer upload de **fotos antes/depois**
- Recolher **feedback** do cliente (nota de 1 a 5 + comentário)
- Adicionar **notas** do atendimento
- **Eliminar** o agendamento (Admin e Especialista — ação irreversível)

### Notificações automáticas

Quando configuradas as integrações com o n8n, o sistema envia automaticamente:

- **Confirmação** — Ao criar um agendamento
- **Alteração** — Ao editar data/hora/especialista
- **Cancelamento** — Ao cancelar
- **Lembrete** — Antes do agendamento (tempo configurável)

As notificações são enviadas por **WhatsApp**, **E-mail** e/ou **SMS**, conforme os canais ativados.

---

## 6. Workspace Clínica (Atendimento)

Quando um atendimento é iniciado, o especialista acede à **Workspace Clínica** — um ambiente dedicado ao registo clínico.

### Abas da Workspace

As abas são exibidas de forma condicional, conforme a configuração do serviço:

| Aba | Quando aparece | O que contém |
|---|---|---|
| **Dados** | Sempre | Formulários dinâmicos do serviço, notas, produtos utilizados |
| **Fotos** | Quando o serviço requer fotos antes/depois | Upload e visualização de imagens clínicas |
| **Documentos** | Quando o serviço requer consentimento | Assinatura e visualização de termos de consentimento |
| **Fichas** | Quando o serviço requer ficha de avaliação | Ficha de Rosto, Corpo ou ambas (com sub-abas) |
| **Compras** | Sempre | Produtos e serviços registados no atendimento |

### Ficha de Corpo

Inclui uma tabela de medidas corporais vinculada a um **diagrama interativo** do corpo humano, permitindo registar medidas por zona corporal.

### Consentimentos

- O cliente assina digitalmente no ecrã
- O consentimento fica registado com data, hora e nome
- Pode ser visualizado e **exportado como PDF** a qualquer momento

---

## 7. Agendamento Público (Online)

O sistema disponibiliza uma **página pública de agendamento** acessível sem login, para que os seus clientes possam marcar sessões online.

### Endereço

A página está disponível em: `[domínio]/agendamento`

### Fluxo de marcação (6 etapas)

1. **Categoria** — O cliente escolhe a categoria do serviço desejado (cards visuais)
2. **Serviço** — Seleciona um ou mais serviços dentro da categoria
3. **Especialista** — Escolhe o profissional (se houver apenas um, é selecionado automaticamente)
4. **Data e Horário** — Vê os horários disponíveis organizados por período (Manhã, Tarde, Noite)
5. **Dados Pessoais** — Preenche nome, e-mail, telefone e notas (com campos opcionais configuráveis: género, data de nascimento, NIF)
6. **Confirmação** — Tela de sucesso com confetes e opção de exportar para calendário externo

### Cancelamento

Cada marcação gera um **link de cancelamento único** que pode ser incluído nas notificações. O cliente acede ao link, vê os detalhes da marcação e confirma o cancelamento.

### Disponibilidade

- Os horários são calculados automaticamente com base nos **horários do especialista** (ou da empresa, se o especialista não tiver horários próprios)
- **Bloqueios de calendário** são respeitados (férias, pausas, etc.)
- **Conflitos** com agendamentos existentes são verificados em tempo real
- Suporte a **turnos divididos** (ex: 09h–12h e 14h–18h)

### Partilhar o link

No menu do sistema, existe um botão de **partilha** que gera o link da página de agendamento para enviar a clientes.

### Campos obrigatórios configuráveis

Na configuração da página (Admin), pode ativar/desativar:
- E-mail obrigatório
- Data de nascimento
- Género
- NIF
- Aceitação de Termos de Utilização
- Consentimento de Marketing (opcional)

---

## 8. Serviços

### O que é um serviço?

Um serviço representa um procedimento oferecido pela clínica (ex: Limpeza de Pele, Peeling, Massagem).

### Gerir serviços

Aceda pelo menu **Serviços**. Pode:

- **Criar** novo serviço com: nome, descrição, duração, preço, cor identificadora
- **Editar** qualquer campo
- **Organizar** por categorias
- **Reordenar** com arrastar e soltar (drag-and-drop)
- **Ativar/desativar** serviços

### Configurações por serviço

Cada serviço pode ter opções específicas:

| Configuração | Descrição |
|---|---|
| **Requer ficha de avaliação** | Abre a ficha de anamnese (Rosto, Corpo ou Ambos) durante o atendimento |
| **Requer consentimento** | Solicita assinatura do cliente antes do procedimento |
| **Requer fotos antes/depois** | Ativa a aba de fotos clínicas na workspace |
| **Requer assinatura de conclusão** | Solicita assinatura ao finalizar o atendimento |
| **Moeda e IVA** | Define a moeda e taxa de imposto aplicável |
| **Visível no agendamento público** | Controla se aparece na página pública |
| **Mostrar preço** | Exibe ou oculta o preço na página pública |

### Campos personalizados (Formulários dinâmicos)

Cada serviço pode ter campos de formulário próprios que o especialista preenche durante o atendimento:

- **Texto** — Campo de texto simples
- **Texto longo** — Área de texto para observações
- **Seleção** — Lista de opções predefinidas
- **Checkbox** — Opção sim/não
- **Ficheiro** — Upload de documentos ou imagens

### Categorias de serviços

Organize os serviços em categorias (ex: "Facial", "Corporal", "Capilar") para facilitar a navegação, tanto no sistema como na página de agendamento público.

### Especialistas associados

Pode associar quais profissionais estão habilitados a realizar cada serviço.

---

## 9. Produtos

### O que são produtos?

Produtos são itens utilizados durante os atendimentos ou vendidos aos clientes (ex: cremes, séruns, máscaras).

### Gerir produtos

Aceda pelo menu **Produtos**:

- **Criar** produto com: nome, preço, SKU, marca, categoria, descrição
- **Imagem** — Upload de foto do produto
- **Stock** — Controlo de quantidade em inventário
- **Ativar/desativar** produto
- **Categorias** — Organize por categorias (geridas separadamente)

### Onde aparecem os produtos?

- Na **workspace clínica**, onde o especialista regista os produtos utilizados no atendimento
- Na **ficha do cliente**, no histórico de produtos
- Nos **relatórios** de produtos mais utilizados

---

## 10. Cobranças

### O que é uma cobrança?

Uma cobrança é um registo financeiro associado a um cliente, representando um valor a pagar por serviços ou produtos.

### Criar cobrança

1. Aceda a **Cobranças → Nova Cobrança**
2. Selecione o **cliente**
3. Adicione itens (serviços e/ou produtos) com quantidade e preço
4. Defina a **data de vencimento**
5. Adicione **notas** se necessário
6. Clique em **Guardar**

### Gerir cobranças

- **Pesquisar** por nome de cliente
- **Filtrar** por status (Pendente, Pago, Cancelado)
- **Marcar como pago** — Regista a data de pagamento
- **Exportar PDF** — Gera um documento da cobrança para envio ou impressão
- **Enviar por e-mail** — Envia a cobrança directamente ao cliente por e-mail
- **Enviar por WhatsApp** — Envia notificação com os dados da cobrança
- **Associar a agendamento** — Vincule a cobrança a um atendimento específico

---

## 11. Faturamento

### Para que serve?

A secção de **Faturamento** oferece uma vista consolidada de todos os atendimentos com informação financeira.

### O que mostra

- Lista de atendimentos com **valor** e **status de pagamento**
- **Filtros** por período e status
- **Pesquisa** por nome de cliente
- **Indicadores de tendência** (mini-gráficos sparkline)
- Paginação para navegar grandes volumes de dados

---

## 12. Relatórios

### Acesso

Aceda pelo menu **Relatórios**. Disponível apenas para Administradores.

### Filtro de período

No topo, defina o intervalo de datas para análise. Atalhos rápidos:
- **Últimos 7 dias**
- **Últimos 30 dias**
- **Últimos 90 dias**

### Tipos de relatório

#### Resumo Executivo
Visão geral com KPIs principais: número de clientes, atendimentos realizados, receita total.

#### Relatório Financeiro
- Receita total e evolução temporal
- Ticket médio
- Gráficos de desempenho financeiro

#### Relatório de Clientes
- Novos clientes no período
- Clientes inativos
- Distribuição e tendências

#### Relatório de Atendimentos
- Volume de atendimentos por período
- Distribuição por status
- Horários mais procurados

#### Relatório de Produtos
- Produtos mais utilizados
- Situação de stock
- Tendências de consumo

#### Relatório de Especialistas
- Receita por profissional
- Número de atendimentos por especialista
- Comparativo de desempenho

### Exportação

- **Excel (XLSX)** — Exporta os dados em formato de planilha
- **PDF** — Gera um relatório para impressão (via função de impressão do navegador)

---

## 13. Clientes Inativos

### O que é um cliente inativo?

Um cliente é considerado inativo quando **não realiza um atendimento há mais de 3 meses** (configurável nas definições).

### Onde ver

- **Alerta no Dashboard** — Notificação visual quando existem clientes inativos
- **Página dedicada** — Aceda pelo alerta ou pelo menu, com detalhes:
  - Nome do cliente
  - Último atendimento
  - Dias de inatividade
  - Contacto (telefone/e-mail)

### Notificações automáticas

Quando configurado, o sistema pode enviar automaticamente:
- **Relatório semanal** por e-mail aos administradores
- **Mensagens WhatsApp** de reativação (via integração n8n)

---

## 14. Marketing (Campanhas & Avaliações Google)

O módulo de Marketing é composto por duas funcionalidades: **Campanhas** e **Avaliações Google**.

### 14.1 Campanhas

O módulo de Campanhas permite criar e enviar comunicações em massa aos seus clientes por **E-mail**, **SMS** ou **WhatsApp**.

#### Criar campanha

1. Aceda a **Marketing → Nova Campanha**
2. Dê um **nome** à campanha
3. Escolha o **canal** de envio (E-mail, SMS ou WhatsApp)
4. Defina a **audiência**:
   - **Todos** — Todos os clientes com contacto válido
   - **Novos** — Clientes com primeira visita no último mês
   - **Ativos** — Clientes com visita no último mês
   - **Inativos** — Clientes sem visita há mais de 1 mês
5. Redija o **conteúdo** da mensagem
6. Para e-mail, configure:
   - **Assunto** do e-mail
   - **Imagem de cabeçalho** (opcional)
   - **Botão CTA** (texto + URL, opcional)
7. Configure o **controlo anti-bloqueio** (tamanho do lote e intervalo entre envios)
8. Clique em **Enviar Teste** para validar com 1 destinatário
9. Clique em **Enviar Campanha** para envio completo

#### Pré-visualização

O editor mostra uma pré-visualização em tempo real do e-mail ou SMS, incluindo:
- Estimativa de duração total do envio
- Hora prevista de conclusão

### 14.2 Avaliações Google

O módulo de Avaliações Google automatiza pedidos de feedback após atendimentos concluídos.

#### Como funciona

1. Aceda a **Marketing → Avaliações**
2. **Conecte o seu negócio Google** — pesquise o nome do negócio e selecione o resultado correto
3. **Ative o switch** para começar a enviar pedidos automaticamente
4. **Configure os canais** — selecione um ou mais canais (WhatsApp, E-mail, SMS)
5. **Personalize as mensagens** — cada canal tem o seu próprio template de mensagem
6. **Defina o intervalo** — quantos dias entre cada reenvio (3 dias a 6 meses)
7. **Defina o máximo de envios** — quantas vezes cada cliente é contactado (1 a 5)

#### Ciclo automático

Quando um atendimento é concluído:
1. O sistema cria um pedido de avaliação para o cliente
2. Envia a mensagem personalizada pelos canais configurados
3. Se o cliente **não avaliar**, reenvia após o intervalo definido
4. Se o cliente **clicar no link de confirmação**, o sistema pára de reenviar
5. Atinge o máximo de envios → pára automaticamente

#### O que o cliente recebe

Uma mensagem com dois links:
- **Link para avaliar** — Abre diretamente a página de avaliação do Google
- **Link para confirmar** — O cliente clica para indicar que já avaliou (e parar de receber lembretes)

#### Indicadores

Na secção de Avaliações, vê:
- **Total de envios** realizados
- **Confirmações** recebidas
- **Pendentes** (aguardam confirmação ou próximo envio)
- **Na fila** (prontos para o próximo envio)

#### Variáveis disponíveis nas mensagens

| Variável | Descrição |
|----------|-----------|
| `{nome}` | Primeiro nome do cliente |
| `{nome_completo}` | Nome completo do cliente |
| `{link_google}` | Link direto para a página de avaliação Google |
| `{link_confirmar}` | Link para o cliente confirmar que já avaliou |
| `{negocio}` | Nome da clínica |

---

## 15. Configurações

Aceda pelo menu **Configurações** (apenas Administradores).

### 15.1 Agenda

Defina parâmetros gerais da clínica:

| Definição | Descrição |
|---|---|
| **Nome da clínica** | Nome exibido no sistema e nas comunicações |
| **Morada** | Endereço da clínica |
| **Telefone** | Contacto principal |
| **Fuso horário** | Fuso horário para cálculo de horários |
| **Moeda** | Moeda utilizada para preços e cobranças |
| **Intervalo do calendário** | Granularidade do calendário (15min, 30min, 45min, 1h) |
| **Antecedência do lembrete** | Quanto tempo antes do agendamento é enviado o lembrete |
| **Dias de inatividade** | Após quantos dias sem visita um cliente é considerado inativo |
| **Multi-serviço** | Permitir agendar múltiplos serviços num único atendimento |

### 15.2 Horários da Empresa

Defina os horários de funcionamento da clínica:

- Configure **cada dia da semana** individualmente
- Suporte a **múltiplos turnos** por dia (ex: 09h–12h + 14h–18h)
- **Ative/desative dias** (ex: desativar Domingo)

### 15.3 Horários dos Especialistas

Cada especialista pode ter horários personalizados:

- Horários por **dia da semana**
- Suporte a **múltiplos turnos** por dia
- Se não definidos, aplica-se automaticamente o **horário da empresa**
- Indicação visual quando o horário do especialista difere do da empresa

### 15.4 Equipa (Gestão de Utilizadores)

Gerir os utilizadores do sistema:

- **Criar** novo utilizador (nome, e-mail, telefone, papel)
- **Editar** dados e alterar papel
- **Eliminar** utilizador (com limpeza de todos os dados associados)
- **Atribuir papel**: Administrador, Especialista ou Atendimento
- **Reset de senha** administrativo

### 15.5 Permissões

Matriz visual de permissões por papel e módulo, apresentada em modo de consulta, mostrando quem tem acesso a quê.

### 15.6 E-mail

#### Templates de Sistema
Modelos de e-mail enviados automaticamente pelo sistema:
- **Boas-vindas** — Enviado quando um novo utilizador é criado
- **Recuperação de senha** — Enviado ao solicitar redefinição de senha

#### Templates de Notificação
Modelos para comunicações com clientes:
- Marcação Confirmada
- Marcação Alterada
- Cancelamento
- Lembrete
- Aniversário
- Cliente Inativo

Cada template tem um **editor visual HTML** com pré-visualização em tempo real e suporte a variáveis dinâmicas:
- `{nome}` — Primeiro nome do cliente
- `{nome_completo}` — Nome completo
- `{data}` — Data da marcação
- `{horario}` — Hora da marcação
- `{servico}` — Nome do serviço
- `{especialista}` — Nome do profissional
- `{negocio}` — Nome da clínica
- `{link_agendamento}` — Link para agendar
- `{link_cancelar}` — Link de cancelamento
- `{link_site}`, `{link_instagram}`, `{link_facebook}` — Links de redes sociais

#### Configuração de E-mail

O sistema utiliza a API do **Resend** para envio de todos os e-mails (notificações, cobranças, boas-vindas, recuperação de senha). Configure a API Key e os dados do remetente em **Configurações > E-mail**.

### 15.7 Notificações (SMS e WhatsApp)

Gestão de notificações por **SMS** e **WhatsApp**:

- Ative/desative cada tipo de notificação individualmente
- Edite o conteúdo das mensagens
- As mesmas variáveis dinâmicas dos templates de e-mail estão disponíveis

### 15.8 Integrações

Configure ligações a serviços externos:

| Integração | Campos |
|---|---|
| **WhatsApp (Evolution API)** | URL da API, API Key, Nome da Instância |
| **SMS** | URL da API, ativação |
| **Webhook de Marcações** | URL do n8n para confirmação/cancelamento/lembrete |
| **Webhook de Marketing** | URL do n8n para campanhas (opcional) |
| **Atendimentos Esquecidos** | URL do n8n + endpoint de verificação automática |
| **Automação Diária** | Ativação de aniversariantes e inativos via n8n |
| **Incorporação** | Código iframe para websites externos |
| **Exportação SQL** | Download de backup da base de dados |
| **Limpeza de Dados** | Eliminação de dados transacionais (requer backup + confirmação) |

### 15.9 Atendimentos Esquecidos

O sistema deteta automaticamente atendimentos que o especialista esqueceu de finalizar:

- **+30 minutos** após o horário previsto de término → alerta enviado a administradores e recepcionistas
- **+60 minutos** → atendimento encerrado automaticamente com nota no registo
- A verificação ocorre a cada 30 minutos durante o horário comercial (via n8n)
- Os horários comerciais são enviados automaticamente ao n8n quando atualizados

### 15.10 Google Calendar (Sincronização)

Sincronize a agenda com o Google Calendar:

1. O sistema gera um **link iCal** automaticamente
2. Copie o link e adicione como subscrição no Google Calendar
3. Disponível por **especialista** ou para a **clínica inteira**
4. Pode ativar/desativar feeds individualmente

### 15.11 Página de Agendamento

Personalize a página pública de agendamento:

- **Logo** e **imagem de capa**
- **Título** e **cor de fundo**
- **Campos obrigatórios** (e-mail, data de nascimento, género, NIF)
- **Redes sociais** (Instagram, Facebook, Website)
- **Notas de rodapé** e link para Termos de Uso
- **Código de tracking** (analytics)
- **Escolha de especialista** (ativável/desativável)

---

## 16. Perfil do Utilizador

Cada utilizador pode gerir o seu próprio perfil:

- **Nome** — Editar o nome exibido no sistema
- **Telefone** — Atualizar o número de contacto
- **Avatar** — Upload de foto de perfil com recorte (crop)
- **E-mail** — Visível em modo de leitura (não editável)

---

## 17. Referência de Status

### Status dos Agendamentos

| Status | Cor | Significado |
|---|---|---|
| **Agendado** | 🔵 Azul | O atendimento está marcado e aguarda a data/hora |
| **Em andamento** | 🟡 Amarelo | O atendimento está a decorrer neste momento |
| **Concluído** | 🟢 Verde | O atendimento foi realizado com sucesso |
| **Cancelado** | 🔴 Vermelho | O atendimento foi cancelado |

### Fluxo típico de um agendamento

```
Agendado → Em andamento → Concluído
    ↓                        ↑
 Cancelado          (auto-encerramento
                     após 60 min esquecido)
```

### Status das Cobranças

| Status | Significado |
|---|---|
| **Pendente** | A cobrança foi emitida mas ainda não foi paga |
| **Pago** | O pagamento foi registado |
| **Cancelado** | A cobrança foi anulada |

---

## 18. Perguntas Frequentes

### Como partilho a página de agendamento com os meus clientes?

No menu superior do sistema, clique no ícone de **partilha** para copiar o link da página de agendamento público. Envie-o por WhatsApp, e-mail ou redes sociais.

### Um cliente pode agendar sozinho?

Sim! Através da página de agendamento público, o cliente pode ver os serviços disponíveis, escolher um especialista, selecionar data/hora e confirmar a marcação — tudo sem precisar de login.

### Como configuro os lembretes automáticos?

1. Em **Configurações → Agenda**, defina a antecedência do lembrete (ex: 24h)
2. Em **Configurações → Notificações**, ative o template de "Lembrete" para WhatsApp e/ou SMS
3. Configure a integração com o n8n conforme documentado em `N8N_WORKFLOWS.md`

### Como exporto um relatório?

Na página de **Relatórios**, selecione o período desejado e clique em **"Exportar Excel"** ou use a função de impressão do navegador (Ctrl+P) para gerar PDF.

### Posso ter horários diferentes para cada especialista?

Sim. Em **Configurações → Horários dos Especialistas**, defina horários individuais. Se não definir, o sistema aplica automaticamente o horário da empresa.

### Como sei quais clientes estão inativos?

O sistema alerta automaticamente no Dashboard. Pode também aceder à lista completa em **Clientes Inativos**, que mostra quanto tempo cada cliente está sem visita.

### Como adiciono fotos antes/depois?

1. Configure o serviço para **"Requer fotos antes/depois"** em Serviços
2. Durante o atendimento, na Workspace Clínica, use a aba **"Fotos"** para fazer upload
3. As imagens ficam disponíveis na ficha do cliente, organizadas por atendimento

### O que acontece se o especialista esquecer de finalizar um atendimento?

O sistema deteta automaticamente:
- Após **30 minutos** do horário previsto de término, um alerta é enviado aos administradores e recepcionistas
- Após **60 minutos**, o atendimento é **encerrado automaticamente** e todos são notificados
- Uma nota é adicionada ao atendimento indicando o encerramento automático

### Como envio uma campanha de marketing?

1. Aceda a **Marketing → Nova Campanha**
2. Escolha o canal (E-mail, SMS ou WhatsApp), defina a audiência e redija o conteúdo
3. Use **Enviar Teste** para validar e depois **Enviar Campanha** para o envio completo

### Os meus dados estão seguros?

Sim. O sistema implementa múltiplas camadas de segurança:
- Todas as tabelas possuem **políticas de segurança** ao nível da base de dados
- Dados clínicos (fotos, documentos, consentimentos) só são acessíveis a utilizadores autenticados
- Chaves de API e configurações sensíveis são restritas apenas a administradores
- O registo público é desativado — apenas administradores podem criar novos utilizadores
- Dependências são auditadas regularmente contra vulnerabilidades conhecidas
- Todos os campos de notificação possuem fallbacks para garantir integridade nos envios

---

*Documento atualizado em Março 2026 — Bellex v1.1*
