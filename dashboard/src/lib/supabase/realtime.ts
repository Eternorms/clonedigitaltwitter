'use client'

import { useEffect } from 'react'
import { createClient } from './client'

export function useRealtimePosts(
  personaId: string | undefined,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!personaId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`posts-${personaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `persona_id=eq.${personaId}`,
        },
        () => {
          onUpdate()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [personaId, onUpdate])
}

export function useRealtimeActivities(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        () => {
          onUpdate()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
