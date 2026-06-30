/**
 * app.js — точка входа приложения GeoIntel.
 * ---------------------------------------------------------------
 * Подключается из index.html как <script src="app.js" type="module">.
 *
 * Здесь только "оркестрация": инициализация карты, привязка
 * обработчиков кнопок и связывание модулей между собой.
 * Бизнес-логика живёт в соответствующих модулях:
 *
 *   modules/config.js          — конфигурация карты и LLM
 *   modules/urlState.js        — синхронизация состояния с URL
 *   modules/ui.js              — DOM-ссылки и презентационные хелперы
 *   modules/mapController.js   — MapLibre: инициализация, клики, маркер
 *   modules/analysis.js        — performGeoAnalysis (точка интеграции LLM)
 * ---------------------------------------------------------------
 */

import { el, showToast } from './modules/ui.js';
import { initMap, bindMapEvents, getCurrentSelection } from './modules/mapController.js';
import { performGeoAnalysis } from './modules/analysis.js';

/* ===========================================================
   ИНИЦИАЛИЗАЦИЯ КАРТЫ
=========================================================== */
initMap();

/* ===========================================================
   СОБЫТИЯ КАРТЫ
   -----------------------------------------------------------
   Клик по карте (и восстановление точки из URL при загрузке)
   автоматически запускает performGeoAnalysis для выбранных
   координат.
=========================================================== */
bindMapEvents((coords) => {
  performGeoAnalysis(coords);
});

/* ===========================================================
   КНОПКА "ЗАПУСТИТЬ ИИ-АНАЛИЗ" (ручной повторный запуск)
=========================================================== */
el.runBtn.addEventListener('click', () => {
  const selection = getCurrentSelection();
  if (!selection) return;
  performGeoAnalysis(selection);
});

/* ===========================================================
   КНОПКА "ПОДЕЛИТЬСЯ ЛОКАЦИЕЙ"
=========================================================== */
el.shareBtn.addEventListener('click', async () => {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Ссылка скопирована в буфер обмена');
  } catch (err) {
    // запасной вариант на случай отсутствия Clipboard API
    const tempInput = document.createElement('textarea');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Ссылка скопирована в буфер обмена');
  }
});
