/**
 * urlState.js
 * ---------------------------------------------------------------
 * Синхронизация состояния приложения с адресной строкой:
 *  - lat/lng/zoom — текущий вид карты
 *  - selLat/selLng — выбранная пользователем точка анализа
 *
 * Используется window.history.replaceState, поэтому переходы
 * не засоряют историю браузера (кнопка "Назад" не дёргает карту).
 * ---------------------------------------------------------------
 */

import { DEFAULT_VIEW } from './config.js';

export const UrlState = {
  /** Читает текущий вид карты (lat/lng/zoom) из URL, либо DEFAULT_VIEW */
  read(){
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const zoom = parseFloat(params.get('zoom'));
    return {
      lat: Number.isFinite(lat) ? lat : DEFAULT_VIEW.lat,
      lng: Number.isFinite(lng) ? lng : DEFAULT_VIEW.lng,
      zoom: Number.isFinite(zoom) ? zoom : DEFAULT_VIEW.zoom
    };
  },

  /** Записывает текущий вид карты в URL */
  write(lat, lng, zoom){
    const params = new URLSearchParams(window.location.search);
    params.set('lat', lat.toFixed(6));
    params.set('lng', lng.toFixed(6));
    params.set('zoom', zoom.toFixed(2));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  },

  /** Записывает выбранную для анализа точку в URL */
  writeSelected(lat, lng){
    const params = new URLSearchParams(window.location.search);
    params.set('selLat', lat.toFixed(6));
    params.set('selLng', lng.toFixed(6));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  },

  /** Читает ранее выбранную точку из URL, либо null */
  readSelected(){
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('selLat'));
    const lng = parseFloat(params.get('selLng'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }
};
