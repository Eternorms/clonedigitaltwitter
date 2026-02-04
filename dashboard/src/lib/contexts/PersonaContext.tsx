'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Persona } from '@/types'

interface PersonaContextType {
  personas: Persona[]
  activePersona: Persona | null
  setActivePersona: (persona: Persona) => void
}

const PersonaContext = createContext<PersonaContextType>({
  personas: [],
  activePersona: null,
  setActivePersona: () => {},
})

export function PersonaProvider({
  children,
  initialPersonas,
}: {
  children: ReactNode
  initialPersonas: Persona[]
}) {
  const [activePersona, setActivePersona] = useState<Persona | null>(
    initialPersonas[0] ?? null
  )

  return (
    <PersonaContext.Provider
      value={{ personas: initialPersonas, activePersona, setActivePersona }}
    >
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona() {
  return useContext(PersonaContext)
}
