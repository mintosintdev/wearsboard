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
  provider: 'claude',

  // Модель провайдера (пример для Claude; для Gemini — 'gemini-1.5-pro' и т.п.)
  model: 'claude-sonnet-4-6',

  // Радиус анализа в метрах — пригодится, если будете подмешивать данные с карт/POI API
  radiusMeters: 800,

  // Максимальная длина ответа модели
  maxTokens: 400,

  // Скорость эффекта "печатающейся машинки" (мс на символ)
  typewriterSpeedMs: 14
};
