export const POPUP_THEME: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const applyPopupTheme = () => {
  document.documentElement.classList.toggle('dark', POPUP_THEME === 'dark')
}
