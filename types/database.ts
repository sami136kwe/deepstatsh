
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "books": {
                  Row: {
                    "author": string,"average_rating": number | null,"cover_url": string | null,"created_at": string,"dedup_key": string,"description": string | null,"google_books_id": string | null,"id": string,"info_link": string | null,"is_public_domain": boolean,"language": string | null,"open_library_id": string | null,"popularity_score": number,"process_attempts": number,"processed_at": string | null,"published_year": number | null,"ratings_count": number,"source_category_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author": string,"average_rating"?: number | null,"cover_url"?: string | null,"created_at"?: string,"dedup_key": string,"description"?: string | null,"google_books_id"?: string | null,"id"?: string,"info_link"?: string | null,"is_public_domain"?: boolean,"language"?: string | null,"open_library_id"?: string | null,"popularity_score"?: number,"process_attempts"?: number,"processed_at"?: string | null,"published_year"?: number | null,"ratings_count"?: number,"source_category_id"?: string | null,"title": string
                  }
                  Update: {
                    "author"?: string,"average_rating"?: number | null,"cover_url"?: string | null,"created_at"?: string,"dedup_key"?: string,"description"?: string | null,"google_books_id"?: string | null,"id"?: string,"info_link"?: string | null,"is_public_domain"?: boolean,"language"?: string | null,"open_library_id"?: string | null,"popularity_score"?: number,"process_attempts"?: number,"processed_at"?: string | null,"published_year"?: number | null,"ratings_count"?: number,"source_category_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "books_source_category_id_fkey"
      columns: ["source_category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"card_reviews": {
                  Row: {
                    "card_id": string,"ease_factor": number,"interval_days": number,"last_reviewed_at": string | null,"next_review_at": string,"rating": number | null,"repetitions": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "card_id": string,"ease_factor"?: number,"interval_days"?: number,"last_reviewed_at"?: string | null,"next_review_at"?: string,"rating"?: number | null,"repetitions"?: number,"user_id": string
                  }
                  Update: {
                    "card_id"?: string,"ease_factor"?: number,"interval_days"?: number,"last_reviewed_at"?: string | null,"next_review_at"?: string,"rating"?: number | null,"repetitions"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "card_reviews_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "card_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "card_reviews_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "cards"
      referencedColumns: ["id"]
    }
                  ]
                },"card_views": {
                  Row: {
                    "action": string,"card_id": string,"created_at": string,"id": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"card_id": string,"created_at"?: string,"id"?: never,"user_id": string
                  }
                  Update: {
                    "action"?: string,"card_id"?: string,"created_at"?: string,"id"?: never,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "card_views_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "card_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "card_views_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "cards"
      referencedColumns: ["id"]
    }
                  ]
                },"cards": {
                  Row: {
                    "action_step": string,"body": string,"book_id": string | null,"category_id": string,"content_hash": string,"created_at": string,"difficulty": number,"embedding": string | null,"human_reviewed": boolean,"id": string,"ingestion_run_id": string | null,"language": string,"quality_score": number | null,"quote": string | null,"quote_author": string | null,"rejection_reason": string | null,"search": unknown,"source_type": string,"stash_count": number,"status": string,"style_score": number | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action_step": string,"body": string,"book_id"?: string | null,"category_id": string,"content_hash": string,"created_at"?: string,"difficulty"?: number,"embedding"?: string | null,"human_reviewed"?: boolean,"id"?: string,"ingestion_run_id"?: string | null,"language": string,"quality_score"?: number | null,"quote"?: string | null,"quote_author"?: string | null,"rejection_reason"?: string | null,"search"?: never,"source_type"?: string,"stash_count"?: number,"status"?: string,"style_score"?: number | null,"title": string
                  }
                  Update: {
                    "action_step"?: string,"body"?: string,"book_id"?: string | null,"category_id"?: string,"content_hash"?: string,"created_at"?: string,"difficulty"?: number,"embedding"?: string | null,"human_reviewed"?: boolean,"id"?: string,"ingestion_run_id"?: string | null,"language"?: string,"quality_score"?: number | null,"quote"?: string | null,"quote_author"?: string | null,"rejection_reason"?: string | null,"search"?: never,"source_type"?: string,"stash_count"?: number,"status"?: string,"style_score"?: number | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cards_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cards_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cards_ingestion_run_id_fkey"
      columns: ["ingestion_run_id"]
isOneToOne: false
      referencedRelation: "ingestion_runs"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string | null,"description_en": string | null,"icon": string | null,"id": string,"name_en": string,"name_fr": string,"parent_id": string | null,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"description_en"?: string | null,"icon"?: string | null,"id"?: string,"name_en": string,"name_fr": string,"parent_id"?: string | null,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"description_en"?: string | null,"icon"?: string | null,"id"?: string,"name_en"?: string,"name_fr"?: string,"parent_id"?: string | null,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"ingestion_queries": {
                  Row: {
                    "category_id": string,"created_at": string,"id": string,"last_run_at": string | null,"query_text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"id"?: string,"last_run_at"?: string | null,"query_text": string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"id"?: string,"last_run_at"?: string | null,"query_text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingestion_queries_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"ingestion_runs": {
                  Row: {
                    "books_found": number,"cards_created": number,"cards_rejected": number,"details": NonNullable<Json>,"errors": NonNullable<Json>,"finished_at": string | null,"id": string,"model_calls": number,"source": string,"started_at": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "books_found"?: number,"cards_created"?: number,"cards_rejected"?: number,"details"?: NonNullable<Json>,"errors"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"model_calls"?: number,"source": string,"started_at"?: string,"status"?: string
                  }
                  Update: {
                    "books_found"?: number,"cards_created"?: number,"cards_rejected"?: number,"details"?: NonNullable<Json>,"errors"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"model_calls"?: number,"source"?: string,"started_at"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"daily_goal": number,"display_name": string | null,"id": string,"interests": (string)[],"language": string,"last_active_date": string | null,"longest_streak": number,"onboarded": boolean,"streak_count": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"daily_goal"?: number,"display_name"?: string | null,"id": string,"interests"?: (string)[],"language"?: string,"last_active_date"?: string | null,"longest_streak"?: number,"onboarded"?: boolean,"streak_count"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"daily_goal"?: number,"display_name"?: string | null,"id"?: string,"interests"?: (string)[],"language"?: string,"last_active_date"?: string | null,"longest_streak"?: number,"onboarded"?: boolean,"streak_count"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stashes": {
                  Row: {
                    "card_id": string,"created_at": string,"note": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "card_id": string,"created_at"?: string,"note"?: string | null,"user_id": string
                  }
                  Update: {
                    "card_id"?: string,"created_at"?: string,"note"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stashes_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "card_details"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stashes_card_id_fkey"
      columns: ["card_id"]
isOneToOne: false
      referencedRelation: "cards"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "card_details": {
                  Row: {
                    "action_step": string,"body": string,"book_author": string | null,"book_cover_url": string | null,"book_id": string | null,"book_info_link": string | null,"book_title": string | null,"category_icon": string | null,"category_id": string,"category_name_en": string,"category_name_fr": string,"category_slug": string,"created_at": string,"difficulty": number,"id": string,"language": string,"main_category_id": string | null,"quality_score": number | null,"quote": string | null,"quote_author": string | null,"source_type": string,"stash_count": number,"status": string,"style_score": number | null,"title": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "cards_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cards_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "category_card_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "category_id": string,"language": string,"slug": string,"status": string,"total": number
            }[]
                           },
"category_progress":
{ Args: Record<PropertyKey, never>; Returns: {
              "category_id": string,"completed": number,"icon": string,"name_en": string,"name_fr": string,"reviewed": number,"seen": number,"slug": string,"stashed": number,"total": number
            }[]
                           },
"daily_challenge":
{ Args: { "p_day": string }; Returns: {
              "action_step": string,
"body": string,
"book_author": string | null,
"book_cover_url": string | null,
"book_id": string | null,
"book_info_link": string | null,
"book_title": string | null,
"category_icon": string | null,
"category_id": string,
"category_name_en": string,
"category_name_fr": string,
"category_slug": string,
"created_at": string,
"difficulty": number,
"id": string,
"language": string,
"main_category_id": string | null,
"quality_score": number | null,
"quote": string | null,
"quote_author": string | null,
"source_type": string,
"stash_count": number,
"status": string,
"style_score": number | null,
"title": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "card_details"
        isOneToOne: false
        isSetofReturn: true
      } },
"feed_candidates":
{ Args: { "p_category_ids": (string)[],"p_include": boolean,"p_language": string,"p_limit"?: number }; Returns: {
              "id": string,"main_category_id": string,"rank_score": number
            }[]
                           },
"match_cards":
{ Args: { "match_count"?: number,"match_language": string,"match_threshold"?: number,"query_embedding": string }; Returns: {
              "id": string,"similarity": number,"title": string
            }[]
                           },
"record_activity":
{ Args: { "p_day": string }; Returns: {
              "last_active_date": string,"longest_streak": number,"streak_count": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
