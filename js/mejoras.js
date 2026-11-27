// Mejoras de interfaz del rediseño. No toca la lógica ni las cifras de js/app.js:
// solo sincroniza atributos de accesibilidad, el menú del celular y el estado vacío del simulador.
(function () {
  'use strict';

  // 1) Pestañas del simulador: aria-selected sigue a la clase .active que maneja app.js
  var tabs = [document.getElementById('calcTabPronto'), document.getElementById('calcTabTardio')];
  function syncTabs() {
    tabs.forEach(function (t) { if (t) t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false'); });
  }

  // 2) Estado vacío del simulador: se oculta cuando app.js muestra un resultado o el formulario
  var empty = document.getElementById('simEmpty');
  var watched = ['calcResultPronto', 'calcResultTardio', 'leadForm', 'leadSuccess', 'leadError']
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);
  function syncEmpty() {
    if (!empty) return;
    var anyVisible = watched.some(function (n) { return !n.classList.contains('hidden'); });
    empty.classList.toggle('hidden', anyVisible);
  }

  if ('MutationObserver' in window) {
    var mo = new MutationObserver(function () { syncTabs(); syncEmpty(); });
    tabs.concat(watched).forEach(function (n) { if (n) mo.observe(n, { attributes: true, attributeFilter: ['class'] }); });
  }
  syncTabs(); syncEmpty();

  // 3) Menú del celular
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      menu.classList.toggle('open', !open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menú');
      }
    });
  }

  // 4) Año del pie
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // 5) En el celular, la barra fija no tapa el CTA del inicio mientras sigue en pantalla.
  var bar = document.querySelector('.callbar');
  var heroCta = document.querySelector('.hero .btn-primary');
  function syncBar() {
    if (!bar) return;
    if (!heroCta) { bar.classList.add('is-shown'); return; }
    var r = heroCta.getBoundingClientRect();
    var onScreen = r.bottom > 64 && r.top < window.innerHeight - 8;
    bar.classList.toggle('is-shown', !onScreen);
  }
  syncBar();
  window.addEventListener('scroll', syncBar, { passive: true });
  window.addEventListener('resize', syncBar);
})();
