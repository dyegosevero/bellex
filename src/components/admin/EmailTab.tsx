import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, EyeOff, Copy, Loader2, Mail, Pencil, Save, Users } from "lucide-react";

/* ─── Unified variables format: always {var} ─── */
const VARIABLES_ALL = [
  { var: "{nome}", desc: "nome do cliente" },
  { var: "{negocio}", desc: "nome do negócio" },
  { var: "{email}", desc: "e-mail do cliente" },
  { var: "{senha}", desc: "senha temporária" },
  { var: "{link}", desc: "link de ação" },
  { var: "{data}", desc: "data da marcação" },
  { var: "{horario}", desc: "horário da marcação" },
  { var: "{servico}", desc: "nome do serviço" },
  { var: "{especialista}", desc: "nome do especialista" },
  { var: "{telefone}", desc: "telefone da clínica" },
  { var: "{link_cancelar}", desc: "link para cancelar" },
  { var: "{link_agendamento}", desc: "link de agendamento online" },
  { var: "{link_site}", desc: "link do website" },
  { var: "{link_instagram}", desc: "link do Instagram" },
  { var: "{link_facebook}", desc: "link do Facebook" },
  { var: "{ultima_visita}", desc: "data última visita" },
  { var: "{dias_inativo}", desc: "dias sem visita" },
];

