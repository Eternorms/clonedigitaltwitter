'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Persona } from '@/types'

interface PersonaContextType {
  personas: Persona[]
  activePersona: Persona | null
  setActivePersona: (persona: Persona) => void
  addPersona: (persona: Persona) => void
  removePersona: (id: string) => void
}

const PersonaContext = createContext<PersonaContextType>({
  personas: [],
  activePersona: null,
  setActivePersona: () => {},
  addPersona: () => {},
  removePersona: () => {},
})

export function PersonaProvider({
  children,
  initialPersonas,
}: {
  children: ReactNode
  initialPersonas: Persona[]
}) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [activePersona, setActivePersona] = useState<Persona | null>(
    initialPersonas[0] ?? null
  )

  const addPersona = useCallback((persona: Persona) => {
    setPersonas((prev) => [...prev, persona])
    if (!activePersona) setActivePersona(persona)
  }, [activePersona])

  const removePersona = useCallback((id: string) => {
    setPersonas((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      if (activePersona?.id === id) {
        setActivePersona(updated[0] ?? null)
      }
      return updated
    })
  }, [activePersona?.id])

  return (
    <PersonaContext.Provider
      value={{ personas, activePersona, setActivePersona, addPersona, removePersona }}
    >
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona() {
  return useContext(PersonaContext)
}
