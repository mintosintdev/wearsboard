/**
 * customLayers.js
 * ---------------------------------------------------------------
 * Позволяет пользователю загрузить свой GeoJSON-файл и наложить
 * его на карту отдельным слоем (точки/линии/полигоны — любые).
 * Каждый загруженный слой получает случайный акцентный цвет,
 * чтобы слои визуально не сливались друг с другом.
 * ---------------------------------------------------------------
 */

import { getMap, registerBasemapSwitchHandler } from './mapController.js';

const ACCENT_PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
let loadedLayers = []; // [{ id, data, color }] — храним, чтобы пересоздать после смены basemap

/** Открывает системный диалог выбора файла и добавляет GeoJSON на карту */
export function promptUploadGeoJSON(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.geojson,application/geo+json,application/json';

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      addGeoJsonLayer(data, file.name);
    } catch (err) {
      console.error('Не удалось прочитать GeoJSON:', err);
      alert('Файл не похож на корректный GeoJSON. Проверьте формат.');
    }
  });

  input.click();
}

/** Добавляет произвольный GeoJSON-объект как новый слой на карту */
export function addGeoJsonLayer(geojson, label = 'custom-layer'){
  const map = getMap();
  const id = `custom-${Date.now()}`;
  const color = ACCENT_PALETTE[loadedLayers.length % ACCENT_PALETTE.length];

  map.addSource(id, { type: 'geojson', data: geojson });

  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    filter: ['==', '$type', 'Polygon'],
    paint: { 'fill-color': color, 'fill-opacity': 0.18 }
  });

  map.addLayer({
    id: `${id}-line`,
    type: 'line',
    source: id,
    filter: ['in', '$type', 'Polygon', 'LineString'],
    paint: { 'line-color': color, 'line-width': 3 }
  });

  map.addLayer({
    id: `${id}-points`,
    type: 'circle',
    source: id,
    filter: ['==', '$type', 'Point'],
    paint: { 'circle-radius': 6, 'circle-color': color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }
  });

  loadedLayers.push({ id, data: geojson, color, label });
  return id;
}

/** Удаляет все пользовательские слои с карты */
export function clearCustomLayers(){
  const map = getMap();
  loadedLayers.forEach(({ id }) => {
    [`${id}-fill`, `${id}-line`, `${id}-points`].forEach(layerId => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
    if (map.getSource(id)) map.removeSource(id);
  });
  loadedLayers = [];
}

/** При смене базовой карты MapLibre стирает все слои — пересоздаём их из памяти */
registerBasemapSwitchHandler(() => {
  const saved = loadedLayers;
  loadedLayers = [];
  saved.forEach(({ data, label }) => addGeoJsonLayer(data, label));
});
