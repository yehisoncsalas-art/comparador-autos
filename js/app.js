// Comparador de Autos — lógica de la app (vanilla JS, sin dependencias)
// Catálogo: 284 modelos / 1345 versiones, fuente: catálogo público de referencia.
// Rediseño visual: solo cambian textos visibles; tablas, cifras y fórmulas se mantienen.
// build: 2026-11-04b

const FAVORITES_KEY = 'yc_favorites';

const state = {
  filteredCars: [...CARS],
  compareIds: [],
  sortBy: 'popular',
  favoriteIds: new Set(loadFavorites()),
  showFavoritesOnly: false,
  visibleCount: 24,
};

const PAGE_SIZE = 24;

const el = {
  searchText: document.getElementById('searchText'),
  filterCategory: document.getElementById('filterCategory'),
  filterBrand: document.getElementById('filterBrand'),
  filterCapacity: document.getElementById('filterCapacity'),
  filterTag: document.getElementById('filterTag'),
  sortBy: document.getElementById('sortBy'),
  priceMin: document.getElementById('priceMin'),
  priceMax: document.getElementById('priceMax'),
  clearFilters: document.getElementById('clearFilters'),
  resultsCount: document.getElementById('resultsCount'),
  toggleFavorites: document.getElementById('toggleFavorites'),
  favCount: document.getElementById('favCount'),
  carGrid: document.getElementById('carGrid'),
  emptyState: document.getElementById('emptyState'),
  comparePanel: document.getElementById('comparePanel'),
  compareLabel: document.getElementById('compareLabel'),
  compareChips: document.getElementById('compareChips'),
  btnCompare: document.getElementById('btnCompare'),
  btnClearCompare: document.getElementById('btnClearCompare'),
  detailModal: document.getElementById('detailModal'),
  detailBody: document.getElementById('detailBody'),
  compareModal: document.getElementById('compareModal'),
  compareBody: document.getElementById('compareBody'),
  calcSection: document.getElementById('calcSection'),
  calcTabPronto: document.getElementById('calcTabPronto'),
  calcTabTardio: document.getElementById('calcTabTardio'),
  calcGridPronto: document.getElementById('calcGridPronto'),
  calcGridTardio: document.getElementById('calcGridTardio'),
  calcCertPronto: document.getElementById('calcCertPronto'),
  calcCertTardio: document.getElementById('calcCertTardio'),
  calcEntradaTardio: document.getElementById('calcEntradaTardio'),
  calcBtn: document.getElementById('calcBtn'),
  calcResultPronto: document.getElementById('calcResultPronto'),
  prontoCuota: document.getElementById('prontoCuota'),
  prontoEntrada: document.getElementById('prontoEntrada'),
  prontoCuotasRestantes: document.getElementById('prontoCuotasRestantes'),
  prontoTotal: document.getElementById('prontoTotal'),
  prontoWhatsappBtn: document.getElementById('prontoWhatsappBtn'),
  calcShowLeadForm: document.getElementById('calcShowLeadForm'),
  calcResultTardio: document.getElementById('calcResultTardio'),
  tardioNotEnough: document.getElementById('tardioNotEnough'),
  tardioMinEntrada: document.getElementById('tardioMinEntrada'),
  tardioResultsBox: document.getElementById('tardioResultsBox'),
  tardioCuotaReducida: document.getElementById('tardioCuotaReducida'),
  tardioTotalReducida: document.getElementById('tardioTotalReducida'),
  tardioCuotaPlazo: document.getElementById('tardioCuotaPlazo'),
  tardioCuotasPlazo: document.getElementById('tardioCuotasPlazo'),
  tardioTotalPlazo: document.getElementById('tardioTotalPlazo'),
  tardioWhatsappBtn: document.getElementById('tardioWhatsappBtn'),
  leadForm: document.getElementById('leadForm'),
  leadAutoInteres: document.getElementById('leadAutoInteres'),
  leadCuotaEstimada: document.getElementById('leadCuotaEstimada'),
  leadNombre: document.getElementById('leadNombre'),
  leadCelular: document.getElementById('leadCelular'),
  leadSuccess: document.getElementById('leadSuccess'),
  leadError: document.getElementById('leadError'),
  loadMoreWrap: document.getElementById('loadMoreWrap'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
};

function trackEvent(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favoriteIds]));
  } catch (e) {
    /* localStorage unavailable (private mode, etc.) — favorites just won't persist */
  }
}

function toggleFavorite(id) {
  const wasFav = state.favoriteIds.has(id);
  if (wasFav) {
    state.favoriteIds.delete(id);
  } else {
    state.favoriteIds.add(id);
  }
  saveFavorites();
  trackEvent('add_favorite', { car_id: id, action: wasFav ? 'remove' : 'add' });
  updateFavCount();
  return !wasFav;
}

function updateFavCount() {
  el.favCount.textContent = state.favoriteIds.size;
}

