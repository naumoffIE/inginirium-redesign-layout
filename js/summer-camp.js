/**
 * summer-camp.js
 * ==============
 * Логика страницы «Летний лагерь» (summer-camp.html):
 *   1. FAQ-аккордеон — плавное открытие/закрытие ответов
 *   2. Выделение карточки смены при наведении и при выборе через кнопку «Записаться»
 *   3. Анимация таймлайна расписания дня
 *   4. Автоматическая прокрутка к блоку смен при клике на кнопку в Hero
 *   5. Подстановка смены в модальное окно по кнопкам на карточках
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1. FAQ АККОРДЕОН
  ══════════════════════════════════════════════ */

  /**
   * Плавное открытие/закрытие ответов FAQ.
   * Реализован через max-height-анимацию (CSS-transition).
   * Один раскрытый вопрос за раз (accordion-режим).
   */
  function initFaqAccordion() {
    const faqList = document.querySelector('.faq-list');
    if (!faqList) return;

    const faqItems    = faqList.querySelectorAll('.faq-item');
    const faqBtns     = faqList.querySelectorAll('.faq-question');
    const faqAnswers  = faqList.querySelectorAll('.faq-answer');

    if (faqBtns.length === 0) return;

    /**
     * Закрывает ответ аккордеона.
     * @param {HTMLButtonElement} btn
     * @param {HTMLElement} answer
     */
    function closeAnswer(btn, answer) {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('faq-question--open');

      // Для плавной анимации: задаём явную высоту перед схлопыванием
      answer.style.maxHeight = answer.scrollHeight + 'px';

      // Форсируем reflow
      void answer.offsetHeight;

      answer.style.maxHeight  = '0';
      answer.style.opacity    = '0';

      // Скрываем из DOM через transition
      setTimeout(function () {
        answer.hidden = true;
        answer.style.maxHeight = '';
        answer.style.opacity   = '';
      }, 320); // длительность должна совпадать с CSS-переходом
    }

    /**
     * Открывает ответ аккордеона.
     * @param {HTMLButtonElement} btn
     * @param {HTMLElement} answer
     */
    function openAnswer(btn, answer) {
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('faq-question--open');

      answer.hidden       = false;
      answer.style.maxHeight = '0';
      answer.style.opacity   = '0';

      // Форсируем reflow для корректного старта анимации
      void answer.offsetHeight;

      answer.style.maxHeight  = answer.scrollHeight + 'px';
      answer.style.opacity    = '1';

      // После завершения анимации убираем ограничение max-height
      // (позволяет контенту расти, если содержимое динамическое)
      setTimeout(function () {
        if (btn.getAttribute('aria-expanded') === 'true') {
          answer.style.maxHeight = 'none';
        }
      }, 320);
    }

    faqBtns.forEach(function (btn, index) {
      const answer = faqAnswers[index];
      if (!answer) return;

      // Инициализируем начальное состояние
      answer.style.overflow   = 'hidden';
      answer.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';

      btn.addEventListener('click', function () {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Закрываем все остальные открытые вопросы
        faqBtns.forEach(function (otherBtn, otherIndex) {
          if (otherIndex !== index) {
            const otherAnswer = faqAnswers[otherIndex];
            if (otherBtn.getAttribute('aria-expanded') === 'true' && otherAnswer) {
              closeAnswer(otherBtn, otherAnswer);
            }
          }
        });

        // Переключаем текущий вопрос
        if (isOpen) {
          closeAnswer(btn, answer);
        } else {
          openAnswer(btn, answer);
        }
      });

      // Клавиатурная поддержка: Enter и Space
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // Клавиатурная навигация между вопросами (стрелки вверх/вниз)
    faqList.addEventListener('keydown', function (e) {
      const activeBtnIndex = Array.from(faqBtns).indexOf(document.activeElement);
      if (activeBtnIndex === -1) return;

      let newIndex = activeBtnIndex;

      if (e.key === 'ArrowDown') {
        newIndex = Math.min(activeBtnIndex + 1, faqBtns.length - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        newIndex = Math.max(activeBtnIndex - 1, 0);
        e.preventDefault();
      }

      if (newIndex !== activeBtnIndex) {
        faqBtns[newIndex].focus();
      }
    });
  }

  initFaqAccordion();


  /* ══════════════════════════════════════════════
     2. ВЫДЕЛЕНИЕ КАРТОЧКИ СМЕНЫ ПРИ КЛИКЕ «ЗАПИСАТЬСЯ»
  ══════════════════════════════════════════════ */

  /**
   * При клике на кнопку «Записаться» на карточке смены:
   * — подсвечиваем карточку (добавляем класс .shift-card--selected)
   * — снимаем выделение с остальных карточек
   */
  function initShiftCardHighlight() {
    const shiftsGrid  = document.querySelector('.shifts-grid');
    if (!shiftsGrid) return;

    const shiftCards  = shiftsGrid.querySelectorAll('.shift-card');
    const enrollBtns  = shiftsGrid.querySelectorAll('button[aria-haspopup="dialog"]');

    enrollBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const parentCard = btn.closest('.shift-card');

        shiftCards.forEach(function (card) {
          card.classList.toggle('shift-card--selected', card === parentCard);
        });
      });
    });
  }

  initShiftCardHighlight();


  /* ══════════════════════════════════════════════
     3. АНИМАЦИЯ ТАЙМЛАЙНА (расписание дня)
  ══════════════════════════════════════════════ */

  /**
   * Элементы таймлайна появляются один за другим при скролле,
   * создавая эффект «разворачивания» расписания.
   */
  function initTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      timelineItems.forEach(function (item) {
        item.classList.add('timeline-item--visible');
      });
      return;
    }

    // Сбрасываем начальное состояние (элементы невидимы)
    timelineItems.forEach(function (item, i) {
      item.style.opacity   = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'opacity 0.5s ease ' + (i * 80) + 'ms, transform 0.5s ease ' + (i * 80) + 'ms';
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateX(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold:  0.2
    });

    timelineItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  initTimelineAnimation();


  /* ══════════════════════════════════════════════
     4. ПРОКРУТКА К СМЕНАМ ПРИ КЛИКЕ НА HERO-КНОПКИ
  ══════════════════════════════════════════════ */

  /**
   * Кнопка «Смотреть смены ↓» в Hero плавно скроллит
   * к секции #shifts. Этот обработчик дополняет
   * общий в global.js (на случай особой логики на этой странице).
   */
  function initCampHeroScroll() {
    const scrollBtn   = document.querySelector('a[href="#shifts"]');
    const shiftsSection = document.getElementById('shifts');

    if (!scrollBtn || !shiftsSection) return;

    // global.js уже перехватывает клики на якоря, но здесь
    // дополнительно добавляем визуальный импульс к секции
    scrollBtn.addEventListener('click', function () {
      setTimeout(function () {
        shiftsSection.classList.add('shifts--pulse');
        setTimeout(function () {
          shiftsSection.classList.remove('shifts--pulse');
        }, 600);
      }, 700); // ждём завершения прокрутки
    });
  }

  initCampHeroScroll();


  /* ══════════════════════════════════════════════
     5. ПОДСТАНОВКА СМЕНЫ В МОДАЛЬНОЕ ОКНО
  ══════════════════════════════════════════════ */

  /**
   * Когда пользователь нажимает «Записаться» на конкретной карточке смены,
   * текст data-course уже передаётся в global.js → openModal().
   * Здесь дополнительно обновляем заголовок модалки
   * (модальный заголовок меняется под контекст записи).
   */
  function initModalCourseTitle() {
    const modalTitle  = document.getElementById('modalTitle');
    const modalEyebrow = document.querySelector('.modal-eyebrow');

    if (!modalTitle) return;

    // Наблюдаем за открытием модалки (изменение aria-hidden на оверлее)
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    const mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName !== 'aria-hidden') return;

        const isOpen = overlay.getAttribute('aria-hidden') === 'false';
        if (!isOpen) return;

        // Ищем активную карточку смены
        const selectedCard = document.querySelector('.shift-card--selected');
        if (!selectedCard) return;

        const shiftTitle = selectedCard.querySelector('.shift-title');
        if (!shiftTitle) return;

        const shiftName = shiftTitle.textContent.trim();

        // Обновляем заголовок и шапку модального окна
        if (modalTitle) {
          modalTitle.textContent = 'Запись: ' + shiftName;
        }
        if (modalEyebrow) {
          modalEyebrow.textContent = '🏕️ Летний лагерь 2025';
        }
      });
    });

    mutationObserver.observe(overlay, { attributes: true });
  }

  initModalCourseTitle();


  /* ══════════════════════════════════════════════
     6. STICKY «ЗАПИСАТЬСЯ» БАННЕР ПРИ СКРОЛЛЕ
  ══════════════════════════════════════════════ */

  /**
   * После прокрутки ниже Hero-секции снизу экрана появляется
   * маленький фиксированный баннер с кнопкой «Записаться в лагерь».
   * Исчезает, когда пользователь доходит до Footer.
   */
  function initStickyBanner() {
    // Создаём баннер программно
    const banner = document.createElement('div');
    banner.className     = 'sticky-banner';
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = [
      '<span class="sticky-banner__text">Осталось мало мест!</span>',
      '<button class="btn btn-primary btn-sm sticky-banner__btn"',
      '        aria-haspopup="dialog"',
      '        aria-label="Записаться в летний лагерь">',
      '  🏕️ Записаться',
      '</button>'
    ].join('\n');

    document.body.appendChild(banner);

    const campHero = document.querySelector('.camp-hero');
    const footer   = document.querySelector('.site-footer');

    if (!campHero || !footer) {
      banner.remove();
      return;
    }

    let bannerTicking = false;
    let bannerVisible = false;

    function updateBanner() {
      const scrollY       = window.scrollY || window.pageYOffset;
      const heroBottom    = campHero.offsetTop + campHero.offsetHeight;
      const footerTop     = footer.offsetTop;
      const windowBottom  = scrollY + window.innerHeight;

      const shouldShow = scrollY > heroBottom && windowBottom < footerTop + 100;

      if (shouldShow && !bannerVisible) {
        bannerVisible = true;
        banner.classList.add('sticky-banner--visible');
        banner.setAttribute('aria-hidden', 'false');
      } else if (!shouldShow && bannerVisible) {
        bannerVisible = false;
        banner.classList.remove('sticky-banner--visible');
        banner.setAttribute('aria-hidden', 'true');
      }

      bannerTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!bannerTicking) {
        requestAnimationFrame(updateBanner);
        bannerTicking = true;
      }
    }, { passive: true });

    updateBanner();
  }

  // Запускаем только на достаточно больших экранах и не на мобильных с маленьким viewport
  if (window.innerWidth >= 768) {
    initStickyBanner();
  }


  /* ══════════════════════════════════════════════
     7. АНИМАЦИЯ СЧЁТЧИКА ДАТ В HERO
  ══════════════════════════════════════════════ */

  /**
   * Карточка с датами смен анимируется при входе в viewport.
   */
  function initDatesCardAnimation() {
    const datesCard = document.querySelector('.dates-card');
    if (!datesCard) return;

    if (!('IntersectionObserver' in window)) return;

    datesCard.style.opacity   = '0';
    datesCard.style.transform = 'translateY(30px) scale(0.97)';
    datesCard.style.transition = 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s';

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0) scale(1)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    observer.observe(datesCard);
  }

  // Небольшая задержка, чтобы не конфликтовать с CSS-анимациями Hero
  setTimeout(initDatesCardAnimation, 200);


  /* ══════════════════════════════════════════════
     8. ОБНОВЛЕНИЕ ЗАГОЛОВКА СТРАНИЦЫ В <TITLE>
        (breadcrumb-like поведение для SEO)
  ══════════════════════════════════════════════ */

  /**
   * При загрузке страницы убеждаемся, что тайтл содержит
   * ключевое слово текущего года для актуальности.
   * В реальном проекте это делается на сервере/CMS.
   */
  (function updatePageTitle() {
    const currentYear = new Date().getFullYear();
    if (document.title && !document.title.includes(String(currentYear))) {
      document.title = document.title.replace(/\d{4}/, String(currentYear));
    }
  })();

})(); // конец IIFE
