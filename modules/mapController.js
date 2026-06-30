/**
 * mapController.js
 * ---------------------------------------------------------------
 * Инициализация MapLibre GL, обработка кликов/перемещений карты
 * и логика выбора локации (маркер, обновление карточки координат).
 * ---------------------------------------------------------------
 */

import { DEFAULT_VIEW, MAP_STYLE } from './config.js';
import { UrlState } from './urlState.js';
import { el, resetAnalysisBlock } from './ui.js';

let map = null;
let selectedMarker = null;
let currentSelection = null; // { lat, lng } — текущая выбранная точка
let routeModeActive = false; // когда true, клики идут в routeBuilder, а не в анализ

/** Создаёт и возвращает экземпляр карты MapLibre */
export function initMap(){
  const initialView = UrlState.read();

  map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLE,
    center: [initialView.lng, initialView.lat],
    zoom: initialView.zoom,
    attributionControl: { compact: true },
    // нужно для шеринг-карточки: позволяет делать map.getCanvas().toDataURL()
    preserveDrawingBuffer: true
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  return map;
}

/** Возвращает текущий экземпляр карты — нужен другим модулям (route, share) */
export function getMap(){
  return map;
}

/** Включает/выключает режим построения маршрута (блокирует обычный выбор точки) */
export function setRouteMode(active){
  routeModeActive = active;
}

export function isRouteModeActive(){
  return routeModeActive;
}

/** Возвращает текущую выбранную локацию ({lat, lng} или null) */
export function getCurrentSelection(){
  return currentSelection;
}

/** Ставит/перемещает маркер выбранной точки на карте */
function setMarker(lat, lng){
  if (selectedMarker) selectedMarker.remove();

  const node = document.createElement('div');
  node.className = 'pin';
  node.setAttribute('aria-label', 'Выбранная точка');

  selectedMarker = new maplibregl.Marker({ element: node, anchor: 'center' })
    .setLngLat([lng, lat])
    .addTo(map);
}

/**
 * selectLocation(lat, lng, opts)
 * ---------------------------------------------------------------
 * Обновляет состояние выбранной точки: карточку координат,
 * маркер на карте и URL (если не передан opts.silent).
 */
export function selectLocation(lat, lng, opts = {}){
  currentSelection = { lat, lng };

  el.latValue.textContent = lat.toFixed(6);
  el.lngValue.textContent = lng.toFixed(6);
  el.statusBadge.textContent = 'Выбрано';
  el.statusBadge.style.color = 'var(--success)';
  el.statusBadge.style.background = '#e8f7ec';

  setMarker(lat, lng);
  el.runBtn.disabled = false;

  // сброс блока анализа в исходное состояние при выборе новой точки
  resetAnalysisBlock();

  if (!opts.silent) {
    UrlState.writeSelected(lat, lng);
  }
}

/** Записывает текущий центр/зум карты в URL */
function syncViewToUrl(){
  const center = map.getCenter();
  const zoom = map.getZoom();
  UrlState.write(center.lat, center.lng, zoom);
}

/**
 * bindMapEvents(onLocationSelected)
 * ---------------------------------------------------------------
 * Подключает обработчики карты. onLocationSelected — колбэк,
 * вызываемый каждый раз, когда пользователь кликает по карте
 * или при восстановлении точки из URL (используется для запуска
 * performGeoAnalysis на уровне app.js, чтобы этот модуль
 * не знал ничего про LLM-логику).
 */
export function bindMapEvents(onLocationSelected){
  map.on('click', (e) => {
    // в режиме построения маршрута клики обрабатывает routeBuilder.js,
    // обычный анализ локации в этот момент не запускаем
    if (routeModeActive) return;

    const { lat, lng } = e.lngLat;
    selectLocation(lat, lng);
    onLocationSelected({ lat, lng });
  });

  map.on('moveend', syncViewToUrl);
  map.on('zoomend', syncViewToUrl);

  map.on('load', () => {
    const preselected = UrlState.readSelected();
    if (preselected) {
      selectLocation(preselected.lat, preselected.lng, { silent: true });
      onLocationSelected(preselected);
    }
    syncViewToUrl();
  });
}
