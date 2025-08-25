export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          deck_limit: number | null
          email: string | null
          flashcard_limit_per_deck: number | null
          id: string
          name: string
          picture_url: string | null
          public_data: Json
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deck_limit?: number | null
          email?: string | null
          flashcard_limit_per_deck?: number | null
          id?: string
          name: string
          picture_url?: string | null
          public_data?: Json
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deck_limit?: number | null
          email?: string | null
          flashcard_limit_per_deck?: number | null
          id?: string
          name?: string
          picture_url?: string | null
          public_data?: Json
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          created_at: string | null
          deck_id: string | null
          flashcard_id: string | null
          generated_content: Json
          generation_time_ms: number | null
          generation_type: string
          id: string
          model_used: string | null
          prompt: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deck_id?: string | null
          flashcard_id?: string | null
          generated_content: Json
          generation_time_ms?: number | null
          generation_type: string
          id?: string
          model_used?: string | null
          prompt: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deck_id?: string | null
          flashcard_id?: string | null
          generated_content?: Json
          generation_time_ms?: number | null
          generation_type?: string
          id?: string
          model_used?: string | null
          prompt?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_test_usage: {
        Row: {
          created_at: string
          id: string
          month_year: string
          tests_generated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          tests_generated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          tests_generated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_token_usage: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          tokens_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year: string
          tokens_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          tokens_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deck_collaborators: {
        Row: {
          accepted_at: string | null
          deck_id: string
          id: string
          invited_at: string | null
          invited_by: string
          role: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          deck_id: string
          id?: string
          invited_at?: string | null
          invited_by: string
          role?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          deck_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_collaborators_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          public_data: Json | null
          tags: string[] | null
          total_cards: number | null
          updated_at: string | null
          updated_by: string | null
          visibility: Database["public"]["Enums"]["deck_visibility"]
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          public_data?: Json | null
          tags?: string[] | null
          total_cards?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["deck_visibility"]
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          public_data?: Json | null
          tags?: string[] | null
          total_cards?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["deck_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "decks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          ai_generated: boolean | null
          back_content: string
          back_media_urls: string[] | null
          created_at: string | null
          deck_id: string
          difficulty: Database["public"]["Enums"]["card_difficulty"] | null
          front_content: string
          front_media_urls: string[] | null
          id: string
          position: number | null
          public_data: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          back_content: string
          back_media_urls?: string[] | null
          created_at?: string | null
          deck_id: string
          difficulty?: Database["public"]["Enums"]["card_difficulty"] | null
          front_content: string
          front_media_urls?: string[] | null
          id?: string
          position?: number | null
          public_data?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          back_content?: string
          back_media_urls?: string[] | null
          created_at?: string | null
          deck_id?: string
          difficulty?: Database["public"]["Enums"]["card_difficulty"] | null
          front_content?: string
          front_media_urls?: string[] | null
          id?: string
          position?: number | null
          public_data?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_analytics: {
        Row: {
          average_score: number | null
          best_score: number | null
          correct_attempts: number | null
          created_at: string | null
          first_attempt_at: string | null
          flashcard_id: string
          id: string
          is_mastered: boolean | null
          last_attempt_at: string | null
          latest_score: number | null
          mastered_at: string | null
          mastery_level: number | null
          total_attempts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          correct_attempts?: number | null
          created_at?: string | null
          first_attempt_at?: string | null
          flashcard_id: string
          id?: string
          is_mastered?: boolean | null
          last_attempt_at?: string | null
          latest_score?: number | null
          mastered_at?: string | null
          mastery_level?: number | null
          total_attempts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          correct_attempts?: number | null
          created_at?: string | null
          first_attempt_at?: string | null
          flashcard_id?: string
          id?: string
          is_mastered?: boolean | null
          last_attempt_at?: string | null
          latest_score?: number | null
          mastered_at?: string | null
          mastery_level?: number | null
          total_attempts?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_analytics_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          average_score: number | null
          cards_correct: number | null
          cards_studied: number | null
          deck_id: string
          ended_at: string | null
          id: string
          session_data: Json | null
          session_type: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["study_session_status"] | null
          total_time_seconds: number | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          cards_correct?: number | null
          cards_studied?: number | null
          deck_id: string
          ended_at?: string | null
          id?: string
          session_data?: Json | null
          session_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["study_session_status"] | null
          total_time_seconds?: number | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          cards_correct?: number | null
          cards_studied?: number | null
          deck_id?: string
          ended_at?: string | null
          id?: string
          session_data?: Json | null
          session_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["study_session_status"] | null
          total_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      test_responses: {
        Row: {
          ai_feedback: string
          ai_model_used: string | null
          ai_score: number
          correct_answer_data: Json | null
          created_at: string | null
          expected_answer: string | null
          flashcard_id: string | null
          grading_method: string | null
          id: string
          is_correct: boolean | null
          question_options: Json | null
          question_text: string
          question_type: string | null
          response_time_seconds: number | null
          test_session_id: string
          user_response: string
        }
        Insert: {
          ai_feedback: string
          ai_model_used?: string | null
          ai_score: number
          correct_answer_data?: Json | null
          created_at?: string | null
          expected_answer?: string | null
          flashcard_id?: string | null
          grading_method?: string | null
          id?: string
          is_correct?: boolean | null
          question_options?: Json | null
          question_text: string
          question_type?: string | null
          response_time_seconds?: number | null
          test_session_id: string
          user_response: string
        }
        Update: {
          ai_feedback?: string
          ai_model_used?: string | null
          ai_score?: number
          correct_answer_data?: Json | null
          created_at?: string | null
          expected_answer?: string | null
          flashcard_id?: string | null
          grading_method?: string | null
          id?: string
          is_correct?: boolean | null
          question_options?: Json | null
          question_text?: string
          question_type?: string | null
          response_time_seconds?: number | null
          test_session_id?: string
          user_response?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_responses_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_responses_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          average_score: number | null
          completed_at: string | null
          created_at: string | null
          deck_id: string
          grading_metadata: Json | null
          id: string
          overall_analysis: Json | null
          questions_completed: number | null
          started_at: string | null
          status: string | null
          test_mode: Database["public"]["Enums"]["test_mode"]
          test_questions: Json | null
          test_results: Json | null
          time_spent_seconds: number | null
          total_questions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          deck_id: string
          grading_metadata?: Json | null
          id?: string
          overall_analysis?: Json | null
          questions_completed?: number | null
          started_at?: string | null
          status?: string | null
          test_mode?: Database["public"]["Enums"]["test_mode"]
          test_questions?: Json | null
          test_results?: Json | null
          time_spent_seconds?: number | null
          total_questions?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          deck_id?: string
          grading_metadata?: Json | null
          id?: string
          overall_analysis?: Json | null
          questions_completed?: number | null
          started_at?: string | null
          status?: string | null
          test_mode?: Database["public"]["Enums"]["test_mode"]
          test_questions?: Json | null
          test_results?: Json | null
          time_spent_seconds?: number | null
          total_questions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          correct_reviews: number | null
          created_at: string | null
          first_learned_at: string | null
          flashcard_id: string
          id: string
          last_reviewed_at: string | null
          mastery_level: number | null
          needs_review: boolean | null
          streak: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct_reviews?: number | null
          created_at?: string | null
          first_learned_at?: string | null
          flashcard_id: string
          id?: string
          last_reviewed_at?: string | null
          mastery_level?: number | null
          needs_review?: boolean | null
          streak?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct_reviews?: number | null
          created_at?: string | null
          first_learned_at?: string | null
          flashcard_id?: string
          id?: string
          last_reviewed_at?: string | null
          mastery_level?: number | null
          needs_review?: boolean | null
          streak?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_month_test_usage: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_current_month_token_usage: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_deck_performance_analytics: {
        Args: { p_user_id: string; p_deck_id: string }
        Returns: {
          average_score: number
          flashcard_id: string
          front_content: string
          mastery_level: number
          is_mastered: boolean
          total_attempts: number
          latest_score: number
          last_attempt_at: string
        }[]
      }
      get_test_session_details: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: {
          overall_analysis: Json
          grading_metadata: Json
          responses: Json
          questions_completed: number
          total_questions: number
          session_id: string
          deck_id: string
          deck_name: string
          test_mode: Database["public"]["Enums"]["test_mode"]
          average_score: number
          time_spent_seconds: number
          started_at: string
          completed_at: string
          test_questions: Json
          test_results: Json
        }[]
      }
      get_user_performance_summary: {
        Args: { p_user_id: string }
        Returns: {
          average_mastery_level: number
          average_test_score: number
          total_flashcards: number
          mastered_flashcards: number
          needs_review_flashcards: number
          total_test_sessions: number
        }[]
      }
      get_user_test_history: {
        Args: { p_user_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          session_id: string
          deck_id: string
          deck_name: string
          test_mode: Database["public"]["Enums"]["test_mode"]
          total_questions: number
          questions_completed: number
          average_score: number
          time_spent_seconds: number
          started_at: string
          completed_at: string
          test_questions: Json
          overall_analysis: Json
          grading_metadata: Json
          test_results: Json
        }[]
      }
      increment_test_usage: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_token_usage: {
        Args: { p_user_id: string; p_tokens_used: number }
        Returns: number
      }
      reset_monthly_test_usage: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      reset_old_token_usage: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      save_complete_test_session: {
        Args: {
          p_results?: Json
          p_questions?: Json
          p_analysis?: Json
          p_metadata?: Json
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      card_difficulty: "easy" | "medium" | "hard"
      deck_visibility: "private" | "public" | "shared"
      study_session_status: "active" | "completed" | "paused"
      subscription_tier: "free" | "pro" | "premium"
      test_mode: "flashcard" | "ai_questions"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _name: string; _bucket_id: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { owner: string; metadata: Json; bucketid: string; name: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _name: string; _bucket_id: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          next_key_token?: string
          max_keys?: number
          delimiter_param: string
          prefix_param: string
          bucket_id: string
          next_upload_token?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          sortorder?: string
          sortcolumn?: string
          search?: string
          offsets?: number
          levels?: number
          limits?: number
          bucketname: string
          prefix: string
        }
        Returns: {
          id: string
          name: string
          created_at: string
          last_accessed_at: string
          metadata: Json
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v1_optimised: {
        Args: {
          sortorder?: string
          sortcolumn?: string
          search?: string
          offsets?: number
          levels?: number
          prefix: string
          limits?: number
          bucketname: string
        }
        Returns: {
          metadata: Json
          last_accessed_at: string
          created_at: string
          updated_at: string
          id: string
          name: string
        }[]
      }
      search_v2: {
        Args: {
          prefix: string
          bucket_name: string
          limits?: number
          levels?: number
          start_after?: string
        }
        Returns: {
          updated_at: string
          key: string
          name: string
          id: string
          created_at: string
          metadata: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      card_difficulty: ["easy", "medium", "hard"],
      deck_visibility: ["private", "public", "shared"],
      study_session_status: ["active", "completed", "paused"],
      subscription_tier: ["free", "pro", "premium"],
      test_mode: ["flashcard", "ai_questions"],
    },
  },
  storage: {
    Enums: {},
  },
} as const

