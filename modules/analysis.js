/**
 * analysis.js
 * ---------------------------------------------------------------
 * Модуль ИИ-анализа локаций. Единственное место в проекте,
 * которое нужно трогать для подключения реального LLM API
 * (Claude / Gemini / OpenAI / собственный backend).
 *
 * Главная экспортируемая функция — performGeoAnalysis(coords).
 * ---------------------------------------------------------------
 */

import { analysisConfig } from './config.js';
import { el, showSkeleton, prepareResultContainer, typewriteText } from './ui.js';

/**
 * performGeoAnalysis(coords)
 * ---------------------------------------------------------------
 * Главная точка интеграции с LLM. Принимает { lat, lng }.
 * Вызывается автоматически при клике на карту, при загрузке
 * страницы с предвыбранной точкой в URL, а также вручную по кнопке.
 *
 * Поток выполнения:
 *   1) переводим UI в состояние загрузки (спиннер + скелетон)
 *   2) вызываем LLM API (сейчас — заглушка, ждущая ваш API Key)
 *   3) выводим результат с эффектом печатающейся машинки
 *   4) возвращаем UI в обычное состояние
 */
export async function performGeoAnalysis(coords){
  const { lat, lng } = coords;

  // --- 1) UI: состояние загрузки ---
  el.runBtn.disabled = true;
  el.runBtnLabel.innerHTML = '<span class="spinner"></span> Анализируем локацию...';
  showSkeleton();

  let resultText;

  try {
    resultText = await callLlmApi(lat, lng);
  } catch (err) {
    console.error('Ошибка анализа локации:', err);
    resultText = 'Не удалось получить анализ. Проверьте подключение к API и попробуйте снова.';
  }

  // --- 4) UI: возвращаем кнопку в обычное состояние ---
  el.runBtn.disabled = false;
  el.runBtnLabel.textContent = 'Запустить ИИ-анализ района';

  // --- 3) Выводим результат с эффектом печатающейся машинки ---
  const textNode = prepareResultContainer();
  await typewriteText(textNode, resultText, analysisConfig.typewriterSpeedMs);
}

/**
 * callLlmApi(lat, lng)
 * ---------------------------------------------------------------
 * ЗАГЛУШКА ДЛЯ ВЫЗОВА РЕАЛЬНОГО LLM API.
 * Сейчас имитирует сетевую задержку и возвращает демо-текст.
 *
 * Чтобы подключить настоящую модель:
 *   1. Раскомментируйте блок fetch() ниже (вариант A или B).
 *   2. Впишите свой API Key в заголовок Authorization
 *      (НЕ ХРАНИТЕ ключ во фронтенд-коде в проде — лучше
 *      проксируйте запрос через свой backend/Cloudflare Pages
 *      Function, чтобы ключ не "утёк" в браузер пользователя).
 *   3. Поправьте endpoint и формат body под выбранного провайдера.
 *   4. Удалите вызов fakeNetworkDelay() и return ниже.
 */
async function callLlmApi(lat, lng){
  // Запрос идёт не напрямую в Anthropic, а в нашу же Cloudflare
  // Pages Function (/api/analyze). Она держит ключ на сервере
  // и проксирует запрос к Claude — ключ никогда не виден в браузере.
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat,
      lng,
      systemPrompt: analysisConfig.systemPrompt,
      radiusMeters: analysisConfig.radiusMeters,
      maxTokens: analysisConfig.maxTokens,
      model: analysisConfig.model
    })
  });

  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку: ${response.status}`);
  }

  const data = await response.json();
  return data.analysisText;
}
