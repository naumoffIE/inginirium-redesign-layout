/**
 * global.js
 * =========
 * Общая логика для всех страниц сайта Инжинириум:
 *   1. Фиксированная шапка — уменьшение/прозрачность при скролле
 *   2. Бургер-меню для мобильных
 *   3. Плавная прокрутка к якорям (#section)
 *   4. Модальное окно записи на курс/лагерь (открытие, закрытие, валидация, отправка)
 *   5. Scroll-reveal через IntersectionObserver (класс .reveal-card)
 *   6. Передача имени курса в поле модального окна при клике на карточку
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1. ФИКСИРОВАННАЯ ШАПКА — реакция на скролл
  ══════════════════════════════════════════════ */

  const header = document.getElementById('siteHeader');

  /**
   * Порог в пикселях, после которого шапка переходит
   * в «compact»-режим (уменьшается и становится чуть прозрачной).
   */
  const HEADER_SCROLL_THRESHOLD = 60;

  /**
   * Используем requestAnimationFrame-дросселирование,
   * чтобы обработчик скролла не вызывался сотни раз в секунду.
   */
  let headerTicking = false;

  function updateHeader() {
    if (!header) return;

    const scrollY = window.scrollY || window.pageYOffset;

    if (scrollY > HEADER_SCROLL_THRESHOLD) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    headerTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!headerTicking) {
      requestAnimationFrame(updateHeader);
      headerTicking = true;
    }
  }, { passive: true });

  // Инициализация при загрузке страницы
  updateHeader();


  /* ══════════════════════════════════════════════
     2. БУРГЕР-МЕНЮ
  ══════════════════════════════════════════════ */

  const burgerBtn   = document.getElementById('burgerBtn');
  const mobileMenu  = document.getElementById('mobileMenu');

  /**
   * Переключаем состояние мобильного меню.
   * Управляем aria-атрибутами для доступности.
   */
  function toggleMobileMenu(forceClose) {
    if (!burgerBtn || !mobileMenu) return;

    const isOpen = burgerBtn.getAttribute('aria-expanded') === 'true';
    const shouldClose = forceClose === true || isOpen;

    if (shouldClose) {
      burgerBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.classList.remove('mobile-menu--open');
      burgerBtn.classList.remove('burger--active');
      document.body.classList.remove('body--menu-open');
    } else {
      burgerBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      mobileMenu.classList.add('mobile-menu--open');
      burgerBtn.classList.add('burger--active');
      document.body.classList.add('body--menu-open');
    }
  }

  if (burgerBtn) {
    burgerBtn.addEventListener('click', function () {
      toggleMobileMenu();
    });
  }

  // Закрываем меню при клике на любую ссылку внутри него
  if (mobileMenu) {
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        toggleMobileMenu(true);
      }
    });
  }

  // Закрываем меню при клике вне его области
  document.addEventListener('click', function (e) {
    if (!header) return;
    if (!header.contains(e.target)) {
      toggleMobileMenu(true);
    }
  });

  // Закрываем меню при нажатии Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      toggleMobileMenu(true);
    }
  });

  // Закрываем меню и сбрасываем overflow при ресайзе на десктоп
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) {
      toggleMobileMenu(true);
    }
  });


  /* ══════════════════════════════════════════════
     3. ПЛАВНАЯ ПРОКРУТКА К ЯКОРЯМ
  ══════════════════════════════════════════════ */

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const headerHeight = header ? header.offsetHeight : 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });
  });


  /* ══════════════════════════════════════════════
     4. МОДАЛЬНОЕ ОКНО
  ══════════════════════════════════════════════ */

  const modalOverlay   = document.getElementById('modalOverlay');
  const modalClose     = document.getElementById('modalClose');
  const enrollForm     = document.getElementById('enrollForm');
  const modalSuccess   = document.getElementById('modalSuccess');
  const successClose   = document.getElementById('successClose');
  const courseSelect   = document.getElementById('courseSelect');
  const shiftSelect    = document.getElementById('shiftSelect');

  /** Сохраняем элемент, с которого открыли модалку, для возврата фокуса */
  let modalTriggerElement = null;

  /**
   * Открыть модальное окно.
   * @param {string|null} courseName — название курса/смены, которое подставляется в select
   * @param {HTMLElement|null} triggerEl — элемент, вызвавший открытие
   */
  function openModal(courseName, triggerEl) {
    if (!modalOverlay) return;

    modalTriggerElement = triggerEl || null;

    // Подставляем курс в соответствующий select, если он передан
    if (courseName) {
      // Пробуем найти совпадение в courseSelect (главная) или shiftSelect (лагерь)
      const selects = [courseSelect, shiftSelect].filter(Boolean);

      selects.forEach(function (sel) {
        for (let i = 0; i < sel.options.length; i++) {
          const optText = sel.options[i].text.toLowerCase();
          const searchStr = courseName.toLowerCase();

          // Пробуем найти по тексту опции или по data-course
          if (
            optText.includes(searchStr) ||
            searchStr.includes(optText.replace(/\(.*\)/, '').trim())
          ) {
            sel.value = sel.options[i].value;
            break;
          }
        }
      });
    }

    modalOverlay.setAttribute('aria-hidden', 'false');
    modalOverlay.classList.add('modal-overlay--visible');
    document.body.classList.add('body--modal-open');

    // Фокусируем первое поле формы
    setTimeout(function () {
      const firstInput = modalOverlay.querySelector('input, select, button');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Закрыть модальное окно и сбросить его состояние.
   */
  function closeModal() {
    if (!modalOverlay) return;

    modalOverlay.setAttribute('aria-hidden', 'true');
    modalOverlay.classList.remove('modal-overlay--visible');
    document.body.classList.remove('body--modal-open');

    // Возвращаем фокус на триггер
    if (modalTriggerElement && typeof modalTriggerElement.focus === 'function') {
      modalTriggerElement.focus();
    }
    modalTriggerElement = null;

    // Сбрасываем форму через небольшую задержку (чтобы анимация закрытия прошла)
    setTimeout(function () {
      resetModal();
    }, 300);
  }

  /**
   * Сброс формы и состояния успеха в начальное положение.
   */
  function resetModal() {
    if (enrollForm)   enrollForm.reset();
    if (enrollForm)   enrollForm.hidden = false;
    if (modalSuccess) modalSuccess.hidden = true;

    // Очищаем все ошибки
    const errors = modalOverlay
      ? modalOverlay.querySelectorAll('.form-error')
      : [];
    errors.forEach(function (el) { el.textContent = ''; });

    // Снимаем классы ошибок с полей
    const inputs = modalOverlay
      ? modalOverlay.querySelectorAll('.form-input, .form-check input')
      : [];
    inputs.forEach(function (el) { el.classList.remove('form-input--error'); });
  }

  // Открытие по кнопкам «Записаться» во всём документе
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[aria-haspopup="dialog"]');
    if (!btn) return;

    // Проверяем, что это кнопка, а не ссылка (ссылки у нас тоже могут иметь этот атрибут)
    if (btn.tagName === 'A') return;

    const courseName = btn.dataset.course || null;
    openModal(courseName, btn);
  });

  // Закрытие по крестику
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Закрытие по клику на оверлей (вне окна)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Закрытие по Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay &&
        modalOverlay.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Кнопка «Закрыть» на экране успеха
  if (successClose) {
    successClose.addEventListener('click', closeModal);
  }

  // Фокус-ловушка внутри модального окна
  if (modalOverlay) {
    modalOverlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      const focusable = modalOverlay.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );
      const visible = Array.from(focusable).filter(function (el) {
        return !el.disabled && !el.hidden &&
               el.offsetParent !== null;
      });

      if (visible.length === 0) return;

      const first = visible[0];
      const last  = visible[visible.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }


  /* ── Валидация и отправка формы ─────────────── */

  /**
   * Показать ошибку под полем.
   * @param {string} fieldId — id поля ввода
   * @param {string} errorId — id элемента для ошибки
   * @param {string} message — текст ошибки
   */
  function showFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.add('form-input--error');
    if (error)  error.textContent = message;
  }

  /**
   * Убрать ошибку у поля.
   */
  function clearFieldError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.remove('form-input--error');
    if (error)  error.textContent = '';
  }

  /**
   * Валидация телефонного номера.
   * Принимает форматы: +7..., 8..., (495)..., etc.
   * @param {string} val
   * @returns {boolean}
   */
  function isValidPhone(val) {
    const cleaned = val.replace(/[\s\-\(\)]/g, '');
    return /^(\+7|7|8)?\d{10}$/.test(cleaned);
  }

  /**
   * Полная валидация формы.
   * @returns {boolean} — true, если всё корректно
   */
  function validateForm() {
    let isValid = true;

    // Имя родителя
    const parentName = document.getElementById('parentName');
    if (parentName) {
      clearFieldError('parentName', 'parentNameError');
      if (!parentName.value.trim()) {
        showFieldError('parentName', 'parentNameError', 'Пожалуйста, введите ваше имя');
        isValid = false;
      } else if (parentName.value.trim().length < 2) {
        showFieldError('parentName', 'parentNameError', 'Имя слишком короткое');
        isValid = false;
      }
    }

    // Имя ребёнка
    const childName = document.getElementById('childName');
    if (childName) {
      clearFieldError('childName', 'childNameError');
      if (!childName.value.trim()) {
        showFieldError('childName', 'childNameError', 'Пожалуйста, введите имя ребёнка');
        isValid = false;
      }
    }

    // Возраст
    const childAge = document.getElementById('childAge');
    if (childAge) {
      clearFieldError('childAge', 'childAgeError');
      if (!childAge.value) {
        showFieldError('childAge', 'childAgeError', 'Выберите возраст');
        isValid = false;
      }
    }

    // Телефон
    const phoneNumber = document.getElementById('phoneNumber');
    if (phoneNumber) {
      clearFieldError('phoneNumber', 'phoneError');
      if (!phoneNumber.value.trim()) {
        showFieldError('phoneNumber', 'phoneError', 'Пожалуйста, введите телефон');
        isValid = false;
      } else if (!isValidPhone(phoneNumber.value)) {
        showFieldError('phoneNumber', 'phoneError', 'Некорректный номер телефона');
        isValid = false;
      }
    }

    // Чекбокс согласия
    const privacyCheck = document.getElementById('privacyCheck');
    if (privacyCheck) {
      const privacyError = document.getElementById('privacyError');
      if (privacyCheck.classList) privacyCheck.classList.remove('form-input--error');
      if (privacyError) privacyError.textContent = '';

      if (!privacyCheck.checked) {
        if (privacyError) privacyError.textContent = 'Необходимо согласие на обработку данных';
        isValid = false;
      }
    }

    return isValid;
  }

  // Снимаем ошибки с полей при вводе
  if (enrollForm) {
    enrollForm.addEventListener('input', function (e) {
      const field = e.target;
      if (field.classList.contains('form-input--error')) {
        field.classList.remove('form-input--error');
        // Ищем соответствующий span ошибки
        const errorEl = document.getElementById(field.id + 'Error') ||
                        document.getElementById(field.id.replace('Number', '') + 'Error');
        if (errorEl) errorEl.textContent = '';
      }
    });

    enrollForm.addEventListener('change', function (e) {
      const field = e.target;
      if (field.classList.contains('form-input--error')) {
        field.classList.remove('form-input--error');
        const errorEl = document.getElementById(field.id + 'Error');
        if (errorEl) errorEl.textContent = '';
      }
    });
  }

  // Отправка формы
  if (enrollForm) {
    enrollForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) return;

      // Имитируем отправку (в реальности — fetch/XHR на сервер)
      const submitBtn = enrollForm.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем...';
      }

      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить заявку';
        }

        enrollForm.hidden = true;
        if (modalSuccess) {
          modalSuccess.hidden = false;
          // Фокус на заголовок успеха для читалок экрана
          const successTitle = modalSuccess.querySelector('.success-title');
          if (successTitle) successTitle.focus();
        }
      }, 1200);
    });
  }


  /* ══════════════════════════════════════════════
     5. SCROLL REVEAL — IntersectionObserver
  ══════════════════════════════════════════════ */

  /**
   * Анимация появления карточек при скролле.
   * Элементы с классом .reveal-card получают класс .reveal-card--visible
   * в момент попадания в область видимости.
   * Задержка задаётся CSS-переменной --reveal-delay, рассчитанной по индексу.
   */
  function initScrollReveal() {
    const revealCards = document.querySelectorAll('.reveal-card');
    if (revealCards.length === 0) return;

    // Если браузер не поддерживает IntersectionObserver — просто показываем всё
    if (!('IntersectionObserver' in window)) {
      revealCards.forEach(function (el) {
        el.classList.add('reveal-card--visible');
      });
      return;
    }

    /**
     * Назначаем задержку каждой карточке внутри её родительского контейнера
     * (чтобы карточки в сетке появлялись каскадом).
     */
    revealCards.forEach(function (card) {
      const parent   = card.parentElement;
      const siblings = parent
        ? Array.from(parent.querySelectorAll('.reveal-card'))
        : [];
      const index    = siblings.indexOf(card);

      // Максимум 5 карточек в каскаде (чтобы задержка не была слишком большой)
      const delayIndex = Math.min(index, 4);
      card.style.setProperty('--reveal-delay', delayIndex * 80 + 'ms');
    });

    const observerOptions = {
      root:       null,          // viewport
      rootMargin: '0px 0px -60px 0px', // срабатываем чуть раньше нижнего края
      threshold:  0.12           // 12% элемента должно быть видно
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-card--visible');
          // Перестаём следить, чтобы не сбрасывать анимацию при обратном скролле
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealCards.forEach(function (card) {
      observer.observe(card);
    });
  }

  // Запускаем после полной загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }


  /* ══════════════════════════════════════════════
     6. АКТИВНАЯ ССЫЛКА В НАВИГАЦИИ ПО СКРОЛЛУ
  ══════════════════════════════════════════════ */

  /**
   * Подсвечиваем ссылку в шапке, соответствующую текущей
   * видимой секции страницы. Работает только на якорных ссылках.
   */
  function initNavHighlight() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    if (navLinks.length === 0) return;

    const sections = [];

    navLinks.forEach(function (link) {
      const targetId = link.getAttribute('href').slice(1);
      const section  = document.getElementById(targetId);
      if (section) {
        sections.push({ link: link, section: section });
      }
    });

    if (sections.length === 0) return;

    let navTicking = false;

    function updateActiveLink() {
      const scrollY      = window.scrollY || window.pageYOffset;
      const headerHeight = header ? header.offsetHeight : 0;
      const windowMid    = scrollY + headerHeight + 100;

      let activeSection = null;

      sections.forEach(function (item) {
        const top    = item.section.offsetTop;
        const bottom = top + item.section.offsetHeight;

        if (windowMid >= top && windowMid < bottom) {
          activeSection = item;
        }
      });

      sections.forEach(function (item) {
        if (item === activeSection) {
          item.link.classList.add('active');
          item.link.setAttribute('aria-current', 'page');
        } else {
          item.link.classList.remove('active');
          item.link.removeAttribute('aria-current');
        }
      });

      navTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!navTicking) {
        requestAnimationFrame(updateActiveLink);
        navTicking = true;
      }
    }, { passive: true });
  }

  initNavHighlight();


  /* ══════════════════════════════════════════════
     7. МАСКА ВВОДА ДЛЯ ТЕЛЕФОНА
  ══════════════════════════════════════════════ */

  /**
   * Простая маска для поля телефона: автоматически форматирует ввод
   * в вид +7 (999) 999-99-99
   */
  function initPhoneMask() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');

    phoneInputs.forEach(function (input) {
      input.addEventListener('input', function (e) {
        let value = input.value.replace(/\D/g, '');

        // Убираем ведущую 7 или 8, если есть — добавим +7 сами
        if (value.startsWith('7') || value.startsWith('8')) {
          value = value.slice(1);
        }

        // Обрезаем до 10 цифр
        value = value.slice(0, 10);

        // Форматируем
        let formatted = '+7';
        if (value.length > 0) formatted += ' (' + value.slice(0, 3);
        if (value.length >= 4) formatted += ') ' + value.slice(3, 6);
        if (value.length >= 7) formatted += '-' + value.slice(6, 8);
        if (value.length >= 9) formatted += '-' + value.slice(8, 10);

        input.value = formatted;
      });

      input.addEventListener('keydown', function (e) {
        // При нажатии Backspace — не мешаем стандартному удалению
      });
    });
  }

  initPhoneMask();

})(); // конец IIFE
