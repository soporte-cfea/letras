export interface UserWithRole {
  id: string
  email: string
  name?: string
  role: string
  permissions: string[]
  created_at: string
  user_metadata?: {
    avatar_style?: string
    avatar_config?: Record<string, any>
    name?: string
  }
}

