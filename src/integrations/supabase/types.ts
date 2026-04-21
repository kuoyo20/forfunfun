export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          address: string | null;
          phone: string | null;
          contact_person: string | null;
          contact_role: string | null;
          status: 'prospect' | 'active' | 'inactive';
          tags: string[];
          notes: string | null;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          address?: string | null;
          phone?: string | null;
          contact_person?: string | null;
          contact_role?: string | null;
          status?: 'prospect' | 'active' | 'inactive';
          tags?: string[];
          notes?: string | null;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      visits: {
        Row: {
          id: string;
          client_id: string;
          visit_date: string;
          visited_by: string | null;
          product_discussed: string | null;
          target_role: string | null;
          outcome: 'positive' | 'neutral' | 'negative' | null;
          client_reaction: string | null;
          key_findings: string | null;
          questions_used: Json | null;
          next_action: string | null;
          next_follow_up_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          visit_date?: string;
          visited_by?: string | null;
          product_discussed?: string | null;
          target_role?: string | null;
          outcome?: 'positive' | 'neutral' | 'negative' | null;
          client_reaction?: string | null;
          key_findings?: string | null;
          questions_used?: Json | null;
          next_action?: string | null;
          next_follow_up_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['visits']['Insert']>;
      };
      follow_ups: {
        Row: {
          id: string;
          visit_id: string | null;
          client_id: string;
          action: string;
          due_date: string | null;
          status: 'pending' | 'done' | 'overdue';
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id?: string | null;
          client_id: string;
          action: string;
          due_date?: string | null;
          status?: 'pending' | 'done' | 'overdue';
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['follow_ups']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type Visit = Database['public']['Tables']['visits']['Row'];
export type VisitInsert = Database['public']['Tables']['visits']['Insert'];
export type VisitUpdate = Database['public']['Tables']['visits']['Update'];

export type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
export type FollowUpInsert = Database['public']['Tables']['follow_ups']['Insert'];
export type FollowUpUpdate = Database['public']['Tables']['follow_ups']['Update'];
