/**
 * functions/api/analyze.js
 * ---------------------------------------------------------------
 * Cloudflare Pages Function. Доступна по адресу /api/analyze.
 * Принимает POST с координатами, дергает Gemini API на сервере
 * (ключ хранится в Environment Variables, не в браузере) и
 * возвращает текст анализа обратно на фронтенд.
 * ---------------------------------------------------------------
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { lat, lng, systemPrompt, radiusMeters } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'Некорректные координаты' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY не задан в Environment Variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          parts: [{
            text: `Координаты точки: широта ${lat}, долгота ${lng}. Радиус анализа: ${radiusMeters || 800} м.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: 'Ошибка Gemini API', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Анализ не удался: пустой ответ от модели.';

    return new Response(JSON.stringify({ analysisText: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Внутренняя ошибка функции', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