// Tarifario vigente, con IGV. Fuente: tabla vigente del asesor.
// Auto Pronto (adelanto de 24 cuotas) — 60 meses
const AUTO_PRONTO = [
  { cert: 12000, ins: 566.40, cuota: 259.00 },
  { cert: 13000, ins: 613.60, cuota: 280.59 },
  { cert: 14000, ins: 660.80, cuota: 298.03 },
  { cert: 16000, ins: 755.20, cuota: 340.62 },
  { cert: 17500, ins: 826.00, cuota: 372.55 },
  { cert: 19000, ins: 896.80, cuota: 404.49 },
  { cert: 21000, ins: 991.20, cuota: 447.05 },
  { cert: 22000, ins: 1038.40, cuota: 468.35 },
  { cert: 23000, ins: 1085.60, cuota: 489.62 },
  { cert: 24000, ins: 1132.80, cuota: 510.92 },
];
// Auto Ahorro — 80 meses (base para el ingreso tardío / plan 50)
const AUTO_AHORRO = [
  { cert: 12000, ins: 566.40, cuota: 190.71 },
  { cert: 13500, ins: 637.20, cuota: 205.19 },
  { cert: 14500, ins: 684.40, cuota: 220.39 },
  { cert: 16000, ins: 755.20, cuota: 243.19 },
  { cert: 17000, ins: 802.40, cuota: 258.39 },
  { cert: 18000, ins: 849.60, cuota: 273.59 },
  { cert: 19000, ins: 896.80, cuota: 288.78 },
  { cert: 20000, ins: 944.00, cuota: 303.98 },
  { cert: 21200, ins: 1000.64, cuota: 322.23 },
  { cert: 24000, ins: 1132.80, cuota: 364.78 },
];
const ADMIN_RATE = 0.183; // administración Auto Ahorro
const IGV_RATE = 0.18;

function pickCert(table, priceLike) {
  const price = Number(priceLike) || 0;
  return table.find(row => row.cert >= price) || table[table.length - 1];
}

