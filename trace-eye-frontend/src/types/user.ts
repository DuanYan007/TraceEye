export interface User {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  createdAt: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  expiresIn: number
}