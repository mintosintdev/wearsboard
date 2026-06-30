/**
 * routeBuilder.js
 * ---------------------------------------------------------------
 * Простой инструмент ручного построения маршрута: пользователь
 * включает режим, кликает точки на карте — они соединяются линией,
 * считается общая дистанция. Без внешних плагинов, чтобы не
 * тянуть зависимости, несовместимые с MapLibre.
 * ---------------------------------------------------------------
 */

import { getMap, setRouteMode, isRouteModeActive, registerBasemapSwitchHandler } from './mapController.js';

const SOURCE_ID = 'route-source';
const LINE_LAYER_ID = 'route-line-layer';
const POINTS_LAYER_ID = 'route-points-layer';

let waypoints = []; // [{lat, lng}, ...]
let onDistanceChange = null; // колбэк для обновления UI

/** Инициализация source/layers маршрута. Вызывать один раз после map 'load'. */
export function initRouteLayer(){
  const map = getMap();

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: emptyFeatureCollection()
  });

  map.addLayer({
    id: LINE_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'LineString'],
    paint: {
      'line-color': '#2563eb',
      'line-width': 4,
      'line-dasharray': [0.2, 1.5]
    }
  });

  map.addLayer({
    id: POINTS_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#2563eb',
      'circle-stroke-width': 3
    }
  });
}

/** Подключает колбэк, который будет получать актуальную дистанцию (в метрах) */
export function onRouteDistanceChange(callback){
  onDistanceChange = callback;
}

/** Включает режим построения маршрута: клики по карте добавляют точки */
export function enableRouteMode(){
  setRouteMode(true);
  const map = getMap();
  map.getCanvas().style.cursor = 'crosshair';
  map.on('click', handleRouteClick);
}

/** Выключает режим построения маршрута (карта возвращается к обычному выбору точки) */
export function disableRouteMode(){
  setRouteMode(false);
  const map = getMap();
  map.getCanvas().style.cursor = '';
  map.off('click', handleRouteClick);
}

/** Полностью очищает построенный маршрут */
export function clearRoute(){
  waypoints = [];
  updateRouteLayer();
  if (onDistanceChange) onDistanceChange(0);
}

function handleRouteClick(e){
  if (!isRouteModeActive()) return;
  waypoints.push({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  updateRouteLayer();

  if (onDistanceChange) onDistanceChange(calculateTotalDistance(waypoints));
}

function updateRouteLayer(){
  const map = getMap();
  map.getSource(SOURCE_ID).setData(buildFeatureCollection(waypoints));
}

function buildFeatureCollection(points){
  const features = points.map(p => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: {}
  }));

  if (points.length > 1) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points.map(p => [p.lng, p.lat])
      },
      properties: {}
    });
  }

  return { type: 'FeatureCollection', features };
}

function emptyFeatureCollection(){
  return { type: 'FeatureCollection', features: [] };
}

/** Считает общую длину маршрута по формуле гаверсинуса (в метрах) */
function calculateTotalDistance(points){
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i]);
  }
  return total;
}

function haversineDistance(a, b){
  const R = 6371000; // радиус Земли в метрах
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// При смене базовой карты MapLibre удаляет все слои — пересоздаём
// слой маршрута и восстанавливаем уже нарисованные точки
registerBasemapSwitchHandler(() => {
  initRouteLayer();
  updateRouteLayer();
});