function fmtMoney2(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function populateCalcCertSelects() {
  [el.calcCertPronto, el.calcCertTardio].forEach((select, idx) => {
    const table = idx === 0 ? AUTO_PRONTO : AUTO_AHORRO;
    select.innerHTML = '';
    table.forEach(row => {
      const opt = document.createElement('option');
      opt.value = row.cert;
      opt.textContent = fmtPrice(row.cert);
      select.appendChild(opt);
    });
    select.value = table[Math.min(5, table.length - 1)].cert;
  });
}

function switchCalcTab(plan) {
  const isPronto = plan === 'pronto';
  el.calcTabPronto.classList.toggle('active', isPronto);
  el.calcTabTardio.classList.toggle('active', !isPronto);
  el.calcGridPronto.classList.toggle('hidden', !isPronto);
  el.calcGridTardio.classList.toggle('hidden', isPronto);
  el.calcResultPronto.classList.add('hidden');
  el.calcResultTardio.classList.add('hidden');
  if (isPronto) calculatePronto(true); else calculateTardio(true);
}

function calcularAutoPronto(row) {
  const entrada = row.ins + 24 * row.cuota;
  const total = row.ins + 60 * row.cuota;
  return { entrada, cuota: row.cuota, cuotasRestantes: 36, total };
}

function calcularIngresoTardio(row, entradaCliente) {
  const obligacion = row.cert * (1 + ADMIN_RATE * (1 + IGV_RATE));
  const cuotaProrrateada = obligacion / 50;
  const minEntrada = row.ins + cuotaProrrateada;
  if (entradaCliente < minEntrada) {
    return { ok: false, minEntrada };
  }
  const remate = entradaCliente - row.ins - cuotaProrrateada;
  const saldo = obligacion - cuotaProrrateada - remate;
  const reducirCuota = { cuota: saldo / 50, cuotas: 50, total: entradaCliente + saldo };
  const nPlazo = saldo / cuotaProrrateada;
  const reducirPlazo = { cuota: cuotaProrrateada, cuotas: nPlazo, total: entradaCliente + saldo };
  return { ok: true, obligacion, cuotaProrrateada, remate, saldo, reducirCuota, reducirPlazo };
}

function calculatePronto(silent) {
  const row = pickCert(AUTO_PRONTO, el.calcCertPronto.value);
  const r = calcularAutoPronto(row);

  el.prontoCuota.textContent = fmtMoney2(r.cuota) + '/mes';
  el.prontoEntrada.textContent = fmtMoney2(r.entrada);
  el.prontoCuotasRestantes.textContent = r.cuotasRestantes;
  el.prontoTotal.textContent = fmtMoney2(r.total);
  el.calcResultPronto.classList.remove('hidden');
  el.calcResultTardio.classList.add('hidden');

  const msg = `Hola Yehison, simulé el plan "Paga ~55% y llévate tu auto" (adelanto de 24 cuotas) para un certificado de ${fmtPrice(row.cert)}: entrada ${fmtMoney2(r.entrada)} y cuota de ${fmtMoney2(r.cuota)}/mes. ¿Me ayudas a confirmar los detalles?`;
  el.prontoWhatsappBtn.href = `https://wa.me/51983311727?text=${encodeURIComponent(msg)}`;

  el.leadAutoInteres.value = `Paga ~55% (adelanto de 24 cuotas) — certificado ${fmtPrice(row.cert)}`;
  el.leadCuotaEstimada.value = fmtMoney2(r.cuota) + '/mes';

  if (!silent) trackEvent('calculate_quote', { plan: 'auto_pronto', certificado: row.cert, cuota: r.cuota });
  if (!silent) el.calcResultPronto.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calculateTardio(silent) {
  const row = pickCert(AUTO_AHORRO, el.calcCertTardio.value);
  const entradaCliente = Number(el.calcEntradaTardio.value) || 0;
  const r = calcularIngresoTardio(row, entradaCliente);

  el.calcResultTardio.classList.remove('hidden');
  el.calcResultPronto.classList.add('hidden');

  if (!r.ok) {
    el.tardioNotEnough.classList.remove('hidden');
    el.tardioMinEntrada.textContent = fmtMoney2(r.minEntrada);
    el.tardioResultsBox.classList.add('hidden');
    if (!silent) trackEvent('calculate_quote', { plan: 'ingreso_tardio', certificado: row.cert, result: 'insufficient_entrada' });
    if (!silent) el.calcResultTardio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  el.tardioNotEnough.classList.add('hidden');
  el.tardioResultsBox.classList.remove('hidden');

  el.tardioCuotaReducida.textContent = fmtMoney2(r.reducirCuota.cuota) + '/mes';
  el.tardioTotalReducida.textContent = fmtMoney2(r.reducirCuota.total);
  el.tardioCuotaPlazo.textContent = fmtMoney2(r.reducirPlazo.cuota) + '/mes';
  el.tardioCuotasPlazo.textContent = Math.ceil(r.reducirPlazo.cuotas);
  el.tardioTotalPlazo.textContent = fmtMoney2(r.reducirPlazo.total);

  const msg = `Hola Yehison, simulé el plan "Entra con tu inicial" (ingreso en la cuota 30) para un certificado de ${fmtPrice(row.cert)} con inicial de ${fmtMoney2(entradaCliente)}. Me sale una cuota de ${fmtMoney2(r.reducirCuota.cuota)}/mes reduciendo cuota. ¿Me ayudas a confirmar con el cronograma oficial?`;
  el.tardioWhatsappBtn.href = `https://wa.me/51983311727?text=${encodeURIComponent(msg)}`;

  el.leadAutoInteres.value = `Autoahorro (ingreso cuota 30) — certificado ${fmtPrice(row.cert)}, inicial ${fmtMoney2(entradaCliente)}`;
  el.leadCuotaEstimada.value = fmtMoney2(r.reducirCuota.cuota) + '/mes';

  if (!silent) trackEvent('calculate_quote', { plan: 'ingreso_tardio', certificado: row.cert, entrada: entradaCliente, cuota_reducida: r.reducirCuota.cuota });
  if (!silent) el.calcResultTardio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calculateActive() {
  if (el.calcTabTardio.classList.contains('active')) {
    calculateTardio();
  } else {
    calculatePronto();
  }
}

function goToCalculator(car) {
  closeModals();
  switchCalcTab('pronto');
  if (car && car.priceFrom) {
    el.calcCertPronto.value = pickCert(AUTO_PRONTO, car.priceFrom).cert;
  }
  el.calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  calculatePronto();
}

function submitLeadForm(e) {
  e.preventDefault();
  const form = el.leadForm;
  const data = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  if (el.leadError) el.leadError.classList.add('hidden');

  fetch('/api/lead', {
    method: 'POST',
    body: data,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('fail');
      let payload = null;
      try { payload = await res.json(); } catch (_) {}
      if (payload && payload.ok === false) throw new Error('fail');
      trackEvent('generate_lead', {
        auto_interes: el.leadAutoInteres.value,
        cuota_estimada: el.leadCuotaEstimada.value,
      });
      form.classList.add('hidden');
      el.leadSuccess.classList.remove('hidden');
      if (el.leadError) el.leadError.classList.add('hidden');
    })
    .catch(() => {
      // Respaldo: el cliente envía sus datos por WhatsApp para no perder el lead
      const waBtn = document.getElementById('leadErrorWa');
      if (waBtn) {
        const msg = `Hola Yehison, soy ${data.get('nombre') || ''} (cel. ${data.get('celular') || ''}). Me interesa: ${data.get('auto_interes') || 'financiar un auto'}${data.get('cuota_estimada') ? ', cuota estimada ' + data.get('cuota_estimada') : ''}. ¿Me contactas?`;
        waBtn.href = `https://wa.me/51983311727?text=${encodeURIComponent(msg)}`;
      }
      if (el.leadError) el.leadError.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mis datos';
    });
}

function init() {
  populateFilterOptions();
  populateCalcCertSelects();
  updateFavCount();
  applyFilters();
  bindEvents();
  calculatePronto(true);
  const filters = document.querySelector('.search-filters');
  if (filters && window.matchMedia) {
    const mq = window.matchMedia('(min-width: 801px)');
    const syncFilters = () => { filters.open = mq.matches; };
    syncFilters();
    if (mq.addEventListener) mq.addEventListener('change', syncFilters);
    else if (mq.addListener) mq.addListener(syncFilters);
  }
}

function capacityLabel(car) {
  if (!car.capacity || !['7', '8', '9+'].includes(car.capacity)) return null;
  return `${car.capacity} plazas (3 filas)`;
}

const TAG_META = {
  'alta-demanda': { icon: '🔥', label: 'Alta demanda', className: 'tag-demand' },
  'mejor-calificado': { icon: '✅', label: 'Mejor calificado', className: 'tag-rated' },
  'mejor-precio-calidad': { icon: '💰', label: 'Mejor precio-calidad', className: 'tag-value' },
};

function carTagsMeta(car) {
  return (car.tags || []).map(t => TAG_META[t]).filter(Boolean);
}

function fmtPrice(n) {
  if (n === null || n === undefined || !isFinite(n)) return 'Consultar';
  return '$' + n.toLocaleString('en-US');
}

function populateFilterOptions() {
  const categories = [...new Set(CARS.map(c => c.category).filter(Boolean))].sort();
  const brands = [...new Set(CARS.map(c => c.brand))].sort();

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    el.filterCategory.appendChild(opt);
  });
  brands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    el.filterBrand.appendChild(opt);
  });
}

