/**
 * theme.js
 * ---------------------------------------------------------------
 * Переключение визуальных тем. Тема хранится в data-theme на
 * <html> — все цвета переопределяются через CSS-переменные
 * в index.html (см. [data-theme="dark"], [data-theme="evening"]).
 * Выбор пользователя сохраняется в localStorage между визитами.
 * ---------------------------------------------------------------
 */

import { themes, THEME_STORAGE_KEY } from './config.js';

let currentIndex = 0;

/** Применяет тему по id и сохраняет выбор */
export function applyTheme(themeId){
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem(THEME_STORAGE_KEY, themeId);

  const idx = themes.findIndex(t => t.id === themeId);
  if (idx !== -1) currentIndex = idx;

  const labelEl = document.getElementById('themeLabel');
  if (labelEl) labelEl.textContent = themes[currentIndex].label;
}

/** Переключает на следующую тему по кругу (для кнопки в topbar) */
export function cycleTheme(){
  currentIndex = (currentIndex + 1) % themes.length;
  applyTheme(themes[currentIndex].id);
}

/** Восстанавливает тему из localStorage при загрузке (или 'light' по умолчанию) */
export function initTheme(){
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  const themeId = themes.some(t => t.id === saved) ? saved : 'light';
  applyTheme(themeId);
}
