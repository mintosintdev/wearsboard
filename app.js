/**
 * app.js — точка входа приложения GeoIntel.
 * ---------------------------------------------------------------
 * Подключается из index.html как <script src="app.js" type="module">.
 *
 * Здесь только "оркестрация": инициализация карты, привязка
 * обработчиков кнопок и связывание модулей между собой.
 * Бизнес-логика живёт в соответствующих модулях:
 *
 *   modules/config.js          — конфигурация карты, LLM и тем
 *   modules/urlState.js        — синхронизация состояния с URL
 *   modules/ui.js              — DOM-ссылки и презентационные хелперы
 *   modules/theme.js           — переключение визуальных тем
 *   modules/mapController.js   — MapLibre: инициализация, клики, маркер
 *   modules/analysis.js        — performGeoAnalysis (точка интеграции LLM)
 *   modules/overpass.js        — лёгкие POI-данные из OSM
 *   modules/routeBuilder.js    — ручное построение маршрута
 *   modules/shareCard.js       — генерация карточки для соцсетей
 * ---------------------------------------------------------------
 */

import { el, showToast } from './modules/ui.js';
import { initMap, bindMapEvents, getCurrentSelection, getMap, cycleBasemap } from './modules/mapController.js';
import { performGeoAnalysis } from './modules/analysis.js';
import { initTheme, cycleTheme } from './modules/theme.js';
import {
  initRouteLayer,
  enableRouteMode,
  disableRouteMode,
  clearRoute,
  onRouteDistanceChange
} from './modules/routeBuilder.js';
import { shareCardNative } from './modules/shareCard.js';
import { promptUploadGeoJSON, clearCustomLayers } from './modules/customLayers.js';

/* ===========================================================
   ТЕМА — восстанавливаем сохранённый выбор пользователя
=========================================================== */
initTheme();

/* ===========================================================
   ИНИЦИАЛИЗАЦИЯ КАРТЫ
=========================================================== */
initMap();
getMap().once('load', initRouteLayer);

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
   КНОПКА "ПОДЕЛИТЬСЯ ЛОКАЦИЕЙ" (ссылка)
=========================================================== */
el.shareBtn.addEventListener('click', async () => {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Ссылка скопирована в буфер обмена');
  } catch (err) {
    const tempInput = document.createElement('textarea');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Ссылка скопирована в буфер обмена');
  }
});

/* ===========================================================
   КНОПКА "КАРТОЧКА" — генерация изображения для соцсетей
=========================================================== */
el.shareImageBtn.addEventListener('click', async () => {
  const selection = getCurrentSelection();
  if (!selection) {
    showToast('Сначала выберите точку на карте');
    return;
  }

  const summary = el.analysisText?.textContent || 'Анализ локации от GeoIntel';

  el.shareImageBtn.disabled = true;
  try {
    const shared = await shareCardNative(selection, summary);
    showToast(shared ? 'Карточка отправлена' : 'Карточка скачана');
  } catch (err) {
    console.error('Ошибка генерации карточки:', err);
    showToast('Не удалось создать карточку');
  } finally {
    el.shareImageBtn.disabled = false;
  }
});

/* ===========================================================
   КНОПКА ТЕМЫ
=========================================================== */
el.themeBtn.addEventListener('click', cycleTheme);

/* ===========================================================
   РУЧНОЙ МАРШРУТ
=========================================================== */
let routeModeOn = false;

onRouteDistanceChange((meters) => {
  const km = meters / 1000;
  el.routeDistance.textContent = km >= 1 ? `${km.toFixed(2)} км` : `${Math.round(meters)} м`;
});

el.routeToggleBtn.addEventListener('click', () => {
  routeModeOn = !routeModeOn;
  if (routeModeOn) {
    enableRouteMode();
    el.routeToggleBtn.textContent = 'Остановить';
    el.routeToggleBtn.classList.add('btn-route-active');
    showToast('Кликайте по карте, чтобы добавлять точки маршрута');
  } else {
    disableRouteMode();
    el.routeToggleBtn.textContent = 'Рисовать';
    el.routeToggleBtn.classList.remove('btn-route-active');
  }
});

el.routeClearBtn.addEventListener('click', () => {
  clearRoute();
});

/* ===========================================================
   КНОПКА БАЗОВОЙ КАРТЫ
=========================================================== */
el.basemapBtn.addEventListener('click', () => {
  const label = cycleBasemap();
  showToast(`Карта: ${label}`);
});

/* ===========================================================
   СВОИ СЛОИ (GeoJSON)
=========================================================== */
el.uploadLayerBtn.addEventListener('click', () => {
  promptUploadGeoJSON();
});

el.clearLayersBtn.addEventListener('click', () => {
  clearCustomLayers();
  showToast('Пользовательские слои убраны');
});