function bindEvents() {
  el.searchText.addEventListener('input', applyFilters);
  el.filterCategory.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'category', value: el.filterCategory.value });
    applyFilters();
  });
  el.filterBrand.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'brand', value: el.filterBrand.value });
    applyFilters();
  });
  el.filterCapacity.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'capacity', value: el.filterCapacity.value });
    applyFilters();
  });
  el.filterTag.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'tag', value: el.filterTag.value });
    applyFilters();
  });
  el.sortBy.addEventListener('change', applyFilters);
  el.priceMin.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'price_min', value: el.priceMin.value });
    applyFilters();
  });
  el.priceMax.addEventListener('change', () => {
    trackEvent('filter_used', { filter_type: 'price_max', value: el.priceMax.value });
    applyFilters();
  });
  el.clearFilters.addEventListener('click', () => {
    el.searchText.value = '';
    el.filterCategory.value = '';
    el.filterBrand.value = '';
    el.filterCapacity.value = '';
    el.filterTag.value = '';
    el.sortBy.value = 'popular';
    el.priceMin.value = '';
    el.priceMax.value = '';
    applyFilters();
  });

  el.toggleFavorites.addEventListener('click', () => {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    el.toggleFavorites.classList.toggle('is-active', state.showFavoritesOnly);
    document.getElementById('favIcon').textContent = state.showFavoritesOnly ? '♥' : '♡';
    applyFilters();
  });

  el.btnCompare.addEventListener('click', () => {
    trackEvent('compare_cars', { car_ids: state.compareIds.join(','), count: state.compareIds.length });
    openCompareModal();
  });
  el.btnClearCompare.addEventListener('click', () => {
    state.compareIds = [];
    renderGrid();
    updateCompareBar();
  });

  document.querySelectorAll('[data-close]').forEach(elem => {
    elem.addEventListener('click', closeModals);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModals();
  });

  window.addEventListener('hashchange', handleHashChange);

  el.calcTabPronto.addEventListener('click', () => switchCalcTab('pronto'));
  el.calcTabTardio.addEventListener('click', () => switchCalcTab('tardio'));
  el.calcBtn.addEventListener('click', calculateActive);
  // Recalcular al cambiar el valor o la inicial, sin tener que pulsar "Calcular"
  el.calcCertPronto.addEventListener('change', calculatePronto);
  el.calcCertTardio.addEventListener('change', calculateTardio);
  el.calcEntradaTardio.addEventListener('change', calculateTardio);
  el.calcShowLeadForm.addEventListener('click', () => {
    el.leadForm.classList.remove('hidden');
    el.leadNombre.focus();
  });
  document.querySelector('.calc-show-lead-form-tardio').addEventListener('click', () => {
    el.leadForm.classList.remove('hidden');
    el.leadNombre.focus();
  });
  el.leadForm.addEventListener('submit', submitLeadForm);
  if (el.loadMoreBtn) {
    el.loadMoreBtn.addEventListener('click', () => {
      state.visibleCount += PAGE_SIZE;
      renderGrid();
    });
  }

  document.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', () => {
      trackEvent('trending_brand_click', { brand: card.dataset.brand });
      el.filterBrand.value = card.dataset.brand;
      applyFilters();
      el.carGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Delegated listeners so WhatsApp/tel links created later (detail modal, compare table) are tracked too.
  document.addEventListener('click', e => {
    const waLink = e.target.closest('a[href^="https://wa.me/"], a[href^="https://api.whatsapp.com/"]');
    if (waLink) {
      let location = 'other';
      if (waLink.closest('.topbar')) location = 'topbar';
      else if (waLink.classList.contains('whatsapp-float')) location = 'floating';
      else if (waLink.closest('#detailBody')) location = 'detail';
      else if (waLink.closest('#compareBody')) location = 'compare';
      else if (waLink.closest('#calcSection')) location = 'calculator';
      trackEvent('whatsapp_click', { location });
      return;
    }
    const telLink = e.target.closest('a[href^="tel:"]');
    if (telLink) trackEvent('phone_click', {});
  });
}

