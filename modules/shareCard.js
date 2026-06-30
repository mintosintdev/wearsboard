/**
 * shareCard.js
 * ---------------------------------------------------------------
 * Генерирует картинку-карточку для шеринга в соцсети: снимок
 * карты + координаты + краткая выжимка из ИИ-анализа, оформленные
 * как единое premium-изображение. Это и есть главный канал роста
 * через сторис/посты — людям удобнее кинуть картинку, чем ссылку.
 * ---------------------------------------------------------------
 */

import { getMap } from './mapController.js';

const CARD_WIDTH = 1080;   // под формат сторис/постов
const CARD_HEIGHT = 1350;
const MAP_SNAPSHOT_HEIGHT = 760;

/**
 * buildShareCard(coords, summaryText)
 * ---------------------------------------------------------------
 * Возвращает Promise<Blob> с готовым PNG-изображением карточки.
 * coords — { lat, lng }, summaryText — короткая выжимка анализа.
 */
export async function buildShareCard(coords, summaryText){
  const map = getMap();
  const mapDataUrl = map.getCanvas().toDataURL('image/png');
  const mapImage = await loadImage(mapDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');

  // --- фон карточки ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // --- снимок карты сверху, обрезанный по центру под нужные пропорции ---
  drawCoverImage(ctx, mapImage, 0, 0, CARD_WIDTH, MAP_SNAPSHOT_HEIGHT);

  // --- лёгкий градиент поверх карты для читаемости подписи координат ---
  const gradient = ctx.createLinearGradient(0, MAP_SNAPSHOT_HEIGHT - 160, 0, MAP_SNAPSHOT_HEIGHT);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, MAP_SNAPSHOT_HEIGHT - 160, CARD_WIDTH, 160);

  // --- координаты поверх карты ---
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 32px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`, 48, MAP_SNAPSHOT_HEIGHT - 48);

  // --- нижний блок: бренд + текст анализа ---
  ctx.fillStyle = '#1f2328';
  ctx.font = '700 40px system-ui, -apple-system, sans-serif';
  ctx.fillText('GeoIntel', 48, MAP_SNAPSHOT_HEIGHT + 80);

  ctx.fillStyle = '#6b7280';
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('гео-аналитика локаций', 48, MAP_SNAPSHOT_HEIGHT + 118);

  ctx.fillStyle = '#1f2328';
  ctx.font = '400 30px system-ui, -apple-system, sans-serif';
  wrapText(ctx, summaryText, 48, MAP_SNAPSHOT_HEIGHT + 180, CARD_WIDTH - 96, 42, 8);

  // --- акцентная плашка снизу ---
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, CARD_HEIGHT - 12, CARD_WIDTH, 12);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

/** Запускает скачивание готовой карточки как PNG-файла */
export async function downloadShareCard(coords, summaryText){
  const blob = await buildShareCard(coords, summaryText);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `geointel-${coords.lat.toFixed(4)}-${coords.lng.toFixed(4)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Пытается открыть нативное системное меню "Поделиться" (на мобильных) с картинкой.
 * Если Web Share API с файлами недоступен — откатывается на обычное скачивание.
 */
export async function shareCardNative(coords, summaryText){
  const blob = await buildShareCard(coords, summaryText);
  const file = new File([blob], 'geointel-location.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'GeoIntel — анализ локации',
      text: summaryText
    });
    return true;
  }

  await downloadShareCard(coords, summaryText);
  return false;
}

/* ===================== вспомогательные функции ===================== */

function loadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Рисует изображение с обрезкой "по центру" (как object-fit: cover) */
function drawCoverImage(ctx, img, x, y, w, h){
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;

  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Перенос текста по словам с ограничением максимального числа строк */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines){
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line, x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        // последняя разрешённая строка — обрезаем с многоточием
        const remaining = words.slice(i + 1).join(' ');
        ctx.fillText(line + remaining, x, curY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
