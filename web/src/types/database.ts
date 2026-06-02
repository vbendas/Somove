export type UserRole = "client" | "therapist" | "admin";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          country: string | null;
          setup_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          country?: string | null;
          setup_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: UserRole;
          country?: string | null;
          setup_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      therapist_profile: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          credentials: string[] | null;
          modalities: string[] | null;
          session_price_cents: number | null;
          free_first_session: boolean;
          default_session_duration: number;
          availability_rules: Record<string, unknown> | null;
          mute_hours: Record<string, unknown> | null;
          profile_image_url: string | null;
          cal_user_id: string | null;
          cal_api_key: string | null;
          cal_event_type_id: string | null;
          stripe_secret_key: string | null;
          stripe_webhook_secret: string | null;
          daily_api_key: string | null;
          resend_api_key: string | null;
          mirotalk_api_key: string | null;
          mirotalk_url: string | null;
          stripe_account_id: string | null;
          stripe_onboarding_done: boolean;
          stripe_payouts_enabled: boolean;
          timezone: string | null;
          status: string;
          video_provider: string;
          tos_text: string | null;
          tos_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          credentials?: string[] | null;
          modalities?: string[] | null;
          session_price_cents?: number | null;
          free_first_session?: boolean;
          default_session_duration?: number;
          availability_rules?: Record<string, unknown> | null;
          mute_hours?: Record<string, unknown> | null;
          profile_image_url?: string | null;
          cal_user_id?: string | null;
          status?: string;
          mirotalk_api_key?: string | null;
          mirotalk_url?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_done?: boolean;
          stripe_payouts_enabled?: boolean;
          tos_text?: string | null;
          tos_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          credentials?: string[] | null;
          modalities?: string[] | null;
          session_price_cents?: number | null;
          free_first_session?: boolean;
          default_session_duration?: number;
          availability_rules?: Record<string, unknown> | null;
          mute_hours?: Record<string, unknown> | null;
          profile_image_url?: string | null;
          cal_user_id?: string | null;
          status?: string;
          mirotalk_api_key?: string | null;
          mirotalk_url?: string | null;
          video_provider?: string;
          stripe_account_id?: string | null;
          stripe_onboarding_done?: boolean;
          stripe_payouts_enabled?: boolean;
          tos_text?: string | null;
          tos_version?: number;
          created_at?: string;
        };
      };
      session_types: {
        Row: {
          id: string;
          therapist_id: string;
          name: string;
          description: string | null;
          duration_min: number;
          price_cents: number;
          currency: string;
          is_active: boolean;
          is_bundle: boolean;
          bundle_sessions: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          name: string;
          description?: string | null;
          duration_min: number;
          price_cents: number;
          currency?: string;
          is_active?: boolean;
          is_bundle?: boolean;
          bundle_sessions?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          name?: string;
          description?: string | null;
          duration_min?: number;
          price_cents?: number;
          currency?: string;
          is_active?: boolean;
          is_bundle?: boolean;
          bundle_sessions?: number | null;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          client_id: string;
          therapist_id: string;
          session_type_id: string | null;
          cal_booking_uid: string | null;
          scheduled_at: string;
          duration_min: number;
          status: string;
          payment_status: string;
          daily_room_url: string | null;
          mirotalk_room_url: string | null;
          mirotalk_room_password: string | null;
          mirotalk_client_password: string | null;
          stripe_checkout_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_paid_cents: number | null;
          currency: string;
          tos_version: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          therapist_id: string;
          session_type_id?: string | null;
          cal_booking_uid?: string | null;
          scheduled_at: string;
          duration_min: number;
          status?: string;
          payment_status?: string;
          daily_room_url?: string | null;
          mirotalk_room_url?: string | null;
          mirotalk_room_password?: string | null;
          mirotalk_client_password?: string | null;
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_paid_cents?: number | null;
          currency?: string;
          tos_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          therapist_id?: string;
          session_type_id?: string | null;
          cal_booking_uid?: string | null;
          scheduled_at?: string;
          duration_min?: number;
          status?: string;
          payment_status?: string;
          daily_room_url?: string | null;
          mirotalk_room_url?: string | null;
          mirotalk_room_password?: string | null;
          mirotalk_client_password?: string | null;
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_paid_cents?: number | null;
          currency?: string;
          tos_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          therapist_id: string;
          session_id: string;
          amount_cents: number;
          platform_fee_cents: number;
          therapist_net_cents: number;
          currency: string;
          method: string;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_transfer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          therapist_id: string;
          session_id: string;
          amount_cents: number;
          platform_fee_cents?: number;
          therapist_net_cents?: number;
          currency?: string;
          method: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          therapist_id?: string;
          session_id?: string;
          amount_cents?: number;
          platform_fee_cents?: number;
          therapist_net_cents?: number;
          currency?: string;
          method?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          created_at?: string;
        };
      };
      client_profiles: {
        Row: {
          id: string;
          user_id: string;
          therapist_id: string;
          intake_data: Record<string, unknown> | null;
          timezone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          therapist_id: string;
          intake_data?: Record<string, unknown> | null;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          therapist_id?: string;
          intake_data?: Record<string, unknown> | null;
          timezone?: string | null;
          created_at?: string;
        };
      };
      client_notes: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string;
          session_id: string | null;
          body: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          session_id?: string | null;
          body?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          client_id?: string;
          session_id?: string | null;
          body?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string;
          status: string;
          session_id: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          status?: string;
          session_id?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          client_id?: string;
          status?: string;
          session_id?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_emergency_flag: boolean;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_emergency_flag?: boolean;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          is_emergency_flag?: boolean;
          sent_at?: string;
          read_at?: string | null;
        };
      };
      session_credits: {
        Row: {
          id: string;
          client_id: string;
          therapist_id: string;
          total_credits: number;
          used_credits: number;
          remaining_credits: number;
          session_type_id: string | null;
          stripe_payment_intent_id: string | null;
          purchased_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          therapist_id: string;
          total_credits: number;
          used_credits?: number;
          session_type_id?: string | null;
          stripe_payment_intent_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          therapist_id?: string;
          total_credits?: number;
          used_credits?: number;
          session_type_id?: string | null;
          stripe_payment_intent_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      terms_acceptances: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string;
          tos_version: number;
          accepted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          tos_version: number;
          accepted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          client_id?: string;
          tos_version?: number;
          accepted_at?: string;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          therapist_id: string;
          name: string;
          colour: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          name: string;
          colour?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          name?: string;
          colour?: string;
          is_system?: boolean;
          created_at?: string;
        };
      };
      conversation_tags: {
        Row: {
          conversation_id: string;
          tag_id: string;
        };
        Insert: {
          conversation_id: string;
          tag_id: string;
        };
        Update: {
          conversation_id?: string;
          tag_id?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          message_id: string;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: number;
          platform_name: string;
          platform_tagline: string | null;
          logo_url: string | null;
          primary_color: string;
          accent_color: string;
          background_color: string;
          open_registration: boolean;
          require_therapist_approval: boolean;
          support_email: string;
          smtp_host: string | null;
          smtp_port: number;
          smtp_user: string | null;
          smtp_password: string | null;
          smtp_from_email: string | null;
          smtp_from_name: string | null;
          smtp_enabled: boolean;
          default_video_provider: string;
          platform_fee_percent: number;
          min_session_price_cents: number;
          max_session_price_cents: number;
          terms_of_service: string | null;
          privacy_policy: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          platform_name?: string;
          platform_tagline?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          background_color?: string;
          open_registration?: boolean;
          require_therapist_approval?: boolean;
          support_email?: string;
          smtp_host?: string | null;
          smtp_port?: number;
          smtp_user?: string | null;
          smtp_password?: string | null;
          smtp_from_email?: string | null;
          smtp_from_name?: string | null;
          smtp_enabled?: boolean;
          default_video_provider?: string;
          platform_fee_percent?: number;
          min_session_price_cents?: number;
          max_session_price_cents?: number;
          terms_of_service?: string | null;
          privacy_policy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          platform_name?: string;
          platform_tagline?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          background_color?: string;
          open_registration?: boolean;
          require_therapist_approval?: boolean;
          support_email?: string;
          smtp_host?: string | null;
          smtp_port?: number;
          smtp_user?: string | null;
          smtp_password?: string | null;
          smtp_from_email?: string | null;
          smtp_from_name?: string | null;
          smtp_enabled?: boolean;
          default_video_provider?: string;
          platform_fee_percent?: number;
          min_session_price_cents?: number;
          max_session_price_cents?: number;
          terms_of_service?: string | null;
          privacy_policy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          email: string;
          token: string;
          role: string;
          invited_by: string | null;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          token: string;
          role?: string;
          invited_by?: string | null;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          token?: string;
          role?: string;
          invited_by?: string | null;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
  };
}