function handleHashChange() {
  const hash = decodeURIComponent(location.hash.slice(1));

  if (hash.startsWith('compare=')) {
    const ids = hash.slice('compare='.length).split(',').filter(id => CARS.some(c => c.id === id));
    if (ids.length >= 2) {
      state.compareIds = ids.slice(0, 3);
      renderGrid();
      updateCompareBar();
      openCompareModal();
    }
    return;
  }

  if (hash && CARS.some(c => c.id === hash)) {
    renderDetailModal(hash);
  } else if (!hash) {
    el.detailModal.classList.add('hidden');
    el.compareModal.classList.add('hidden');
  }
}

const TOP_BRANDS = ['Toyota', 'KIA', 'Hyundai', 'Changan', 'Jetour', 'Chevrolet', 'Geely', 'Ford', 'JAC', 'Chery'];

function applyFilters() {
  const text = el.searchText.value.trim().toLowerCase();
  const cat = el.filterCategory.value;
  const brand = el.filterBrand.value;
  const capacity = el.filterCapacity.value;
  const tag = el.filterTag.value;
  const sort = el.sortBy.value;
  const priceMin = el.priceMin.value ? Number(el.priceMin.value) : null;
  const priceMax = el.priceMax.value ? Number(el.priceMax.value) : null;

  state.filteredCars = CARS.filter(c => {
    const versionNames = c.versions.map(v => v.trim).join(' ');
    const haystack = `${c.brand} ${c.model} ${c.category} ${versionNames}`.toLowerCase();
    const matchesText = !text || haystack.includes(text);
    const matchesCat = !cat || c.category === cat;
    const matchesBrand = !brand || c.brand === brand;
    const matchesCapacity = !capacity || (capacity === '7plus' && ['7', '8', '9+'].includes(c.capacity));
    const matchesTag = !tag || (c.tags || []).includes(tag);
    const matchesPriceMin = priceMin === null || (c.priceFrom ?? Infinity) >= priceMin;
    const matchesPriceMax = priceMax === null || (c.priceFrom ?? -Infinity) <= priceMax;
    const matchesFavorite = !state.showFavoritesOnly || state.favoriteIds.has(c.id);
    return matchesText && matchesCat && matchesBrand && matchesCapacity && matchesTag && matchesPriceMin && matchesPriceMax && matchesFavorite;
  });

  if (sort === 'price-asc') {
    state.filteredCars.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
  } else if (sort === 'price-desc') {
    state.filteredCars.sort((a, b) => (b.priceFrom ?? -Infinity) - (a.priceFrom ?? -Infinity));
  } else if (sort === 'popular') {
    // Más vendidos: primero los de alta demanda, luego por ranking de marca (AAP) y precio
    const rank = b => { const i = TOP_BRANDS.indexOf(b); return i === -1 ? 99 : i; };
    const hot = c => ((c.tags || []).includes('alta-demanda') ? 0 : 1);
    state.filteredCars.sort((a, b) => hot(a) - hot(b) || rank(a.brand) - rank(b.brand) || (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
  } else {
    state.filteredCars.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
  }

  state.visibleCount = PAGE_SIZE;
  renderGrid();
}

function renderGrid() {
  el.carGrid.innerHTML = '';
  el.resultsCount.textContent = `${state.filteredCars.length} de ${CARS.length} modelos`;
  el.emptyState.classList.toggle('hidden', state.filteredCars.length > 0);
  const visible = state.filteredCars.slice(0, state.visibleCount);
  const remaining = state.filteredCars.length - visible.length;
  if (el.loadMoreWrap) {
    el.loadMoreWrap.classList.toggle('hidden', remaining <= 0);
  }
  if (el.loadMoreBtn) {
    el.loadMoreBtn.textContent = remaining > 0 ? `Ver más (${remaining} restantes)` : 'Ver más';
  }

  visible.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';

    const img = document.createElement('img');
    img.src = (car.images && car.images[0]) || '';
    img.alt = `${car.brand} ${car.model}`;
    img.loading = 'lazy';
    img.onerror = () => { img.style.display = 'none'; };
    card.appendChild(img);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'card-compare-check';
    checkbox.title = 'Agregar a comparación';
    checkbox.checked = state.compareIds.includes(car.id);
    checkbox.addEventListener('click', e => {
      e.stopPropagation();
      toggleCompare(car.id);
    });
    card.appendChild(checkbox);

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'card-fav-btn' + (state.favoriteIds.has(car.id) ? ' is-fav' : '');
    favBtn.title = 'Guardar en favoritos';
    favBtn.textContent = state.favoriteIds.has(car.id) ? '♥' : '♡';
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isFav = toggleFavorite(car.id);
      favBtn.classList.toggle('is-fav', isFav);
      favBtn.textContent = isFav ? '♥' : '♡';
      if (state.showFavoritesOnly) applyFilters();
    });
    card.appendChild(favBtn);

    const tagsMeta = carTagsMeta(car);
    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
      ${tagsMeta.length ? `<div class="card-tags">${tagsMeta.map(t => `<span class="card-tag ${t.className}">${t.icon} ${t.label}</span>`).join('')}</div>` : ''}
      <div class="card-brand">${car.brand}</div>
      <div class="card-model">${car.model}</div>
      <div class="card-category">${car.category || ''} · ${car.versions.length} versión${car.versions.length === 1 ? '' : 'es'}</div>
      ${capacityLabel(car) ? `<div class="card-capacity">👨‍👩‍👧‍👦 ${capacityLabel(car)}</div>` : ''}
      <div class="card-price">Desde ${fmtPrice(car.priceFrom)} <small>USD</small></div>
    `;
    card.appendChild(body);

    card.addEventListener('click', () => openDetail(car.id));
    el.carGrid.appendChild(card);
  });
}

function toggleCompare(id) {
  const idx = state.compareIds.indexOf(id);
  if (idx >= 0) {
    state.compareIds.splice(idx, 1);
  } else {
    if (state.compareIds.length >= 3) {
      alert('Puedes comparar hasta 3 autos a la vez.');
      renderGrid();
      return;
    }
    state.compareIds.push(id);
  }
  renderGrid();
  updateCompareBar();
}

function updateCompareBar() {
  const n = state.compareIds.length;
  el.comparePanel.classList.toggle('hidden', n === 0);
  el.compareLabel.textContent = `${n} auto${n === 1 ? '' : 's'} seleccionado${n === 1 ? '' : 's'} para comparar`;
  el.btnCompare.disabled = n < 2;

  el.compareChips.innerHTML = '';
  state.compareIds.forEach(id => {
    const car = CARS.find(c => c.id === id);
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${car.brand} ${car.model} <button data-id="${id}">&times;</button>`;
    chip.querySelector('button').addEventListener('click', () => toggleCompare(id));
    el.compareChips.appendChild(chip);
  });
}

