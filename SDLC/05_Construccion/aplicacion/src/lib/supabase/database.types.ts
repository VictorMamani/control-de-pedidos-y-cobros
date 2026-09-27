
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
            "audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"business_id": string,"created_at": string,"details": NonNullable<Json>,"entity_id": string,"entity_type": string,"id": string
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"business_id": string,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id": string,"entity_type": string,"id"?: string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"business_id"?: string,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string,"entity_type"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_memberships": {
                  Row: {
                    "business_id": string,"created_at": string,"role": string,"status": string,"user_id": string
                  }
                  Insert: {
                    "business_id": string,"created_at"?: string,"role": string,"status"?: string,"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"role"?: string,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_memberships_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "created_at": string,"created_by": string,"default_currency": string,"id": string,"name": string,"timezone": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by": string,"default_currency"?: string,"id"?: string,"name": string,"timezone"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"default_currency"?: string,"id"?: string,"name"?: string,"timezone"?: string
                  }
                  Relationships: [

                  ]
                },"customers": {
                  Row: {
                    "business_id": string,"contact_value": string | null,"created_at": string,"display_name": string,"id": string
                  }
                  Insert: {
                    "business_id": string,"contact_value"?: string | null,"created_at"?: string,"display_name": string,"id"?: string
                  }
                  Update: {
                    "business_id"?: string,"contact_value"?: string | null,"created_at"?: string,"display_name"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"order_lines": {
                  Row: {
                    "business_id": string,"created_at": string,"description_snapshot": string,"id": string,"order_id": string,"quantity": number,"sku_snapshot": string | null,"unit_price": number
                  }
                  Insert: {
                    "business_id": string,"created_at"?: string,"description_snapshot": string,"id"?: string,"order_id": string,"quantity": number,"sku_snapshot"?: string | null,"unit_price": number
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"description_snapshot"?: string,"id"?: string,"order_id"?: string,"quantity"?: number,"sku_snapshot"?: string | null,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_lines_business_id_order_id_fkey"
      columns: ["business_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "business_id": string,"cancelled_reason": string | null,"commercial_status": string,"created_at": string,"created_by": string,"currency": string,"customer_label": string | null,"fulfillment_status": string,"id": string,"quotation_id": string | null,"reference": string
                  }
                  Insert: {
                    "business_id": string,"cancelled_reason"?: string | null,"commercial_status"?: string,"created_at"?: string,"created_by": string,"currency"?: string,"customer_label"?: string | null,"fulfillment_status"?: string,"id"?: string,"quotation_id"?: string | null,"reference": string
                  }
                  Update: {
                    "business_id"?: string,"cancelled_reason"?: string | null,"commercial_status"?: string,"created_at"?: string,"created_by"?: string,"currency"?: string,"customer_label"?: string | null,"fulfillment_status"?: string,"id"?: string,"quotation_id"?: string | null,"reference"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_business_quotation_fkey"
      columns: ["business_id","quotation_id"]
isOneToOne: true
      referencedRelation: "quotations"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"payment_entries": {
                  Row: {
                    "amount": number,"business_id": string,"currency": string,"id": string,"method_label": string,"order_id": string,"recorded_at": string,"recorded_by": string,"reversal_reason": string | null,"reverses_entry_id": string | null
                  }
                  Insert: {
                    "amount": number,"business_id": string,"currency"?: string,"id"?: string,"method_label": string,"order_id": string,"recorded_at"?: string,"recorded_by": string,"reversal_reason"?: string | null,"reverses_entry_id"?: string | null
                  }
                  Update: {
                    "amount"?: number,"business_id"?: string,"currency"?: string,"id"?: string,"method_label"?: string,"order_id"?: string,"recorded_at"?: string,"recorded_by"?: string,"reversal_reason"?: string | null,"reverses_entry_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_entries_business_id_order_id_fkey"
      columns: ["business_id","order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "payment_entries_business_id_reverses_entry_id_order_id_fkey"
      columns: ["business_id","reverses_entry_id","order_id"]
isOneToOne: false
      referencedRelation: "payment_entries"
      referencedColumns: ["business_id","id","order_id"]
    }
                  ]
                },"quotation_lines": {
                  Row: {
                    "business_id": string,"created_at": string,"description_snapshot": string,"id": string,"quantity": number,"quotation_id": string,"sku_snapshot": string | null,"unit_price": number
                  }
                  Insert: {
                    "business_id": string,"created_at"?: string,"description_snapshot": string,"id"?: string,"quantity": number,"quotation_id": string,"sku_snapshot"?: string | null,"unit_price": number
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"description_snapshot"?: string,"id"?: string,"quantity"?: number,"quotation_id"?: string,"sku_snapshot"?: string | null,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotation_lines_business_id_quotation_id_fkey"
      columns: ["business_id","quotation_id"]
isOneToOne: false
      referencedRelation: "quotations"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"quotations": {
                  Row: {
                    "business_id": string,"created_at": string,"created_by": string,"currency": string,"customer_id": string | null,"customer_label_snapshot": string | null,"id": string,"reference": string,"status": string,"total": number,"updated_at": string,"valid_until": string | null
                  }
                  Insert: {
                    "business_id": string,"created_at"?: string,"created_by": string,"currency"?: string,"customer_id"?: string | null,"customer_label_snapshot"?: string | null,"id"?: string,"reference": string,"status"?: string,"total"?: number,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"created_by"?: string,"currency"?: string,"customer_id"?: string | null,"customer_label_snapshot"?: string | null,"id"?: string,"reference"?: string,"status"?: string,"total"?: number,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotations_business_id_customer_id_fkey"
      columns: ["business_id","customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "quotations_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancel_order":
{ Args: { "p_business_id": string,"p_order_id": string,"p_reason": string }; Returns: undefined
                           },
"change_order_fulfillment":
{ Args: { "p_business_id": string,"p_next_status": string,"p_order_id": string }; Returns: undefined
                           },
"change_quotation_status":
{ Args: { "p_business_id": string,"p_next_status": string,"p_quotation_id": string }; Returns: undefined
                           },
"create_business":
{ Args: { "p_name": string }; Returns: string
                           },
"create_order_from_quotation":
{ Args: { "p_business_id": string,"p_quotation_id": string }; Returns: string
                           },
"create_order_with_line":
{ Args: { "p_business_id": string,"p_customer_label": string,"p_description": string,"p_quantity": number,"p_sku": string,"p_unit_price": number }; Returns: string
                           },
"create_quotation_with_lines":
{ Args: { "p_business_id": string,"p_contact_value": string,"p_customer_name": string,"p_lines": Json,"p_valid_until": string | null }; Returns: string
                           },
"current_user_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_business_dashboard":
{ Args: { "p_business_id": string }; Returns: {
              "open_orders": number,"pending_cents": number,"preparing_orders": number,"ready_orders": number
            }[]
                           },
"has_business_role":
{ Args: { "allowed_roles": (string)[],"target_business_id": string }; Returns: boolean
                           },
"is_business_creator":
{ Args: { "target_business_id": string }; Returns: boolean
                           },
"is_business_member":
{ Args: { "target_business_id": string }; Returns: boolean
                           },
"record_order_payment":
{ Args: { "p_amount": number,"p_business_id": string,"p_method_label": string,"p_order_id": string }; Returns: string
                           },
"reverse_order_payment":
{ Args: { "p_business_id": string,"p_payment_id": string,"p_reason"?: string }; Returns: string
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
