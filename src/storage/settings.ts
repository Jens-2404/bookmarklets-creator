export type AppSettings = {
  theme: 'light' | 'dark'
  aiProvider: 'none' | 'mock' | 'openai' | 'anthropic' | 'openrouter'
}

export const defaultSettings: AppSettings = {
  theme: 'light',
  aiProvider: 'none',
}

const SETTINGS_KEY = 'bookmarklets_creator_settings'

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaultSettings
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) {
      return defaultSettings
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...defaultSettings,
      ...parsed,
    }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
