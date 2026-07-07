export type Theme = 'light' | 'dark'

const KEY = 'plane-theme'

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || 'light'
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t)
  document.documentElement.dataset.theme = t
}

export function toggleTheme() {
  setTheme(getTheme() === 'light' ? 'dark' : 'light')
}
