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
      rooms: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      productores: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      artistas: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sesiones: {
        Row: {
          id: string
          room_id: string
          productor_id: string
          artista_id: string
          fecha_inicio: string
          fecha_fin: string
          notas: string | null
          estado: 'programada' | 'en_curso' | 'completada' | 'cancelada'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          productor_id: string
          artista_id: string
          fecha_inicio: string
          fecha_fin: string
          notas?: string | null
          estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          productor_id?: string
          artista_id?: string
          fecha_inicio?: string
          fecha_fin?: string
          notas?: string | null
          estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada'
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}
