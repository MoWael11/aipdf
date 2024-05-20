'use client'

import { create } from 'zustand'

interface Credit {
  credits: number | undefined
  setCredits: (credits: number) => void
}

export const useCredits = create<Credit>((set) => ({
  credits: undefined,
  setCredits: (credits) => set({ credits }),
}))
