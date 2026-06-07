export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_anamnesis: {
        Row: {
          appointment_id: string
          client_id: string
          created_at: string
          filled_by: string | null
          form_data: Json
          form_type: string
          id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          created_at?: string
          filled_by?: string | null
          form_data?: Json
          form_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          created_at?: string
          filled_by?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_anamnesis_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_anamnesis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_feedback: {
        Row: {
          appointment_id: string
          client_id: string
          collected_by: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          specialist_id: string | null
        }
        Insert: {
          appointment_id: string
          client_id: string
          collected_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          specialist_id?: string | null
        }
        Update: {
          appointment_id?: string
          client_id?: string
          collected_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          specialist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_form_responses: {
        Row: {
          appointment_id: string
          created_at: string
          field_id: string
          file_urls: Json | null
          id: string
          value: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          field_id: string
          file_urls?: Json | null
          id?: string
          value?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          field_id?: string
          file_urls?: Json | null
          id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_form_responses_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_form_responses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "service_form_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_products: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          stock_deducted_at: string | null
          unit_price: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          stock_deducted_at?: string | null
          unit_price?: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          stock_deducted_at?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_products_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          service_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          service_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          attendant_id: string | null
          cancellation_token: string
          client_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          notes: string | null
          service_id: string | null
          session_number: number | null
          specialist_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          attendant_id?: string | null
          cancellation_token?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          session_number?: number | null
          specialist_id?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendant_id?: string | null
          cancellation_token?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          session_number?: number | null
          specialist_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_page_settings: {
        Row: {
          allow_specialist_choice: boolean
          background_color: string | null
          categories_expanded: boolean
          cover_url: string | null
          created_at: string
          footer_notes: string | null
          id: string
          logo_url: string | null
          marketing_url: string | null
          privacy_url: string | null
          require_birth_date: boolean
          require_email: boolean
          require_gender: boolean
          require_nif: boolean
          social_facebook: string | null
          social_instagram: string | null
          social_website: string | null
          terms_url: string | null
          title: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          allow_specialist_choice?: boolean
          background_color?: string | null
          categories_expanded?: boolean
          cover_url?: string | null
          created_at?: string
          footer_notes?: string | null
          id?: string
          logo_url?: string | null
          marketing_url?: string | null
          privacy_url?: string | null
          require_birth_date?: boolean
          require_email?: boolean
          require_gender?: boolean
          require_nif?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_website?: string | null
          terms_url?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          allow_specialist_choice?: boolean
          background_color?: string | null
          categories_expanded?: boolean
          cover_url?: string | null
          created_at?: string
          footer_notes?: string | null
          id?: string
          logo_url?: string | null
          marketing_url?: string | null
          privacy_url?: string | null
          require_birth_date?: boolean
          require_email?: boolean
          require_gender?: boolean
          require_nif?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_website?: string | null
          terms_url?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      calendar_blocks: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          reason: string | null
          specialist_id: string
          start_datetime: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          reason?: string | null
          specialist_id: string
          start_datetime: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          reason?: string | null
          specialist_id?: string
          start_datetime?: string
        }
        Relationships: []
      }
      calendar_feeds: {
        Row: {
          created_at: string
          feed_type: string
          id: string
          is_active: boolean
          specialist_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          feed_type?: string
          id?: string
          is_active?: boolean
          specialist_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          feed_type?: string
          id?: string
          is_active?: boolean
          specialist_id?: string | null
          token?: string
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: string
          batch_size: number
          channel: string
          content: string
          created_at: string
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          header_image_url: string | null
          id: string
          include_no_optin: boolean
          name: string
          recipient_count: number | null
          scheduled_at: string | null
          send_delay_seconds: number
          sent_at: string | null
          show_header_image: boolean | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience_filter?: string
          batch_size?: number
          channel?: string
          content?: string
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          header_image_url?: string | null
          id?: string
          include_no_optin?: boolean
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          send_delay_seconds?: number
          sent_at?: string | null
          show_header_image?: boolean | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience_filter?: string
          batch_size?: number
          channel?: string
          content?: string
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          header_image_url?: string | null
          id?: string
          include_no_optin?: boolean
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          send_delay_seconds?: number
          sent_at?: string | null
          show_header_image?: boolean | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      charge_items: {
        Row: {
          charge_id: string
          created_at: string
          description: string
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          charge_id: string
          created_at?: string
          description: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          charge_id?: string
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "charge_items_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      charge_sends: {
        Row: {
          charge_id: string
          client_id: string
          id: string
          send_type: string
          sent_at: string
          sent_by: string | null
          status: string
        }
        Insert: {
          charge_id: string
          client_id: string
          id?: string
          send_type: string
          sent_at?: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          charge_id?: string
          client_id?: string
          id?: string
          send_type?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "charge_sends_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_sends_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_consents: {
        Row: {
          appointment_id: string | null
          client_id: string
          collected_by: string | null
          consent_type: string
          created_at: string
          id: string
          is_valid: boolean
          signature_url: string | null
          signed_at: string | null
          signed_by_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          collected_by?: string | null
          consent_type: string
          created_at?: string
          id?: string
          is_valid?: boolean
          signature_url?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          collected_by?: string | null
          consent_type?: string
          created_at?: string
          id?: string
          is_valid?: boolean
          signature_url?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_consents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_images: {
        Row: {
          appointment_id: string | null
          caption: string | null
          client_id: string
          created_at: string
          file_url: string
          id: string
          image_type: string
          uploaded_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          caption?: string | null
          client_id: string
          created_at?: string
          file_url: string
          id?: string
          image_type?: string
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          caption?: string | null
          client_id?: string
          created_at?: string
          file_url?: string
          id?: string
          image_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_images_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_images_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          citizen_card_number: string | null
          clinical_notes: string | null
          consent_given: boolean
          consent_pdf_url: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          height: number | null
          id: string
          interests: string | null
          internal_notes: string | null
          notes: string | null
          notify_email: boolean
          notify_sms: boolean
          notify_whatsapp: boolean
          opt_in: boolean
          phone: string | null
          preferences: string | null
          preferred_schedule: string | null
          profession: string | null
          skin_type: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          citizen_card_number?: string | null
          clinical_notes?: string | null
          consent_given?: boolean
          consent_pdf_url?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          height?: number | null
          id?: string
          interests?: string | null
          internal_notes?: string | null
          notes?: string | null
          notify_email?: boolean
          notify_sms?: boolean
          notify_whatsapp?: boolean
          opt_in?: boolean
          phone?: string | null
          preferences?: string | null
          preferred_schedule?: string | null
          profession?: string | null
          skin_type?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          citizen_card_number?: string | null
          clinical_notes?: string | null
          consent_given?: boolean
          consent_pdf_url?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          height?: number | null
          id?: string
          interests?: string | null
          internal_notes?: string | null
          notes?: string | null
          notify_email?: boolean
          notify_sms?: boolean
          notify_whatsapp?: boolean
          opt_in?: boolean
          phone?: string | null
          preferences?: string | null
          preferred_schedule?: string | null
          profession?: string | null
          skin_type?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          allow_multi_service_booking: boolean | null
          allow_negative_stock: boolean
          booking_url: string | null
          calendar_slot_interval: string | null
          clinic_name: string | null
          created_at: string
          currency: string | null
          default_vat_rate: number | null
          feedback_enabled: boolean
          google_calendar_id: string | null
          hide_off_duty_specialists: string | null
          id: string
          inactive_notification_interval_days: number | null
          inactivity_days: number
          max_booking_future: string | null
          min_booking_lead: string | null
          optimize_bookings: string | null
          phone: string | null
          reminder_lead: string | null
          show_notes_on_calendar: string | null
          sms_sender_name: string | null
          system_url: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_multi_service_booking?: boolean | null
          allow_negative_stock?: boolean
          booking_url?: string | null
          calendar_slot_interval?: string | null
          clinic_name?: string | null
          created_at?: string
          currency?: string | null
          default_vat_rate?: number | null
          feedback_enabled?: boolean
          google_calendar_id?: string | null
          hide_off_duty_specialists?: string | null
          id?: string
          inactive_notification_interval_days?: number | null
          inactivity_days?: number
          max_booking_future?: string | null
          min_booking_lead?: string | null
          optimize_bookings?: string | null
          phone?: string | null
          reminder_lead?: string | null
          show_notes_on_calendar?: string | null
          sms_sender_name?: string | null
          system_url?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_multi_service_booking?: boolean | null
          allow_negative_stock?: boolean
          booking_url?: string | null
          calendar_slot_interval?: string | null
          clinic_name?: string | null
          created_at?: string
          currency?: string | null
          default_vat_rate?: number | null
          feedback_enabled?: boolean
          google_calendar_id?: string | null
          hide_off_duty_specialists?: string | null
          id?: string
          inactive_notification_interval_days?: number | null
          inactivity_days?: number
          max_booking_future?: string | null
          min_booking_lead?: string | null
          optimize_bookings?: string | null
          phone?: string | null
          reminder_lead?: string | null
          show_notes_on_calendar?: string | null
          sms_sender_name?: string | null
          system_url?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consent_texts: {
        Row: {
          content: string
          id: string
          label: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          label: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          label?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      google_calendar_syncs: {
        Row: {
          appointment_id: string | null
          event_end: string | null
          event_start: string | null
          event_summary: string | null
          google_event_id: string
          id: string
          synced_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          event_end?: string | null
          event_start?: string | null
          event_summary?: string | null
          google_event_id: string
          id?: string
          synced_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          event_end?: string | null
          event_start?: string | null
          event_summary?: string | null
          google_event_id?: string
          id?: string
          synced_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_syncs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          label: string
          slug: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          label: string
          slug: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          label?: string
          slug?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          external_id: string | null
          id: string
          notification_type: string
          sent_date: string
          status: string
        }
        Insert: {
          channel: string
          client_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          notification_type: string
          sent_date?: string
          status?: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          notification_type?: string
          sent_date?: string
          status?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          channel: string
          enabled: boolean
          id: string
          recipient: string | null
          setting_key: string
          threshold: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel?: string
          enabled?: boolean
          id?: string
          recipient?: string | null
          setting_key: string
          threshold?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel?: string
          enabled?: boolean
          id?: string
          recipient?: string | null
          setting_key?: string
          threshold?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked: boolean
          created_at: string
          full_name: string
          id: string
          last_auto_assignment_at: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          full_name?: string
          id?: string
          last_auto_assignment_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          full_name?: string
          id?: string
          last_auto_assignment_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_history: {
        Row: {
          appointment_id: string
          channels: Json | null
          channels_payload: Json | null
          client_id: string | null
          client_name: string | null
          created_at: string
          email_external_id: string | null
          email_status: string | null
          id: string
          send_at: string | null
          service_id: string | null
          service_name: string | null
          sms_external_id: string | null
          sms_status: string | null
          specialist_id: string | null
          specialist_name: string | null
          start_time: string | null
          status: string
          status_detail: string | null
          updated_at: string
          whatsapp_external_id: string | null
          whatsapp_status: string | null
        }
        Insert: {
          appointment_id: string
          channels?: Json | null
          channels_payload?: Json | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          email_external_id?: string | null
          email_status?: string | null
          id?: string
          send_at?: string | null
          service_id?: string | null
          service_name?: string | null
          sms_external_id?: string | null
          sms_status?: string | null
          specialist_id?: string | null
          specialist_name?: string | null
          start_time?: string | null
          status?: string
          status_detail?: string | null
          updated_at?: string
          whatsapp_external_id?: string | null
          whatsapp_status?: string | null
        }
        Update: {
          appointment_id?: string
          channels?: Json | null
          channels_payload?: Json | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          email_external_id?: string | null
          email_status?: string | null
          id?: string
          send_at?: string | null
          service_id?: string | null
          service_name?: string | null
          sms_external_id?: string | null
          sms_status?: string | null
          specialist_id?: string | null
          specialist_name?: string | null
          start_time?: string | null
          status?: string
          status_detail?: string | null
          updated_at?: string
          whatsapp_external_id?: string | null
          whatsapp_status?: string | null
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          appointment_id: string | null
          client_id: string
          confirmation_token: string
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_status: string
          id: string
          last_error: string | null
          last_sent_at: string | null
          next_send_at: string | null
          reserved_until: string | null
          send_count: number
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          id?: string
          last_error?: string | null
          last_sent_at?: string | null
          next_send_at?: string | null
          reserved_until?: string | null
          send_count?: number
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          id?: string
          last_error?: string | null
          last_sent_at?: string | null
          next_send_at?: string | null
          reserved_until?: string | null
          send_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_form_fields: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_type: string
          id: string
          options: Json | null
          required: boolean
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          options?: Json | null
          required?: boolean
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          options?: Json | null
          required?: boolean
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_form_fields_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_specialists: {
        Row: {
          created_at: string
          id: string
          service_id: string
          specialist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          specialist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_specialists_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          archived: boolean
          assessment_form_type: string | null
          category_id: string | null
          color: string | null
          consent_policy: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          multi_session: boolean
          name: string
          price: number | null
          requires_assessment_form: boolean
          requires_before_after_photos: boolean
          requires_completion_signature: boolean
          requires_consent_form: boolean
          session_count: number | null
          show_on_booking_page: boolean
          show_price_on_booking_page: boolean
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          active?: boolean
          archived?: boolean
          assessment_form_type?: string | null
          category_id?: string | null
          color?: string | null
          consent_policy?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          multi_session?: boolean
          name: string
          price?: number | null
          requires_assessment_form?: boolean
          requires_before_after_photos?: boolean
          requires_completion_signature?: boolean
          requires_consent_form?: boolean
          session_count?: number | null
          show_on_booking_page?: boolean
          show_price_on_booking_page?: boolean
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          active?: boolean
          archived?: boolean
          assessment_form_type?: string | null
          category_id?: string | null
          color?: string | null
          consent_policy?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          multi_session?: boolean
          name?: string
          price?: number | null
          requires_assessment_form?: boolean
          requires_before_after_photos?: boolean
          requires_completion_signature?: boolean
          requires_consent_form?: boolean
          session_count?: number | null
          show_on_booking_page?: boolean
          show_price_on_booking_page?: boolean
          updated_at?: string
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          callback_data: Json | null
          created_at: string
          id: string
          message: string | null
          message_id: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          callback_data?: Json | null
          created_at?: string
          id?: string
          message?: string | null
          message_id?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          callback_data?: Json | null
          created_at?: string
          id?: string
          message?: string | null
          message_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          encrypted_password: string
          from_email: string
          from_name: string
          host: string
          id: string
          port: number
          updated_at: string
          updated_by: string | null
          use_tls: boolean
          username: string
        }
        Insert: {
          created_at?: string
          encrypted_password?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          port?: number
          updated_at?: string
          updated_by?: string | null
          use_tls?: boolean
          username?: string
        }
        Update: {
          created_at?: string
          encrypted_password?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          port?: number
          updated_at?: string
          updated_by?: string | null
          use_tls?: boolean
          username?: string
        }
        Relationships: []
      }
      specialist_hours: {
        Row: {
          created_at: string
          end_time: string
          id: string
          specialist_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          specialist_id: string
          start_time?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          specialist_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      specialist_services: {
        Row: {
          created_at: string
          custom_duration_minutes: number | null
          id: string
          service_id: string
          specialist_id: string
        }
        Insert: {
          created_at?: string
          custom_duration_minutes?: number | null
          id?: string
          service_id: string
          specialist_id: string
        }
        Update: {
          created_at?: string
          custom_duration_minutes?: number | null
          id?: string
          service_id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_appointment_by_token: {
        Args: { p_token: string }
        Returns: boolean
      }
      client_metrics: { Args: { p_client_id: string }; Returns: Json }
      create_public_booking: {
        Args: {
          p_client_id: string
          p_end_time: string
          p_notes?: string
          p_service_id: string
          p_service_ids?: string[]
          p_specialist_id: string
          p_start_time: string
        }
        Returns: Json
      }
      dashboard_kpis: { Args: never; Returns: Json }
      deduct_appointment_stock: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      get_appointment_by_cancel_token: {
        Args: { p_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inactive_clients: {
        Args: never
        Returns: {
          appointment_count: number
          client_id: string
          client_name: string
          days_inactive: number
          email: string
          last_visit: string
          phone: string
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      last_visits: {
        Args: { p_limit?: number }
        Returns: {
          client_id: string
          client_name: string
          is_active: boolean
          last_visit: string
          specialist_id: string
        }[]
      }
      list_user_emails: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      lookup_client_by_email: { Args: { p_email: string }; Returns: string }
      pending_billings: {
        Args: { p_specialist_id?: string }
        Returns: {
          appointment_id: string
          client_id: string
          client_name: string
          end_time: string
          service_name: string
          specialist_id: string
          specialist_name: string
          start_time: string
          status: string
        }[]
      }
      public_clinic_info: { Args: never; Returns: Json }
      public_specialists: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      restore_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      revenue_per_specialist: {
        Args: never
        Returns: {
          appointment_count: number
          specialist_id: string
          specialist_name: string
          total_revenue: number
        }[]
      }
      search_clients: {
        Args: {
          filter_type?: string
          page_number?: number
          page_size?: number
          search_term?: string
          sort_column?: string
          sort_direction?: string
        }
        Returns: {
          birth_date: string
          cpf: string
          created_at: string
          email: string
          first_visit: string
          full_name: string
          id: string
          last_visit: string
          notes: string
          phone: string
          total_count: number
          visit_count: number
        }[]
      }
      upsert_booking_client:
        | {
            Args: {
              p_birth_date?: string
              p_citizen_card_number?: string
              p_email: string
              p_full_name: string
              p_opt_in?: boolean
              p_phone: string
            }
            Returns: string
          }
        | {
            Args: {
              p_birth_date?: string
              p_citizen_card_number?: string
              p_email: string
              p_full_name: string
              p_notify_email?: boolean
              p_notify_sms?: boolean
              p_notify_whatsapp?: boolean
              p_opt_in?: boolean
              p_phone: string
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "especialista" | "atendimento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "especialista", "atendimento"],
    },
  },
} as const
