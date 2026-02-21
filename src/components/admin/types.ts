export interface UserWithRole {
  id: string
  email: string
  name?: string
  role: string
  permissions: string[]
  created_at: string
}

