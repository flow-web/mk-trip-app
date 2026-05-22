// Generated manually from supabase/migrations/20260520000000_initial.sql — keep in sync.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          owner_id: string
          name: string
          destination: string | null
          start_date: string | null
          end_date: string | null
          trip_type: Database['public']['Enums']['trip_type']
          currency: string
          total_budget: number | null
          cover_color: string
          join_code: string
          hero_image_url: string | null
          hero_image_uploaded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          destination?: string | null
          start_date?: string | null
          end_date?: string | null
          trip_type?: Database['public']['Enums']['trip_type']
          currency?: string
          total_budget?: number | null
          cover_color?: string
          join_code?: string
          hero_image_url?: string | null
          hero_image_uploaded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          destination?: string | null
          start_date?: string | null
          end_date?: string | null
          trip_type?: Database['public']['Enums']['trip_type']
          currency?: string
          total_budget?: number | null
          cover_color?: string
          join_code?: string
          hero_image_url?: string | null
          hero_image_uploaded?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_members: {
        Row: {
          trip_id: string
          user_id: string
          role: Database['public']['Enums']['member_role']
          joined_at: string
        }
        Insert: {
          trip_id: string
          user_id: string
          role?: Database['public']['Enums']['member_role']
          joined_at?: string
        }
        Update: {
          trip_id?: string
          user_id?: string
          role?: Database['public']['Enums']['member_role']
          joined_at?: string
        }
        Relationships: []
      }
      days: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          date: string | null
          label: string | null
          theme: string | null
          zone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_number: number
          date?: string | null
          label?: string | null
          theme?: string | null
          zone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_number?: number
          date?: string | null
          label?: string | null
          theme?: string | null
          zone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          day_id: string
          time: string | null
          title: string
          subtitle: string | null
          category: Database['public']['Enums']['spot_category']
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_id: string
          time?: string | null
          title: string
          subtitle?: string | null
          category?: Database['public']['Enums']['spot_category']
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_id?: string
          time?: string | null
          title?: string
          subtitle?: string | null
          category?: Database['public']['Enums']['spot_category']
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_completions: {
        Row: {
          activity_id: string
          user_id: string
          completed_at: string
        }
        Insert: {
          activity_id: string
          user_id: string
          completed_at?: string
        }
        Update: {
          activity_id?: string
          user_id?: string
          completed_at?: string
        }
        Relationships: []
      }
      spots: {
        Row: {
          id: string
          trip_id: string
          day_id: string | null
          name: string
          description: string | null
          category: Database['public']['Enums']['spot_category']
          zone: string | null
          lat: number | null
          lng: number | null
          price: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_id?: string | null
          name: string
          description?: string | null
          category?: Database['public']['Enums']['spot_category']
          zone?: string | null
          lat?: number | null
          lng?: number | null
          price?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_id?: string | null
          name?: string
          description?: string | null
          category?: Database['public']['Enums']['spot_category']
          zone?: string | null
          lat?: number | null
          lng?: number | null
          price?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          payer_id: string
          amount: number
          currency: string
          category: Database['public']['Enums']['expense_category']
          note: string | null
          spent_at: string
          split_mode: Database['public']['Enums']['split_mode']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          payer_id: string
          amount: number
          currency?: string
          category?: Database['public']['Enums']['expense_category']
          note?: string | null
          spent_at?: string
          split_mode?: Database['public']['Enums']['split_mode']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          payer_id?: string
          amount?: number
          currency?: string
          category?: Database['public']['Enums']['expense_category']
          note?: string | null
          spent_at?: string
          split_mode?: Database['public']['Enums']['split_mode']
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_splits: {
        Row: {
          expense_id: string
          user_id: string
          share: number
        }
        Insert: {
          expense_id: string
          user_id: string
          share?: number
        }
        Update: {
          expense_id?: string
          user_id?: string
          share?: number
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          trip_id: string
          label: string
          category: Database['public']['Enums']['checklist_category']
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          label: string
          category?: Database['public']['Enums']['checklist_category']
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          label?: string
          category?: Database['public']['Enums']['checklist_category']
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          item_id: string
          user_id: string
          completed_at: string
        }
        Insert: {
          item_id: string
          user_id: string
          completed_at?: string
        }
        Update: {
          item_id?: string
          user_id?: string
          completed_at?: string
        }
        Relationships: []
      }
      guide_cards: {
        Row: {
          id: string
          trip_id: string
          kind: Database['public']['Enums']['guide_kind']
          title: string
          body: string | null
          icon_name: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          kind?: Database['public']['Enums']['guide_kind']
          title: string
          body?: string | null
          icon_name?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          kind?: Database['public']['Enums']['guide_kind']
          title?: string
          body?: string | null
          icon_name?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      join_trip_by_code: { Args: { code: string }; Returns: string }
      regenerate_join_code: { Args: { trip: string }; Returns: string }
    }
    Enums: {
      trip_type: 'city_break' | 'road_trip' | 'sport' | 'hike' | 'beach' | 'other'
      member_role: 'owner' | 'editor' | 'viewer'
      spot_category: 'food' | 'culture' | 'nightlife' | 'nature' | 'accommodation' | 'activity' | 'sport'
      expense_category: 'food' | 'transport' | 'hotel' | 'activity' | 'drink' | 'shopping' | 'other'
      split_mode: 'equal' | 'custom'
      checklist_category: 'clothing' | 'gear' | 'docs' | 'other'
      guide_kind: 'danger' | 'warning' | 'info' | 'weather' | 'emergency' | 'food'
    }
    CompositeTypes: Record<string, never>
  }
}
