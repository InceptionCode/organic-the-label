import type { Product, UserPreferences } from "@/lib/schemas"

export const mockSupabase = {
  getUserPreferences: async (userId: string): Promise<UserPreferences> => ({
    userId,
    genres: ['trap', 'lofi'],
    interests: ['808s', 'drill'],
    receiveEmails: true,
  }),
  insertPreference: async (prefs: UserPreferences) => {
    console.log('Saved prefs', prefs)
    return { data: prefs }
  },
  getProducts: async (): Promise<Product[]> => [
    {
      id: "1",
      name: 'Moonlight Beat',
      price: 30,
      category: 'beat',
      audio_preview: { preview_title: "Moonlight", preview_url: 'https://cdn.example.com/audio/moonlight.mp3' },
      image: { url: 'https://cdn.example.com/img/beat.jpg' },
      is_exclusive: true,
      created_at: '2025-01-01',
      variantId: '1',
      handle: 'moonlight-beat',
    },
  ],
}
