# Backlog — Bellex

---

## Infraestrutura de Negócio 🏗️
> Não é feature para o usuário final — é o que permite escalar o produto como SaaS e Whitelabel.

### Multi-tenant + Arquitetura Whitelabel
Separar o conceito de `tenant` no banco com `installation_type` (saas | whitelabel).
Cada tenant tem branding próprio (logo, cor, domínio). Um código, N instalações.
- Tabelas: `tenants`, `licenses`, `seats`
- RLS isolado por tenant
- Branding dinâmico carregado por domínio/subdomínio

### Super Admin — `admin.bellex.com.br`
Painel exclusivo seu. Vê todos os tenants SaaS + todas as licenças Whitelabel.
- Lista de instalações com status (ativo, trial, inadimplente, cancelado)
- Ativar / desativar / expirar manualmente
- Uso de seats por licença
- Impersonar tenant

### Tenant Admin — Painel do Parceiro Whitelabel
Painel no domínio do parceiro (ex: `sistema.mentora.com.br`).
- Lista das clínicas criadas por ele
- Criar nova clínica (consome 1 seat da licença)
- Ver quando a licença expira
- Branding: logo, cor primária, domínio customizado

### Cobrança Recorrente — Integração Asaas
Checkout para iniciar assinatura SaaS diretamente no signup.
- Fluxo: signup → seleciona plano → redirect Asaas Pay → webhook → ativa tenant
- Webhook handler: cria tenant, define plano, redireciona para o app
- Gestão de inadimplência: webhook de atraso desativa tenant, pagamento reativa
- Para licenças WL: cobrança manual via Asaas (boleto/Pix), ativação via Super Admin

---

## Prioridade Alta 🔴
> Features para o usuário final — baseadas em análise do concorrente Gendo.

### Pagamento no Agendamento Online
Cobrança integrada no último passo do `/agendamento` público — Pix e cartão de crédito.
Reduz no-shows e antecipa receita.

### Segmentação Avançada + Campanhas de Marketing
Filtros salvos por serviço, frequência e período + builder de campanha com envio por WhatsApp/e-mail.
Bellex tem alerta de inativos mas não tem builder de campanha nem segmentação por filtros customizados.

---

## Prioridade Média 🟡

### Fila de Espera
Quando não há horário disponível, cliente entra na lista e é notificado automaticamente ao abrir vaga.
Zero receita perdida por agenda cheia.

### Google Reserve
Integração nativa com Google Reserve — clientes agendam direto pelo Google Search ou Maps.
Canal de aquisição orgânico de alta conversão.

### WhatsApp do Próprio Número
Conectar o número do cliente à plataforma via Evolution API com onboarding por QR Code.
As notificações já existem — falta UI amigável para conectar o número da clínica.

### Comandas
Abertura de comanda por cliente durante o atendimento, adição de produtos/serviços em tempo real, fechamento ao final.
Controle de consumo no ponto de venda para clínicas com espaço físico movimentado.

---

## Prioridade Baixa 🟢

### Programa de Fidelidade
Pontos por atendimento e painel de resgate de benefícios no perfil do cliente.
Retenção e aumento de LTV.

### NFe — Nota Fiscal Eletrônica
Integração com Focus NFe ou NFe.io — disparada ao marcar cobrança como paga.
Obrigação legal para clínicas PJ no Brasil.

### App Whitelabel Mobile
React Native + Expo com logo e cores via variáveis de tenant, publicado em iOS/Android.
Clientes finais baixam o app da clínica, não da plataforma.

### IA / Assistente Inteligente
Painel de insights com OpenAI: clientes mais rentáveis, horários de maior falta, tendências.
Diferencial de produto crescente — concorrentes vão ampliar isso.
