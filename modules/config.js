/**
 * config.js
 * ---------------------------------------------------------------
 * Единое место конфигурации проекта: начальные параметры карты,
 * тайл-стиль и настройки LLM-анализа (analysisConfig).
 *
 * Меняйте значения здесь — остальной код их не дублирует.
 * ---------------------------------------------------------------
 */

// Координаты и зум по умолчанию (Краков), если в URL ничего не передано
export const DEFAULT_VIEW = { lat: 50.0647, lng: 19.9450, zoom: 12 };

// Бесплатный светлый minimal-стиль без токена (CartoDB Positron)
export const MAP_STYLE = {
  version: 8,
  sources: {
    'carto-light': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
    }
  },
  layers: [
    { id: 'carto-light-layer', type: 'raster', source: 'carto-light', minzoom: 0, maxzoom: 20 }
  ]
};

/**
 * analysisConfig
 * ---------------------------------------------------------------
 * Настройки ИИ-аналитика. Меняйте systemPrompt, provider, model
 * и прочие поля под свою задачу — остальной код трогать не нужно.
 */
export const analysisConfig = {
  // Системный промпт — задаёт роль и стиль ответа модели
  systemPrompt:
    'Ты профессиональный географ-урбанист и аналитик локаций. ' +
    'По переданным координатам кратко (3-5 предложений) опиши вероятный ' +
    'характер района: тип застройки, транспортную доступность, плотность ' +
    'инфраструктуры (магазины, кафе, парки) и общую привлекательность для жизни ' +
    'или бизнеса. Пиши по-деловому, без воды, на русском языке.',

  // Какого провайдера используем: 'claude' | 'gemini' | 'openai' | свой бэкенд
  provider: 'gemini',

  // Модель провайдера (пример для Claude; для Gemini — 'gemini-1.5-pro' и т.п.)
  model: 'gemini-1.5-flash',

  // Радиус анализа в метрах — пригодится, если будете подмешивать данные с карт/POI API
  radiusMeters: 800,

  // Максимальная длина ответа модели
  maxTokens: 400,

  // Скорость эффекта "печатающейся машинки" (мс на символ)
  typewriterSpeedMs: 14
};

/**
 * themes
 * ---------------------------------------------------------------
 * Готовые наборы CSS-переменных. Переключение темы просто меняет
 * атрибут data-theme на <html> — сами значения объявлены в
 * index.html через CSS-селекторы [data-theme="..."].
 * Здесь храним только список и подписи для UI-переключателя.
 */
export const themes = [
  { id: 'light',   label: 'Светлая' },
  { id: 'dark',    label: 'Тёмная' },
  { id: 'evening', label: 'Вечерняя' }
];

export const THEME_STORAGE_KEY = 'geointel-theme';

/**
 * BASE_STYLES
 * ---------------------------------------------------------------
 * Набор переключаемых базовых карт. Все растровые, без токенов API.
 * 'carto' — используется как стиль по умолчанию (MAP_STYLE выше).
 */
export const BASE_STYLES = [
  { id: 'carto', label: 'Минимал', style: MAP_STYLE },
  {
    id: 'osm',
    label: 'OSM',
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [{ id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }]
    }
  },
  {
    id: 'satellite',
    label: 'Спутник',
    style: {
      version: 8,
      sources: {
        esri: {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [{ id: 'esri-layer', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 19 }]
    }
  },
  {
    id: 'dark',
    label: 'Тёмная карта',
    style: {
      version: 8,
      sources: {
        cartoDark: {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          ],
          tileSize: 256,
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors'
        }
      },
      layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'cartoDark', minzoom: 0, maxzoom: 20 }]
    }
  }
];