function youtubeSearchUrl(car, trim) {
  const q = encodeURIComponent(`${car.brand} ${car.model} ${trim ? trim + ' ' : ''}review interior exterior`.trim());
  return `https://www.youtube.com/results?search_query=${q}`;
}

function whatsappUrl(car) {
  const msg = `Hola Yehison, me interesa el ${car.brand} ${car.model}${car.priceFrom ? ' (desde ' + fmtPrice(car.priceFrom) + ')' : ''}. ¿Me das más información?`;
  return `https://wa.me/51983311727?text=${encodeURIComponent(msg)}`;
}

function getSimilarCars(car, limit = 4) {
  const basePrice = car.priceFrom ?? Infinity;
  const candidates = CARS
    .filter(c => c.id !== car.id && c.category === car.category)
    .map(c => {
      const price = c.priceFrom ?? Infinity;
      return { c, cheaperOrEqual: price <= basePrice, diff: Math.abs(price - basePrice) };
    });
  candidates.sort((a, b) => {
    if (a.cheaperOrEqual !== b.cheaperOrEqual) return a.cheaperOrEqual ? -1 : 1;
    return a.diff - b.diff;
  });
  return candidates.slice(0, limit).map(x => x.c);
}

function openDetail(id) {
  if (location.hash.slice(1) !== id) {
    location.hash = id;
  } else {
    renderDetailModal(id);
  }
}

function copyDetailLink(btn) {
  const url = location.href;
  const done = () => {
    const original = btn.textContent;
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = original; }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copia este link:', url));
  } else {
    prompt('Copia este link:', url);
  }
}

function shareDetail(btn, car) {
  const url = location.href;
  const shareData = {
    title: `${car.brand} ${car.model} — Yehison Cerpa`,
    text: `Mira el ${car.brand} ${car.model} desde ${fmtPrice(car.priceFrom)} USD en el catálogo de Yehison Cerpa.`,
    url,
  };
  trackEvent('share_car', { car_id: car.id });
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    copyDetailLink(btn);
  }
}

function copyDetailLinkDirect(btn, car) {
  trackEvent('copy_link', { car_id: car.id });
  copyDetailLink(btn);
}

