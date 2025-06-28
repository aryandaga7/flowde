export interface AuthResponse {
  access_token: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

export interface SignupData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface LoginData {
  email: string
  password: string
} 