/**
 * index.js
 * ========
 * Логика, специфичная для главной страницы (index.html):
 *   1. Таб-переключатель направлений обучения
 *   2. Анимация счётчиков статистики в Hero-секции
 *   3. Плавное появление Hero-контента при загрузке
 *   4. Назначение имени курса кнопкам «Записаться» на карточках
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1. ТАБ-ПЕРЕКЛЮЧАТЕЛЬ НАПРАВЛЕНИЙ
  ══════════════════════════════════════════════ */

  /**
   * Переключает активный таб и соответствующую панель контента.
   * Полностью доступно: управление с клавиатуры (стрелки, Enter, Space),
   * корректные aria-атрибуты.
   */
  function initTabs() {
    const tabContainer = document.querySelector('.tabs');
    if (!tabContainer) return;

    const tabBtns   = tabContainer.querySelectorAll('.tab-btn[role="tab"]');
    const tabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');

    if (tabBtns.length === 0 || tabPanels.length === 0) return;

    /**
     * Активировать таб по индексу.
     * @param {number} newIndex — индекс активируемого таба
     * @param {boolean} focusTab — переносить ли фокус на кнопку таба
     */
    function activateTab(newIndex, focusTab) {
      tabBtns.forEach(function (btn, i) {
        const isActive = i === newIndex;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      tabPanels.forEach(function (panel, i) {
        const isActive = i === newIndex;

        if (isActive) {
          panel.classList.add('active');
          panel.hidden = false;
          // Запускаем анимацию входа
          panel.classList.remove('tab-panel--entering');
          // Форсируем reflow для перезапуска анимации
          void panel.offsetWidth;
          panel.classList.add('tab-panel--entering');
        } else {
          panel.classList.remove('active', 'tab-panel--entering');
          panel.hidden = true;
        }
      });

      if (focusTab && tabBtns[newIndex]) {
        tabBtns[newIndex].focus();
      }
    }

    // Клик по табу
    tabBtns.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        activateTab(index, false);
      });
    });

    // Клавиатурная навигация по табам (стрелки влево/вправо, Home, End)
    tabContainer.addEventListener('keydown', function (e) {
      const currentIndex = Array.from(tabBtns).indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % tabBtns.length;
          break;
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + tabBtns.length) % tabBtns.length;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabBtns.length - 1;
          break;
        default:
          return; // ничего не делаем для других клавиш
      }

      e.preventDefault();
      activateTab(newIndex, true);
    });

    // Инициализация: убеждаемся, что первый таб активен и корректно настроен
    activateTab(0, false);
  }

  initTabs();


  /* ══════════════════════════════════════════════
     2. АНИМАЦИЯ СЧЁТЧИКОВ В HERO-СЕКЦИИ
  ══════════════════════════════════════════════ */

  /**
   * Анимированно считает от 0 до целевого значения.
   * Использует requestAnimationFrame для плавности.
   * @param {HTMLElement} el — элемент, в котором отображается число
   * @param {number} target — целевое значение
   * @param {number} duration — длительность анимации в мс
   * @param {string} suffix — суффикс после числа (например, '+', ' 000+')
   */
  function animateCounter(el, target, duration, suffix) {
    suffix = suffix || '';
    const startTime = performance.now();

    /**
     * Функция плавности — ease-out cubic
     * @param {number} t — прогресс от 0 до 1
     * @returns {number}
     */
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);

      el.textContent = value.toLocaleString('ru-RU') + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('ru-RU') + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Запускаем счётчики, когда Hero-секция входит в видимость.
   */
  function initHeroCounters() {
    const heroSection = document.querySelector('.hero');
    const statNums    = document.querySelectorAll('.stat-num');

    if (!heroSection || statNums.length === 0) return;

    // Данные счётчиков: [целевое число, суффикс, длительность мс]
    const counterData = [
      { target: 2000, suffix: '+',  duration: 1800 },
      { target: 40,   suffix: '+',  duration: 1200 },
      { target: 7,    suffix: '',   duration: 900  }
    ];

    let countersStarted = false;

    if (!('IntersectionObserver' in window)) {
      // Без поддержки IO — просто показываем финальные значения
      statNums.forEach(function (el, i) {
        const data = counterData[i];
        if (data) el.textContent = data.target.toLocaleString('ru-RU') + data.suffix;
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;

          statNums.forEach(function (el, i) {
            const data = counterData[i];
            if (!data) return;

            // Запускаем с небольшим сдвигом для каскадного эффекта
            setTimeout(function () {
              animateCounter(el, data.target, data.duration, data.suffix);
            }, i * 150);
          });

          observer.unobserve(heroSection);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(heroSection);
  }

  initHeroCounters();


  /* ══════════════════════════════════════════════
     3. АНИМАЦИЯ ПОЯВЛЕНИЯ HERO-КОНТЕНТА ПРИ ЗАГРУЗКЕ
  ══════════════════════════════════════════════ */

  /**
   * Последовательно добавляем класс .hero-animate к элементам Hero,
   * создавая плавный staggered-эффект входа.
   */
  function initHeroEntrance() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;

    const animElements = [
      heroContent.querySelector('.hero-eyebrow'),
      heroContent.querySelector('.hero-title'),
      heroContent.querySelector('.hero-desc'),
      heroContent.querySelector('.hero-actions'),
      heroContent.querySelector('.hero-stats'),
      document.querySelector('.hero-visual')
    ].filter(Boolean);

    animElements.forEach(function (el, i) {
      el.style.opacity  = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      el.style.transitionDelay = (i * 100) + 'ms';

      // Используем rAF чтобы гарантировать, что стили применились до анимации
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroEntrance);
  } else {
    // DOM уже готов
    initHeroEntrance();
  }


  /* ══════════════════════════════════════════════
     4. ПЛАВАЮЩИЕ КАРТОЧКИ В HERO (parallax-lite)
  ══════════════════════════════════════════════ */

  /**
   * Лёгкий parallax-эффект для декоративных карточек в Hero.
   * Карточки чуть смещаются при движении мыши, создавая ощущение глубины.
   * Работает только на устройствах с мышью (не на тач).
   */
  function initHeroParallax() {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;

    // Не запускаем на тач-устройствах
    if (window.matchMedia('(hover: none)').matches) return;

    const floatCards = heroVisual.querySelectorAll('.hero-card-float');
    const badgeRing  = heroVisual.querySelector('.hero-badge-ring');

    let parallaxTicking = false;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!parallaxTicking) {
        requestAnimationFrame(function () {
          const winW = window.innerWidth;
          const winH = window.innerHeight;

          // Нормализуем: от -1 до +1 относительно центра экрана
          const normX = (mouseX / winW - 0.5) * 2;
          const normY = (mouseY / winH - 0.5) * 2;

          floatCards.forEach(function (card, i) {
            // Разная интенсивность для каждой карточки
            const depth = (i + 1) * 4;
            const tx = normX * depth;
            const ty = normY * depth;
            card.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
          });

          if (badgeRing) {
            const tx = normX * 8;
            const ty = normY * 8;
            badgeRing.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
          }

          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    }, { passive: true });
  }

  initHeroParallax();


  /* ══════════════════════════════════════════════
     5. ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ
     (якорные ссылки на главной, при скролле)
  ══════════════════════════════════════════════ */

  /**
   * На главной странице все ссылки меню — якорные (#courses, #advantages и т.д.)
   * global.js уже содержит общий initNavHighlight(), но на главной страница — /index.html,
   * поэтому активный пункт «Главная» должен быть всегда active при scrollY ≈ 0.
   */
  function initIndexNavActive() {
    const homeLink = document.querySelector('.nav-link[href="index.html"]');
    if (!homeLink) return;

    function checkTop() {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY < 100) {
        homeLink.classList.add('active');
        homeLink.setAttribute('aria-current', 'page');
      }
    }

    window.addEventListener('scroll', checkTop, { passive: true });
    checkTop();
  }

  initIndexNavActive();


  /* ══════════════════════════════════════════════
     6. ГОРИЗОНТАЛЬНЫЙ SCROLL ДЛЯ ТАБОВ НА МОБИЛЬНОМ
  ══════════════════════════════════════════════ */

  /**
   * На мобильных устройствах блок .tabs может быть шире экрана.
   * Обеспечиваем прокрутку к активному табу при переключении.
   */
  function initTabsScrollIntoView() {
    const tabContainer = document.querySelector('.tabs');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', function (e) {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      // Прокручиваем активный таб в видимую область
      setTimeout(function () {
        btn.scrollIntoView({
          behavior: 'smooth',
          block:    'nearest',
          inline:   'center'
        });
      }, 50);
    });
  }

  initTabsScrollIntoView();

})(); // конец IIFE