const SYSTEM_TEMPLATES = [
  {
    slug: "welcome",
    label: "Novo Usuário (Boas-vindas)",
    variables: ["{nome}", "{email}", "{senha}"],
    defaultSubject: "Bem-vindo(a), {nome}!",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <!-- Header -->
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#fff;padding:40px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:300;color:#2D2520;letter-spacing:1px;">Bem-vindo(a), {nome}!</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#7C6E62;line-height:1.7;">A sua conta em {negocio} foi criada com sucesso. Abaixo estão os seus dados de acesso.</p>
        <!-- Access box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:8px;border:1px solid #E8E2DA;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Dados de Acesso</p>
            <p style="margin:12px 0 4px;font-size:13px;color:#7C6E62;">E-mail: <strong style="color:#2D2520;">{email}</strong></p>
            <p style="margin:0;font-size:13px;color:#7C6E62;">Senha temporária: <strong style="color:#2D2520;font-size:15px;letter-spacing:1px;">{senha}</strong></p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#B0A496;">Recomendamos que altere a sua senha no primeiro acesso para maior segurança.</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">Este e-mail foi enviado automaticamente por {negocio}. Não responda.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "recovery",
    label: "Recuperação de Senha",
    variables: ["{nome}", "{link}"],
    defaultSubject: "Recuperação de Senha",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:300;color:#2D2520;">Recuperação de Senha</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#7C6E62;line-height:1.7;">Olá, {nome}. Recebemos um pedido para redefinir a senha da sua conta em {negocio}. Clique no botão abaixo para criar uma nova senha.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="background:#2D2520;border-radius:6px;">
            <a href="{link}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:0.5px;">Redefinir Senha</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#B0A496;line-height:1.6;">Se não solicitou esta alteração, ignore este e-mail — a sua senha permanece a mesma.</p>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">Este e-mail foi enviado automaticamente por {negocio}. Não responda.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
];

const NOTIFICATION_TEMPLATES = [
  {
    slug: "booking_confirmed_email",
    label: "Marcação Confirmada",
    variables: ["{nome}", "{negocio}", "{data}", "{horario}", "{servico}", "{especialista}", "{telefone}", "{link_cancelar}", "{link_site}", "{link_instagram}", "{link_facebook}"],
    defaultSubject: "Marcação Confirmada — {data}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:20px;font-weight:300;color:#FAF8F5;letter-spacing:0.5px;">Marcação Confirmada ✓</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <p style="margin:0 0 24px;font-size:14px;color:#7C6E62;line-height:1.7;">Olá, <strong style="color:#2D2520;">{nome}</strong>! A sua marcação está confirmada. Vemo-nos em breve!</p>
        <!-- Detail cards -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Data &amp; Horário</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#2D2520;">{data} às {horario}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Serviço</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{servico}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Profissional</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{especialista}</p>
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr><td style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:6px;">
            <a href="{link_cancelar}" style="display:inline-block;padding:10px 24px;font-size:13px;color:#7C6E62;text-decoration:none;">Cancelar marcação</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#B0A496;line-height:1.6;">Caso necessite remarcar, entre em contacto connosco com antecedência. Telefone: {telefone}</p>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · <a href="{link_site}" style="color:#B0A496;">{link_site}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "booking_changed_email",
    label: "Marcação Alterada",
    variables: ["{nome}", "{negocio}", "{data}", "{horario}", "{servico}", "{especialista}", "{link_cancelar}"],
    defaultSubject: "Marcação Alterada — {data}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:20px;font-weight:300;color:#FAF8F5;letter-spacing:0.5px;">Marcação Alterada</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <p style="margin:0 0 24px;font-size:14px;color:#7C6E62;line-height:1.7;">Olá, <strong style="color:#2D2520;">{nome}</strong>! A sua marcação em {negocio} foi atualizada. Consulte os novos detalhes abaixo.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Nova Data &amp; Horário</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#2D2520;">{data} às {horario}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Serviço</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{servico}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Profissional</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{especialista}</p>
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:6px;">
            <a href="{link_cancelar}" style="display:inline-block;padding:10px 24px;font-size:13px;color:#7C6E62;text-decoration:none;">Cancelar marcação</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · Este e-mail foi enviado automaticamente.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "booking_cancelled_email",
    label: "Marcação Cancelada",
    variables: ["{nome}", "{negocio}", "{data}", "{horario}", "{servico}", "{especialista}", "{link_agendamento}"],
    defaultSubject: "Marcação Cancelada — {data}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:20px;font-weight:300;color:#FAF8F5;letter-spacing:0.5px;">Marcação Cancelada</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <p style="margin:0 0 20px;font-size:14px;color:#7C6E62;line-height:1.7;">Olá, <strong style="color:#2D2520;">{nome}</strong>. A sua marcação agendada para <strong style="color:#2D2520;">{data}</strong> em {negocio} foi cancelada.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:16px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Serviço Cancelado</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{servico} — {data} às {horario}</p>
          </td></tr>
        </table>
        <p style="margin:0 0 20px;font-size:14px;color:#7C6E62;line-height:1.7;">Se quiser reagendar, utilize o link abaixo ou entre em contacto connosco.</p>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:#2D2520;border-radius:6px;">
            <a href="{link_agendamento}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Agendar novamente</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · Este e-mail foi enviado automaticamente.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "booking_reminder_email",
    label: "Lembrete de Marcação",
    variables: ["{nome}", "{negocio}", "{data}", "{horario}", "{servico}", "{especialista}", "{telefone}", "{link_cancelar}", "{link_site}"],
    defaultSubject: "Lembrete — Marcação {data}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:20px;font-weight:300;color:#FAF8F5;letter-spacing:0.5px;">Lembrete de Marcação</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <p style="margin:0 0 24px;font-size:14px;color:#7C6E62;line-height:1.7;">Olá, <strong style="color:#2D2520;">{nome}</strong>! Este é um lembrete da sua marcação amanhã em {negocio}.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border:1px solid #E8E2DA;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Data &amp; Horário</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#2D2520;">{data} às {horario}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Serviço</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{servico}</p>
          </td></tr>
          <tr><td style="padding:16px 24px;">
            <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B0A496;font-weight:600;">Profissional</p>
            <p style="margin:0;font-size:14px;color:#2D2520;font-weight:500;">{especialista}</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#B0A496;line-height:1.6;">Precisa de cancelar? <a href="{link_cancelar}" style="color:#7C6E62;">Clique aqui</a>. Para mais informações: {telefone}</p>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · <a href="{link_site}" style="color:#B0A496;">{link_site}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "birthday_email",
    label: "Aniversário",
    variables: ["{nome}", "{negocio}", "{link_agendamento}", "{link_site}", "{link_instagram}", "{link_facebook}"],
    defaultSubject: "Feliz Aniversário, {nome}! 🎂",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 8px;font-size:32px;">🎂</p>
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:22px;font-weight:300;color:#FAF8F5;">Feliz Aniversário!</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;text-align:center;">
        <p style="margin:0 0 16px;font-size:16px;color:#2D2520;font-weight:500;">Parabéns, {nome}!</p>
        <p style="margin:0 0 28px;font-size:14px;color:#7C6E62;line-height:1.7;">Toda a equipa de {negocio} deseja-lhe um feliz aniversário e um ano repleto de saúde, alegria e momentos especiais.</p>
        <p style="margin:0 0 28px;font-size:14px;color:#7C6E62;line-height:1.7;">Aproveite esta data especial para cuidar de si! Marque uma sessão e celebre com mimo.</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="background:#2D2520;border-radius:6px;">
            <a href="{link_agendamento}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Agendar Sessão</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · <a href="{link_site}" style="color:#B0A496;">{link_site}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    slug: "inactive_email",
    label: "Cliente Inativo",
    variables: ["{nome}", "{ultima_visita}", "{dias_inativo}", "{link_agendamento}", "{link_site}", "{link_instagram}"],
    defaultSubject: "Sentimos sua falta, {nome}!",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Manrope',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#2D2520;border-radius:10px 10px 0 0;padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A882;font-weight:600;">{negocio}</p>
        <p style="margin:0;font-size:20px;font-weight:300;color:#FAF8F5;letter-spacing:0.5px;">Sentimos a sua falta, {nome}.</p>
      </td></tr>
      <tr><td style="background:#fff;padding:40px;">
        <p style="margin:0 0 20px;font-size:14px;color:#7C6E62;line-height:1.7;">Faz <strong style="color:#2D2520;">{dias_inativo} dias</strong> que não o(a) vemos por aqui. A última visita foi em <strong style="color:#2D2520;">{ultima_visita}</strong>.</p>
        <p style="margin:0 0 28px;font-size:14px;color:#7C6E62;line-height:1.7;">Cuidar de si faz diferença. Que tal agendarmos uma sessão? Estamos prontos para o(a) receber.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#2D2520;border-radius:6px;">
            <a href="{link_agendamento}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Marcar Sessão</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#B0A496;line-height:1.6;">Tem dúvidas? Contacte-nos pelo Instagram <a href="{link_instagram}" style="color:#7C6E62;">@{negocio}</a>.</p>
      </td></tr>
      <tr><td style="background:#FAF8F5;border-top:1px solid #E8E2DA;border-radius:0 0 10px 10px;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#B0A496;">{negocio} · <a href="{link_site}" style="color:#B0A496;">{link_site}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
];

const STAFF_TEMPLATES = [
  {
    slug: "staff_booking_confirmed_email",
    label: "Nova Marcação (Equipe)",
    variables: ["{nome_cliente}", "{negocio}", "{servico}", "{especialista}", "{data}", "{horario}"],
    defaultSubject: "Nova Marcação — {nome_cliente} — {servico}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: 'Manrope', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #E8E2DA; padding: 40px;">
    <div style="display: inline-block; background: #22C55E; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Nova Marcação</div>
    <h1 style="font-size: 18px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #2D2520; margin: 0 0 20px;">{negocio}</h1>
    <table style="width: 100%; font-size: 14px; color: #807668; line-height: 1.8;">
      <tr><td style="font-weight: 600; width: 110px;">Cliente:</td><td>{nome_cliente}</td></tr>
      <tr><td style="font-weight: 600;">Serviço:</td><td>{servico}</td></tr>
      <tr><td style="font-weight: 600;">Especialista:</td><td>{especialista}</td></tr>
      <tr><td style="font-weight: 600;">Data:</td><td>{data}</td></tr>
      <tr><td style="font-weight: 600;">Horário:</td><td>{horario}</td></tr>
    </table>
    <p style="font-size: 11px; color: #B0A496; margin: 24px 0 0; border-top: 1px solid #E8E2DA; padding-top: 16px;">
      Esta é uma notificação automática do sistema {negocio}.
    </p>
  </div>
</body></html>`,
  },
  {
    slug: "staff_booking_changed_email",
    label: "Marcação Alterada (Equipe)",
    variables: ["{nome_cliente}", "{negocio}", "{servico}", "{especialista}", "{data}", "{horario}"],
    defaultSubject: "Marcação Alterada — {nome_cliente} — {servico}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: 'Manrope', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #E8E2DA; padding: 40px;">
    <div style="display: inline-block; background: #F59E0B; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Marcação Alterada</div>
    <h1 style="font-size: 18px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #2D2520; margin: 0 0 20px;">{negocio}</h1>
    <table style="width: 100%; font-size: 14px; color: #807668; line-height: 1.8;">
      <tr><td style="font-weight: 600; width: 110px;">Cliente:</td><td>{nome_cliente}</td></tr>
      <tr><td style="font-weight: 600;">Serviço:</td><td>{servico}</td></tr>
      <tr><td style="font-weight: 600;">Especialista:</td><td>{especialista}</td></tr>
      <tr><td style="font-weight: 600;">Data:</td><td>{data}</td></tr>
      <tr><td style="font-weight: 600;">Horário:</td><td>{horario}</td></tr>
    </table>
    <p style="font-size: 11px; color: #B0A496; margin: 24px 0 0; border-top: 1px solid #E8E2DA; padding-top: 16px;">
      Esta é uma notificação automática do sistema {negocio}.
    </p>
  </div>
</body></html>`,
  },
  {
    slug: "staff_booking_cancelled_email",
    label: "Marcação Cancelada (Equipe)",
    variables: ["{nome_cliente}", "{negocio}", "{servico}", "{especialista}", "{data}", "{horario}"],
    defaultSubject: "Marcação Cancelada — {nome_cliente} — {servico}",
    defaultContent: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: 'Manrope', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #E8E2DA; padding: 40px;">
    <div style="display: inline-block; background: #EF4444; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Marcação Cancelada</div>
    <h1 style="font-size: 18px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #2D2520; margin: 0 0 20px;">{negocio}</h1>
    <table style="width: 100%; font-size: 14px; color: #807668; line-height: 1.8;">
      <tr><td style="font-weight: 600; width: 110px;">Cliente:</td><td>{nome_cliente}</td></tr>
      <tr><td style="font-weight: 600;">Serviço:</td><td>{servico}</td></tr>
      <tr><td style="font-weight: 600;">Especialista:</td><td>{especialista}</td></tr>
      <tr><td style="font-weight: 600;">Data:</td><td>{data}</td></tr>
      <tr><td style="font-weight: 600;">Horário:</td><td>{horario}</td></tr>
    </table>
    <p style="font-size: 11px; color: #B0A496; margin: 24px 0 0; border-top: 1px solid #E8E2DA; padding-top: 16px;">
      Esta é uma notificação automática do sistema {negocio}.
    </p>
  </div>
</body></html>`,
  },
];


/* ═══════════════════════════════ EMAIL TAB ═══════════════════════════════ */

const EmailTab = () => {
  const [editingTemplate, setEditingTemplate] = useState<{
    slug: string;
    label: string;
    content: string;
    subject: string;
    variables: string[];
    id?: string;
  } | null>(null);

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onBack={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <Mail className="w-5 h-5" /> E-MAIL
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Configure templates de e-mail e o provedor de envio.</p>
      </div>

      {/* Client Templates Card */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Templates de E-mail — Cliente</Label>
        </div>
        <EmailTemplatesSection
          title="Templates de Notificação"
          templates={NOTIFICATION_TEMPLATES}
          onEditTemplate={setEditingTemplate}
        />
      </Card>

      {/* Staff Templates Card */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <Label className="text-sm font-semibold">Templates de E-mail — Equipe</Label>
        </div>
        <EmailTemplatesSection
          title="Templates de Sistema"
          templates={SYSTEM_TEMPLATES}
          onEditTemplate={setEditingTemplate}
        />
        <p className="text-xs text-muted-foreground">
          Templates enviados para especialistas e administradores quando uma marcação é criada, alterada ou cancelada.
        </p>
        <EmailTemplatesSection
          title="Templates de Marcação"
          templates={STAFF_TEMPLATES}
          onEditTemplate={setEditingTemplate}
        />
      </Card>

      <EmailProviderCard />
    </div>
  );
};

/* ─── Reusable Templates Section ─── */

const EmailTemplatesSection = ({
  title,
  templates: templateDefs,
  onEditTemplate,
}: {
  title: string;
  templates: typeof SYSTEM_TEMPLATES;
  onEditTemplate: (t: any) => void;
}) => {
  const queryClient = useQueryClient();
  const enabledQueryKey = ["email-template-enabled", ...templateDefs.map((t) => t.slug)];

  const { data: dbTemplates } = useQuery({
    queryKey: ["email-templates", ...templateDefs.map((t) => t.slug)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .in("slug", templateDefs.map((t) => t.slug))
        .order("slug");
      if (error) throw error;
      return data;
    },
  });

  const { data: enabledSettings } = useQuery({
    queryKey: enabledQueryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_settings")
        .select("*")
        .in("setting_key", templateDefs.map((t) => t.slug));
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((s: any) => { map[s.setting_key] = s.enabled; });
      return map;
    },
  });

  const toggleEnabled = async (slug: string, checked: boolean) => {
    const previousValue = enabledSettings?.[slug] ?? true;

    queryClient.setQueryData(enabledQueryKey, (old: Record<string, boolean> | undefined) => ({
      ...old,
      [slug]: checked,
    }));

    const { error } = await supabase
      .from("notification_settings")
      .upsert(
        { setting_key: slug, enabled: checked, channel: "email" },
        { onConflict: "setting_key" }
      );

    if (error) {
      queryClient.setQueryData(enabledQueryKey, (old: Record<string, boolean> | undefined) => ({
        ...old,
        [slug]: previousValue,
      }));
      toast.error("Erro ao atualizar status do template.");
      return;
    }

    queryClient.invalidateQueries({ queryKey: enabledQueryKey });
  };

  const items = templateDefs.map((def) => {
    const db = dbTemplates?.find((t) => t.slug === def.slug);
    return {
      slug: def.slug,
      label: def.label,
      variables: def.variables,
      content: db?.content ?? def.defaultContent,
      subject: (db as any)?.subject ?? def.defaultSubject ?? "",
      id: db?.id,
    };
  });

  return (
    <div className="space-y-3">
      {title && (
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{title}</Label>
      )}
      {items.map((t) => (
        <div key={t.slug} className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Variáveis: {t.variables.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              checked={enabledSettings?.[t.slug] ?? true}
              onCheckedChange={(checked) => toggleEnabled(t.slug, checked)}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onEditTemplate(t)}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Email Provider Config Card (Resend only) ─── */

const EmailProviderCard = () => {
  const queryClient = useQueryClient();

  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [showResendKey, setShowResendKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load provider settings
  const { isLoading: providerLoading } = useQuery({
    queryKey: ["email-provider-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("*")
        .in("setting_key", ["resend_api_key", "email_reply_to", "email_from_name", "email_from_address"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((s: any) => { map[s.setting_key] = s.setting_value ?? ""; });
      if (map.resend_api_key) setResendApiKey(map.resend_api_key);
      if (map.email_reply_to) setReplyTo(map.email_reply_to);
      if (map.email_from_name) setFromName(map.email_from_name);
      if (map.email_from_address) setFromEmail(map.email_from_address);

      // Fallback: load from_name/from_email from integration_settings legacy or clinic
      if (!map.email_from_name || !map.email_from_address) {
        const { data: clinicData } = await supabase.from("clinic_settings").select("clinic_name").limit(1).maybeSingle();
        if (!map.email_from_name && clinicData?.clinic_name) setFromName(clinicData.clinic_name);
      }

      return map;
    },
  });

  const handleSave = async () => {
    setSaving(true);

    // Save all settings in integration_settings
    const upserts = [
      { setting_key: "resend_api_key", setting_value: resendApiKey },
      { setting_key: "email_reply_to", setting_value: replyTo },
      { setting_key: "email_from_name", setting_value: fromName },
      { setting_key: "email_from_address", setting_value: fromEmail },
      { setting_key: "email_provider", setting_value: "resend" },
    ];

    for (const item of upserts) {
      const { error } = await supabase
        .from("integration_settings")
        .upsert(item, { onConflict: "setting_key" });
      if (error) {
        toast.error(`Erro ao salvar ${item.setting_key}.`);
        setSaving(false);
        return;
      }
    }

    toast.success("Configurações salvas com sucesso.");
    queryClient.invalidateQueries({ queryKey: ["email-provider-settings"] });
    setSaving(false);
  };

  return (
    <Card className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">Configuração de Envio (Resend)</Label>
      </div>

      {/* Resend API Key */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">API Key</Label>
        <div className="relative">
          <Input
            type={showResendKey ? "text" : "password"}
            value={resendApiKey}
            onChange={(e) => setResendApiKey(e.target.value)}
            placeholder="re_xxxxxxxxxxxx"
            className="pr-20"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            name="resend-api-key-secret"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowResendKey((v) => !v)}
              title={showResendKey ? "Esconder" : "Mostrar"}
            >
              {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (resendApiKey) {
                  navigator.clipboard.writeText(resendApiKey);
                  toast.success("Chave copiada!");
                }
              }}
              title="Copiar"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Obtenha em <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a>
        </p>
      </div>

      {/* Sender fields */}
      <div className="border-t border-border pt-4 space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Remetente</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Remetente</Label>
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Bellex" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="noreply@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responder para</Label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="responder@exemplo.com" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Card>
  );
};

/* ─── Template Inline Editor (with side-by-side preview) ─── */

const TemplateEditor = ({
  template,
  onBack,
}: {
  template: { slug: string; label: string; content: string; subject: string; variables: string[]; id?: string };
  onBack: () => void;
}) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(template.content);
  const [subject, setSubject] = useState(template.subject);
  const [previewing, setPreviewing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (template.id) {
        const { error } = await supabase
          .from("message_templates")
          .update({ content, subject } as any)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({ slug: template.slug, label: template.label, content, subject } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Template salvo.");
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      onBack();
    },
    onError: () => toast.error("Erro ao salvar template."),
  });

  const previewHtml = content
    .replace(/\{nome\}/g, "Maria Silva")
    .replace(/\{nome_cliente\}/g, "Maria Silva")
    .replace(/\{email\}/g, "maria@exemplo.com")
    .replace(/\{senha\}/g, "Abc@1234")
    .replace(/\{link\}/g, "#")
    .replace(/\{ultima_visita\}/g, "15/01/2026")
    .replace(/\{dias_inativo\}/g, "47")
    .replace(/\{negocio\}/g, "Bellex")
    .replace(/\{data\}/g, "20/03/2026")
    .replace(/\{horario\}/g, "14:30")
    .replace(/\{servico\}/g, "Limpeza de Pele")
    .replace(/\{especialista\}/g, "Dra. Ana Costa")
    .replace(/\{telefone\}/g, "+351 912 345 678")
    .replace(/\{link_cancelar\}/g, "#")
    .replace(/\{link_agendamento\}/g, "#")
    .replace(/\{link_site\}/g, "#")
    .replace(/\{link_instagram\}/g, "#")
    .replace(/\{link_facebook\}/g, "#");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-light tracking-wider">{template.label}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Variáveis: {template.variables.map((v) => (
              <code key={v} className="bg-muted px-1.5 py-0.5 rounded text-[10px] ml-1">{v}</code>
            ))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assunto do E-mail</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do e-mail..." />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Código HTML</Label>
            <Button variant="outline" size="sm" onClick={() => setPreviewing(!previewing)} className="lg:hidden">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {previewing ? "Editar" : "Pré-visualizar"}
            </Button>
          </div>
          {!previewing && (
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={24} className="font-mono text-xs resize-none" />
          )}
          {previewing && (
            <div className="border border-border rounded-lg overflow-hidden bg-white lg:hidden" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saveMutation.isPending ? "Salvando..." : "Salvar Template"}
            </Button>
            <Button variant="outline" onClick={onBack}>Cancelar</Button>
          </div>
        </div>

        <div className="hidden lg:block space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pré-visualização</Label>
          <div className="border border-border rounded-lg overflow-hidden bg-white p-0" style={{ minHeight: 400 }}>
            <iframe srcDoc={previewHtml} className="w-full border-0" style={{ minHeight: 400 }} title="Email preview" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTab;
