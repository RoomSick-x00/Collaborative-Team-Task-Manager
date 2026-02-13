export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          code: string;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          code?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role?: "owner" | "member";
        };
        Update: {
          role?: "owner" | "member";
        };
      };
      tasks: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "done";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          created_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          updated_at?: string;
        };
      };
    };
  };
}