function renderDetailModal(id) {
  const car = CARS.find(c => c.id === id);
  if (!car) return;

  trackEvent('view_car_detail', { car_id: id, brand: car.brand, model: car.model });

  const images = (car.images || []).map(src => `<img src="${src}" alt="${car.brand} ${car.model}" onerror="this.style.display='none'">`).join('');

  const versionsRows = car.versions.map(v => `
    <tr>
      <td>${v.trim}${v.featured ? '<span class="featured-badge">Destacado</span>' : ''}</td>
      <td>${v.year}</td>
      <td>${v.engine || '—'}</td>
      <td>${v.transmission || '—'}</td>
      <td>${v.fuel || '—'}</td>
      <td>${v.traction || '—'}</td>
      <td class="price-tag">${fmtPrice(v.priceFinal ?? v.priceList)}${v.promo ? `<br><span class="promo-tag">${v.promo}</span>` : ''}</td>
    </tr>
  `).join('');

  const specs = car.specs;
  const specItems = specs ? [
    specs.hp && { label: 'Potencia', value: specs.hp + ' HP' },
    specs.torque && { label: 'Torque', value: specs.torque + ' Nm' },
    specs.consumption && { label: 'Consumo', value: specs.consumption + ' L/100km' },
    specs.trunk && { label: 'Baúl', value: specs.trunk + ' L' },
    specs.airbags && { label: 'Airbags', value: specs.airbags },
    specs.screen && { label: 'Pantalla', value: specs.screen },
    specs.carplay && { label: 'CarPlay / Android Auto', value: specs.carplay },
    specs.wirelessCharge && { label: 'Carga inalámbrica', value: specs.wirelessCharge },
    specs.seats && { label: 'Asientos', value: specs.seats },
  ].filter(Boolean) : [];

  const specHtml = specItems.length ? `
    <div class="gallery-label">Características técnicas</div>
    <div class="spec-grid">
      ${specItems.map(s => `<div class="spec-item"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div>`).join('')}
    </div>
  ` : '';

  const planHtml = car.planEligible
    ? `<span class="plan-badge">✓ Disponible con Maquilink (${car.planTypes || 'consultar'})</span>`
    : '';

  const capHtml = capacityLabel(car)
    ? `<span class="plan-badge capacity-badge">👨‍👩‍👧‍👦 ${capacityLabel(car)}</span>`
    : '';

  const tagsHtml = carTagsMeta(car).map(t => `<span class="plan-badge detail-tag ${t.className}">${t.icon} ${t.label}</span>`).join('');

  const similarCars = getSimilarCars(car);
  const similarHtml = similarCars.length ? `
    <div class="gallery-label">Autos similares</div>
    <div class="similar-grid">
      ${similarCars.map(s => `
        <div class="similar-card" onclick="openDetail('${s.id}')">
          <img src="${(s.images && s.images[0]) || ''}" alt="${s.brand} ${s.model}" loading="lazy" onerror="this.style.display='none'">
          <div class="similar-card-body">
            <div class="similar-card-brand">${s.brand}</div>
            <div class="similar-card-model">${s.model}</div>
            <div class="similar-card-price">Desde ${fmtPrice(s.priceFrom)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  el.detailBody.innerHTML = `
    <div class="detail-header">
      <h2>${car.brand} ${car.model}</h2>
      <p class="detail-sub">${car.category || ''} · Desde ${fmtPrice(car.priceFrom)} USD</p>
    </div>

    ${planHtml}
    ${capHtml}
    ${tagsHtml}

    <div class="gallery-label">Fotos</div>
    <div class="gallery">${images || '<p>Sin fotos cargadas aún.</p>'}</div>

    ${specHtml}

    <div class="gallery-label">Versiones, motorizaciones y precios</div>
    <div style="overflow-x:auto;">
      <table class="versions-table">
        <thead><tr><th>Versión</th><th>Año</th><th>Motor</th><th>Transmisión</th><th>Combustible</th><th>Tracción</th><th>Precio (USD)</th></tr></thead>
        <tbody>${versionsRows}</tbody>
      </table>
    </div>

    <div class="detail-actions">
      <a class="video-link" href="${youtubeSearchUrl(car)}" target="_blank" rel="noopener">▶ Ver videos en YouTube</a>
      <a class="btn-call" href="tel:+51983311727">Llamar al 983 311 727</a>
      <a class="whatsapp-link icon-link" href="${whatsappUrl(car)}" target="_blank" rel="noopener" aria-label="Enviar un mensaje a Yehison sobre este auto" title="Enviar un mensaje"><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z"/></svg></a>
      <button type="button" class="btn-secondary" id="calcFromDetailBtn">📊 Simular cuota</button>
      <button type="button" class="detail-fav-btn${state.favoriteIds.has(car.id) ? ' is-fav' : ''}" id="detailFavBtn">${state.favoriteIds.has(car.id) ? '♥ En favoritos' : '♡ Guardar en favoritos'}</button>
      ${navigator.share ? '<button type="button" class="copy-link-btn" id="shareDetailBtn">📤 Compartir</button>' : ''}
      <button type="button" class="copy-link-btn" id="copyLinkDirectBtn">🔗 Copiar enlace</button>
    </div>

    ${similarHtml}

    <p class="source-note">Catálogo referencial. Precios, modelos y versiones son solo referenciales y pueden cambiar sin previo aviso. El fondo colectivo no vende vehículos directamente: comercializa certificados de ahorro programado que permiten acceder a un vehículo. Consulta siempre con tu asesor antes de decidir.</p>
  `;

  el.detailModal.classList.remove('hidden');

  const detailFavBtn = document.getElementById('detailFavBtn');
  detailFavBtn.addEventListener('click', () => {
    const isFav = toggleFavorite(car.id);
    detailFavBtn.classList.toggle('is-fav', isFav);
    detailFavBtn.textContent = isFav ? '♥ En favoritos' : '♡ Guardar en favoritos';
  });

  const shareBtn = document.getElementById('shareDetailBtn');
  if (shareBtn) shareBtn.addEventListener('click', e => shareDetail(e.currentTarget, car));
  document.getElementById('copyLinkDirectBtn').addEventListener('click', e => copyDetailLinkDirect(e.currentTarget, car));
  document.getElementById('calcFromDetailBtn').addEventListener('click', () => goToCalculator(car));
}

function openCompareModal() {
  const cars = state.compareIds.map(id => CARS.find(c => c.id === id)).filter(Boolean);
  if (cars.length < 2) return;

  const rows = [
    { label: 'Foto', render: c => `<img src="${(c.images||[])[0]||''}" alt="${c.model}" onerror="this.style.display='none'">` },
    { label: 'Marca / Modelo', render: c => `<strong>${c.brand} ${c.model}</strong>` },
    { label: 'Tipo', render: c => c.category || '—' },
    { label: 'Desde', render: c => `<span class="price-tag">${fmtPrice(c.priceFrom)}</span>` },
    { label: 'Versiones', render: c => c.versions.map(v => `${v.trim} (${fmtPrice(v.priceFinal ?? v.priceList)})`).join('<br>') },
    { label: 'Motor(es)', render: c => [...new Set(c.versions.map(v => v.engine).filter(Boolean))].join('<br>') || '—' },
    { label: 'Transmisión', render: c => [...new Set(c.versions.map(v => v.transmission).filter(Boolean))].join(' / ') || '—' },
    { label: 'Combustible', render: c => [...new Set(c.versions.map(v => v.fuel).filter(Boolean))].join(' / ') || '—' },
    { label: 'Potencia', render: c => c.specs?.hp ? c.specs.hp + ' HP' : '—' },
    { label: 'Torque', render: c => c.specs?.torque ? c.specs.torque + ' Nm' : '—' },
    { label: 'Consumo', render: c => c.specs?.consumption ? c.specs.consumption + ' L/100km' : '—' },
    { label: 'Baúl', render: c => c.specs?.trunk ? c.specs.trunk + ' L' : '—' },
    { label: 'Airbags', render: c => c.specs?.airbags || '—' },
    { label: 'Plan Maquilink', render: c => c.planEligible ? `Sí (${c.planTypes || ''})` : 'No' },
    { label: 'Video', render: c => `<a class="video-link" href="${youtubeSearchUrl(c)}" target="_blank" rel="noopener">▶ Ver</a>` },
    { label: 'Consultar', render: c => `<a class="btn-call btn-call-sm" href="tel:+51983311727">Llámame</a> <a class="whatsapp-link icon-link" href="${whatsappUrl(c)}" target="_blank" rel="noopener" aria-label="Enviar un mensaje sobre el ${c.brand} ${c.model}" title="Enviar un mensaje"><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z"/></svg></a>` },
  ];

  const headerCells = cars.map(c => `<th>${c.brand} ${c.model}</th>`).join('');
  const bodyRows = rows.map(r => `
    <tr>
      <td class="label-col">${r.label}</td>
      ${cars.map(c => `<td>${r.render(c)}</td>`).join('')}
    </tr>
  `).join('');

  el.compareBody.innerHTML = `
    <h2>Comparación de autos</h2>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead><tr><th class="label-col"></th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
    <div class="compare-actions">
      <button type="button" class="copy-link-btn" id="compareCopyLinkBtn">🔗 Copiar enlace de esta comparación</button>
    </div>
  `;

  const hashValue = 'compare=' + state.compareIds.join(',');
  if (location.hash.slice(1) !== hashValue) {
    history.pushState('', document.title, location.pathname + location.search + '#' + hashValue);
  }

  document.getElementById('compareCopyLinkBtn').addEventListener('click', e => {
    trackEvent('copy_compare_link', { car_ids: state.compareIds.join(',') });
    copyDetailLink(e.currentTarget);
  });

  el.compareModal.classList.remove('hidden');
}

function closeModals() {
  el.detailModal.classList.add('hidden');
  el.compareModal.classList.add('hidden');
  if (location.hash) {
    history.pushState('', document.title, location.pathname + location.search);
  }
}

init();
handleHashChange();
