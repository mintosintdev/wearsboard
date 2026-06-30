/**
 * ui.js
 * ---------------------------------------------------------------
 * Все DOM-ссылки и чисто презентационные функции: тосты,
 * скелетон-загрузка, эффект "печатающейся машинки".
 * Никакой бизнес-логики (карта, API) здесь нет — только UI.
 * ---------------------------------------------------------------
 */

export const el = {
  latValue: document.getElementById('latValue'),
  lngValue: document.getElementById('lngValue'),
  statusBadge: document.getElementById('statusBadge'),
  analysisBody: document.getElementById('analysisBody'),
  analysisText: document.getElementById('analysisText'),
  runBtn: document.getElementById('runAnalysisBtn'),
  runBtnLabel: document.getElementById('runBtnLabel'),
  shareBtn: document.getElementById('shareBtn'),
  shareImageBtn: document.getElementById('shareImageBtn'),
  themeBtn: document.getElementById('themeBtn'),
  themeLabel: document.getElementById('themeLabel'),
  routeToggleBtn: document.getElementById('routeToggleBtn'),
  routeClearBtn: document.getElementById('routeClearBtn'),
  routeDistance: document.getElementById('routeDistance'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

/* ===========================================================
   TOAST-УВЕДОМЛЕНИЯ
=========================================================== */
let toastTimer = null;

export function showToast(message){
  el.toastMessage.textContent = message;
  el.toast.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove('is-visible');
  }, 2600);
}

/* ===========================================================
   СОСТОЯНИЯ БЛОКА АНАЛИТИКИ
=========================================================== */

const ICON_CLOCK_SVG = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
  </svg>`;

export function resetAnalysisBlock(){
  el.analysisText.classList.remove('is-active');
  el.analysisText.textContent = 'Точка выбрана. Анализ запускается автоматически...';
}

export function showSkeleton(){
  el.analysisBody.innerHTML = `
    <div class="analysis-icon">${ICON_CLOCK_SVG}</div>
    <div class="skeleton-group">
      <div class="skeleton-line w-100"></div>
      <div class="skeleton-line w-80"></div>
      <div class="skeleton-line w-60"></div>
    </div>
  `;
}

/**
 * Пересоздаёт контейнер для финального текста анализа
 * и возвращает свежую ссылку на текстовый узел (т.к. старый
 * узел уничтожается при перезаписи innerHTML).
 */
export function prepareResultContainer(){
  el.analysisBody.innerHTML = `
    <div class="analysis-icon">${ICON_CLOCK_SVG}</div>
    <p class="analysis-text is-active" id="analysisText"></p>
  `;
  el.analysisText = el.analysisBody.querySelector('#analysisText');
  return el.analysisText;
}

/**
 * typewriteText(targetEl, text, speedMs)
 * ---------------------------------------------------------------
 * Плавно "печатает" текст внутри targetEl символ за символом,
 * с мигающим курсором в конце. Используется для премиального
 * появления ответа LLM (в стиле Notion AI).
 */
export function typewriteText(targetEl, text, speedMs){
  return new Promise((resolve) => {
    targetEl.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    targetEl.appendChild(cursor);

    let i = 0;
    const step = () => {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text.charAt(i));
        i++;
        setTimeout(step, speedMs);
      } else {
        cursor.remove();
        resolve();
      }
    };
    step();
  });
}
