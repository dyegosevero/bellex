# Onboarding de Clientes — Bellex

Guia completo do que coletar ao fechar um contrato, separado por tipo de cliente.

---

## Situação 1 — Clínica (cliente direto do plano)

### 1. Dados Cadastrais

| Campo | Exemplo |
|---|---|
| Nome completo do responsável | Dra. Ana Lima |
| CPF do responsável | 000.000.000-00 |
| Nome da clínica / empresa | Studio Corpo & Saúde |
| CNPJ (se tiver) | 00.000.000/0001-00 |
| Endereço completo | Rua X, 123 — São Paulo/SP |
| Telefone (WhatsApp) | (11) 99999-9999 |
| E-mail de acesso ao sistema | ana@studiocorpo.com.br |

### 2. Identidade Visual

| Campo | Obs |
|---|---|
| Logo em SVG ou PNG (fundo transparente) | Mínimo 512px |
| Cor principal da marca | Ex: #e8957a |
| Cor secundária (opcional) | Ex: #2d2d2d |

### 3. Domínio / Acesso

| Campo | Obs |
|---|---|
| Subdomínio desejado | Ex: `studiocorpo` → studiocorpo.bellex.beauty |
| Domínio próprio (se quiser) | Ex: sistema.studiocorpo.com.br |
| Já tem domínio registrado? | Sim/Não — se sim, onde? (Registro.br, GoDaddy…) |

### 4. WhatsApp (Agente IA)

| Campo | Obs |
|---|---|
| Número do WhatsApp da clínica | Deve ser um número dedicado, não pessoal |
| Já usou WhatsApp Business API antes? | Sim/Não |
| Nome de exibição da conta | Ex: Studio Corpo Estética |
| O número já está no WhatsApp Business? | Sim/Não |

> **Atenção:** o número será vinculado à EvoAPI. Ele não pode estar ativo no WhatsApp comum durante a integração.

### 5. Serviços e Agenda

| Campo | Obs |
|---|---|
| Lista de serviços oferecidos | Nome, duração, preço |
| Especialistas / profissionais | Nome e especialidade de cada um |
| Horário de funcionamento | Dias da semana + horários |
| Intervalo entre atendimentos | Ex: 15 min |

### 6. Configuração do Agente IA

| Campo | Obs |
|---|---|
| Nome do agente (como ele se apresenta) | Ex: Luna, Bella, Bia |
| Tom de voz | Formal / Descontraído / Neutro |
| O que o agente pode fazer? | Agendar, informar preços, qualificar lead |
| O que o agente NÃO deve fazer? | Ex: não fala de preços no 1º contato |
| Chave OpenAI própria? | Sim/Não (se não, usa a da plataforma) |

### 7. Financeiro (para faturamento Bellex)

| Campo | Obs |
|---|---|
| Plano contratado | Starter / Pro / Scale |
| Forma de pagamento | PIX / Cartão / Boleto |
| E-mail para nota fiscal | Pode ser o mesmo de acesso |
| Dia de vencimento preferido | Ex: todo dia 10 |

---

## Situação 2 — Workspace (parceiro / revendedor)

O parceiro gerencia múltiplas clínicas dentro do painel Workspace.

### 1. Dados Cadastrais do Parceiro

| Campo | Exemplo |
|---|---|
| Nome completo do responsável | João Ferreira |
| CPF | 000.000.000-00 |
| Nome da empresa / agência | Agência Clínicas Digitais |
| CNPJ | 00.000.000/0001-00 |
| Telefone (WhatsApp) | (11) 99999-9999 |
| E-mail de acesso ao Workspace | joao@agenciaclinicas.com.br |

### 2. Acesso ao Workspace

| Campo | Obs |
|---|---|
| E-mail do administrador principal | Será o owner do workspace |
| Deseja adicionar outros admins? | Sim/Não — se sim, listar e-mails e roles (admin/viewer) |
| Senha provisória | Bellex gera e envia por e-mail |

### 3. Dados das Clínicas Iniciais

Para cada clínica que o parceiro já traz no fechamento, coletar:

- Todos os campos da **Situação 1** acima (uma ficha por clínica)
- Qual plano cada clínica terá
- O parceiro já tem contrato direto com cada clínica?

### 4. Licença do Workspace

| Campo | Obs |
|---|---|
| Plano do workspace | Starter / Pro / Scale |
| Quantidade de seats (clínicas) | Ex: 5 clínicas |
| Tipo de licença | Mensal / Anual |
| Forma de pagamento | PIX / Cartão / Boleto |
| E-mail para nota fiscal | Pode ser o mesmo de acesso |

### 5. White-label (se aplicável)

| Campo | Obs |
|---|---|
| Deseja marca própria no painel? | Sim/Não |
| Logo da agência/empresa | SVG ou PNG fundo transparente |
| Nome do produto | Ex: "ClinicaOS by Agência X" |
| Cor principal | Hex |
| Domínio do workspace | Ex: sistema.agenciaclinicas.com.br |

---

## Checklist de Ativação (pós-coleta)

### Clínica

- [ ] Criar usuário no Supabase Auth (ou enviar convite pelo Workspace)
- [ ] Criar registro em `workspace_clinics` com subdomain e cor
- [ ] Configurar domínio customizado (se tiver) e apontar DNS
- [ ] Subir logo no storage
- [ ] Cadastrar serviços e profissionais no sistema
- [ ] Conectar número WhatsApp na EvoAPI
- [ ] Criar agente IA com system prompt personalizado
- [ ] Fazer teste de ponta a ponta (mensagem → resposta → agendamento)
- [ ] Enviar credenciais de acesso ao cliente

### Workspace

- [ ] Criar usuário owner no Supabase Auth
- [ ] Criar licença em `workspace_licenses`
- [ ] Convidar admins adicionais (se houver) pelo painel Usuários
- [ ] Configurar logo e cor do workspace (se white-label)
- [ ] Configurar domínio do workspace e DNS
- [ ] Criar as clínicas iniciais seguindo o checklist acima para cada uma
- [ ] Apresentar o painel ao parceiro (walkthrough)
- [ ] Enviar credenciais

---

## Documentos a Solicitar (opcional mas recomendado)

- Contrato assinado (PDF)
- Comprovante de CNPJ (cartão CNPJ da Receita)
- Logo em alta resolução
- Print do número WhatsApp ativo no celular (para confirmar titularidade)
