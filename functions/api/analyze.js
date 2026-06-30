/**
 * functions/api/analyze.js
 * ---------------------------------------------------------------
 * Cloudflare Pages Function. Доступна по адресу /api/analyze.
 * Принимает POST-запрос с координатами от фронтенда, дергает
 * Google Gemini API на сервере (ключ никогда не попадает в браузер)
 * и возвращает текст анализа обратно.
 * ---------------------------------------------------------------
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { lat, lng, systemPrompt, radiusMeters, maxTokens } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'Некорректные координаты' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Берём ключ из Environment Variables Cloudflare Pages
    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Ключ GEMINI_API_KEY не настроен в Cloudflare' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Будем использовать актуальную модель gemini-1.5-flash (или gemini-1.5-pro)
    const modelName = 'gemini-1.5-flash';

    // Делаем запрос к серверам Google AI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt || "Ты профессиональный географ-урбанист и OSINT-аналитик. Анализируй локацию." }]
          },
          contents: [{
            parts: [{
              text: `Координаты точки: широта ${lat}, долгота ${lng}. Радиус анализа: ${radiusMeters || 800} м. Дай детальную оценку местности.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens || 1000
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: 'Ошибка Gemini API', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    
    // Безопасно достаем текст ответа из структуры данных Google
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Анализ не удался: пустой ответ от модели.';

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
