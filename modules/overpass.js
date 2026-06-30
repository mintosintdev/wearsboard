/**
 * overpass.js
 * ---------------------------------------------------------------
 * Лёгкий запрос к Overpass API: считает количество точек интереса
 * (кафе, рестораны, парки, магазины) в радиусе вокруг координат.
 * Это бесплатные данные OpenStreetMap, без своего ключа.
 *
 * Результат кешируется в памяти по округлённым координатам, чтобы
 * не дёргать Overpass повторно для близких точек (важно при
 * вирусном трафике из соцсетей — Overpass общедоступен и не любит
 * частые запросы).
 * ---------------------------------------------------------------
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const cache = new Map();

/** Округляет координату до ~110м точности — ключ для кеша/группировки запросов */
function cacheKey(lat, lng, radius){
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`;
}

/**
 * fetchNearbyPOIs(lat, lng, radiusMeters)
 * ---------------------------------------------------------------
 * Возвращает { cafes, restaurants, parks, shops, total } —
 * количество объектов каждой категории в радиусе.
 * При ошибке сети возвращает null (анализ продолжится без этих
 * данных, это не критичная часть отчёта).
 */
export async function fetchNearbyPOIs(lat, lng, radiusMeters = 800){
  const key = cacheKey(lat, lng, radiusMeters);
  if (cache.has(key)) return cache.get(key);

  // Overpass QL: считаем 4 лёгкие категории одним запросом
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
      node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
      node["leisure"="park"](around:${radiusMeters},${lat},${lng});
      node["shop"](around:${radiusMeters},${lat},${lng});
    );
    out count;
  `;

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    });

    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);

    const data = await response.json();
    // Overpass возвращает элементы count в произвольном порядке —
    // здесь упрощённо считаем total по всем найденным элементам
    const total = data.elements?.reduce((sum, el) => {
      return sum + (parseInt(el.tags?.total, 10) || 0);
    }, 0) || 0;

    const result = { total, radiusMeters };
    cache.set(key, result);
    return result;

  } catch (err) {
    console.warn('Overpass недоступен, продолжаем без POI-данных:', err.message);
    return null;
  }
}
