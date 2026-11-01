import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const ROLES = { STUDENT: 'Student', ORGANIZER: 'Organizer' }

// Where each role lands after login
export const homeFor = (role) => (role === ROLES.ORGANIZER ? '/organizer' : '/student')
