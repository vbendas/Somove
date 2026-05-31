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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: UserRole;
          country?: string | null;
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
          timezone: string | null;
          status: string;
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
          stripe_checkout_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_paid_cents: number | null;
          currency: string;
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
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_paid_cents?: number | null;
          currency?: string;
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
          stripe_checkout_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_paid_cents?: number | null;
          currency?: string;
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
          currency: string;
          method: string;
          status: string;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          therapist_id: string;
          session_id: string;
          amount_cents: number;
          currency?: string;
          method: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          therapist_id?: string;
          session_id?: string;
          amount_cents?: number;
          currency?: string;
          method?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          session_id?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          client_id?: string;
          session_id?: string | null;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          therapist_id: string;
          client_id: string;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          client_id: string;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          client_id?: string;
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
    };
  };
}
