(function(){
  const form = document.getElementById('calc-form');
  const resetBtn = document.getElementById('reset-btn');
  const resultsCard = document.getElementById('results-card');
  const grossEl = document.getElementById('gross');
  const fedEl = document.getElementById('fed');
  const stateEl = document.getElementById('state');
  const k401El = document.getElementById('k401_out');
  const netEl = document.getElementById('net');
  const modeNote = document.getElementById('mode-note');
  const apiUrl = (window.__APP_CONFIG__ || {}).api || "/api/calc";

  // Online/Offline badges
  const onlineBadge = document.getElementById('online-badge');
  const offlineBadge = document.getElementById('offline-badge');
  function updateNetStatus(){
    const online = navigator.onLine;
    onlineBadge.hidden = !online;
    offlineBadge.hidden = online;
  }
  window.addEventListener('online', updateNetStatus);
  window.addEventListener('offline', updateNetStatus);
  updateNetStatus();

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Pure function mirrored with Python
  function computeLocal(data){
    const salary = parseFloat(data.salary || 0);
    const frequency = data.frequency || 'annual';
    const federal_dependents = parseInt(data.federal_dependents || 0, 10);
    const state_dependents = parseInt(data.state_dependents || 0, 10);
    const k401 = parseFloat(data.k401 || 0) / 100;

    if (salary < 0 || k401 < 0 || k401 > 1 || Number.isNaN(salary)) {
      throw new Error("Invalid inputs.");
    }

    const k401_contrib = salary * k401;
    const taxable_income = Math.max(salary - k401_contrib, 0);

    const federal_tax = Math.max(taxable_income * 0.10 - (federal_dependents * 500), 0);
    const state_tax = Math.max(taxable_income * 0.05 - (state_dependents * 300), 0);
    const net_annual_income = taxable_income - federal_tax - state_tax;

    let gross_income, net_income;
    if (frequency === 'monthly'){
      gross_income = round2(salary / 12);
      net_income = round2(net_annual_income / 12);
    } else if (frequency === 'biweekly'){
      gross_income = round2(salary / 26);
      net_income = round2(net_annual_income / 26);
    } else {
      gross_income = round2(salary);
      net_income = round2(net_annual_income);
    }

    return {
      frequency,
      gross_income,
      federal_tax: round2(federal_tax),
      state_tax: round2(state_tax),
      k401_contrib: round2(k401_contrib),
      net_income
    };
  }

  function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100 }

  function renderResults(r, mode){
    grossEl.textContent = `$${r.gross_income.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    fedEl.textContent = `$${r.federal_tax.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    stateEl.textContent = `$${r.state_tax.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    k401El.textContent = `$${r.k401_contrib.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    netEl.textContent = `$${r.net_income.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    resultsCard.hidden = false;
    modeNote.textContent = mode === 'offline'
      ? 'Calculated offline (local estimate).'
      : 'Calculated on server.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Try server first
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Calculation failed');
      renderResults(json.results, 'online');
    } catch (err) {
      // Fallback to local compute when offline or server fails
      try {
        const local = computeLocal(data);
        renderResults(local, 'offline');
      } catch (inner) {
        alert(inner.message || 'Invalid input.');
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    resultsCard.hidden = true;
    modeNote.textContent = '';
  });
})();
