import { supabase } from '@/integrations/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeadSource = 'whatsapp' | 'instagram' | 'manual' | 'webhook'
export type Channel    = 'whatsapp' | 'instagram'
export type ConvStatus = 'open' | 'archived' | 'resolved'
export type MsgStatus  = 'sent' | 'delivered' | 'read' | 'failed'
export type InstanceStatus = 'connected' | 'disconnected' | 'connecting'

export interface PipelineStage {
  id: string
  label: string
  color: string
  position: number
  agent_enabled: boolean
  agent_model: string | null
  agent_prompt: string | null
  agent_schedule: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: LeadSource
  stage_id: string | null
  last_message: string | null
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  lead_id: string | null
  channel: Channel
  status: ConvStatus
  last_message_at: string
  created_at: string
  lead?: Lead
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  text: string
  from_me: boolean
  status: MsgStatus
  media_url: string | null
  media_type: string | null
  created_at: string
}

export interface WhatsAppInstance {
  id: string
  instance_name: string
  api_url: string
  api_key: string | null
  status: InstanceStatus
  phone_number: string | null
  qr_code: string | null
  webhook_url: string | null
  created_at: string
  updated_at: string
}

// ─── Pipeline Stages ────────────────────────────────────────────────────────

export async function fetchStages(): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function updateStagePosition(id: string, position: number) {
  const { error } = await supabase
    .from('pipeline_stages')
    .update({ position, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function upsertStage(stage: Partial<PipelineStage> & { id?: string }) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .upsert({ ...stage, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as PipelineStage
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export async function fetchLeads(stageId?: string): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (stageId) query = query.eq('stage_id', stageId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function moveLead(leadId: string, stageId: string) {
  const { error } = await supabase
    .from('leads')
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', leadId)
  if (error) throw error
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'archived'>) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...lead, archived: false })
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

// ─── Conversations ───────────────────────────────────────────────────────────

export async function fetchConversations(status?: ConvStatus): Promise<Conversation[]> {
  let query = supabase
    .from('conversations')
    .select('*, lead:leads(*)')
    .order('last_message_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, lead:leads(*), messages(*)')
    .eq('id', id)
    .order('created_at', { ascending: true, referencedTable: 'messages' })
    .single()
  if (error) return null
  return data as Conversation
}

export async function createConversation(leadId: string, channel: Channel): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ lead_id: leadId, channel, status: 'open' })
    .select()
    .single()
  if (error) throw error
  return data as Conversation
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sendMessage(conversationId: string, text: string, fromMe = true): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, text, from_me: fromMe, status: 'sent' })
    .select()
    .single()
  if (error) throw error
  // Update last_message_at on conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
  return data as Message
}

// ─── WhatsApp Instances ──────────────────────────────────────────────────────

export async function fetchInstances(): Promise<WhatsAppInstance[]> {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertInstance(inst: Partial<WhatsAppInstance> & { instance_name: string; api_url: string }) {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .upsert({ ...inst, updated_at: new Date().toISOString() }, { onConflict: 'instance_name' })
    .select()
    .single()
  if (error) throw error
  return data as WhatsAppInstance
}

export async function deleteInstance(id: string) {
  const { error } = await supabase.from('whatsapp_instances').delete().eq('id', id)
  if (error) throw error
}
