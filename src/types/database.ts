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
      users: {
        Row: {
          id: string
          email: string
          name: string
          nickname: string | null
          phone: string | null
          profile_image: string | null
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          nickname?: string | null
          phone?: string | null
          profile_image?: string | null
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          nickname?: string | null
          phone?: string | null
          profile_image?: string | null
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      club_members: {
        Row: {
          id: string
          club_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      events: {
        Row: {
          id: string
          club_id: string
          title: string
          description: string | null
          event_date: string
          location: string | null
          max_participants: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          max_participants?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          max_participants?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'attending' | 'not_attending' | 'maybe'
          attended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'attending' | 'not_attending' | 'maybe'
          attended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'attending' | 'not_attending' | 'maybe'
          attended_at?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          club_id: string
          user_id: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          title: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
