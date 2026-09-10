'use strict';

// Transaction shape: { id, type: 'income'|'expense', amount, category, date, description, createdAt }

const STORAGE_KEY = 'expenseTracker.transactions';

let transactions = [];
let currentTypeFilter = 'all';       // 'all' | 'income' | 'expense'
let currentCategoryFilter = 'all';
let currentSearchTerm = '';
let currentSort = 'date-desc';       // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
let selectedFormType = 'expense';    // form's active type toggle
let editingId = null;                // id of transaction being edited, or null
let pendingDeleteId = null;          // id awaiting delete confirmation
let toastCounter = 0;

// Categories offered depend on the selected transaction type
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Bonus', 'Other Income'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Rent', 'Other Expense'];

function categoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// Inline SVG glyphs per category — no external icon assets
const CATEGORY_ICONS = {
  Food: '<circle cx="12" cy="12" r="7.2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>',
  Transport: '<rect x="4" y="10" width="16" height="6" rx="2"/><line x1="4" y1="13" x2="20" y2="13"/><circle cx="8" cy="18" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="18" r="1.6" fill="currentColor" stroke="none"/>',
  Shopping: '<path d="M6 8 L18 8 L17 20 L7 20 Z"/><path d="M9 8 L9 6 L15 6 L15 8"/>',
  Bills: '<rect x="6" y="3" width="12" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
  Entertainment: '<circle cx="12" cy="12" r="8"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>',
  Health: '<circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  Education: '<polygon points="12,4 22,9 12,14 2,9"/><line x1="7" y1="11.5" x2="7" y2="17"/><path d="M7 17 L9 19 L15 19 L17 17"/>',
  Rent: '<path d="M4 11 L12 4 L20 11" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10.5V20H18V10.5"/><rect x="10" y="14" width="4" height="6"/>',
  'Other Expense': '<circle cx="7" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  Salary: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.5"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/>',
  Freelance: '<rect x="9" y="4" width="6" height="4" rx="1"/><rect x="3" y="8" width="18" height="12" rx="2"/><line x1="3" y1="13" x2="21" y2="13"/>',
  Business: '<path d="M5 9 L7 4 H17 L19 9" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="9" width="14" height="11" rx="1"/><line x1="9" y1="13" x2="9" y2="16"/><line x1="15" y1="13" x2="15" y2="16"/>',
  Investment: '<polyline points="3,17 9,11 13,15 21,6"/><polyline points="15,6 21,6 21,12"/>',
  Bonus: '<rect x="4" y="9" width="16" height="11" rx="1"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="12" y1="9" x2="12" y2="20"/><path d="M12 9c-1.6 0-3-1-3-2.6C9 5 10.4 4 12 6c0-2 1.4-3 3-1.6C15 6 13.6 9 12 9Z"/>',
  'Other Income': '<circle cx="7" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  // Fallback used only for legacy data (e.g. a category saved before this list existed).
  Other: '<circle cx="7" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="1.6" fill="currentColor" stroke="none"/>'
};

const EDIT_ICON = '<path d="M14.5 4.5 L19.5 9.5 L9 20 L4 20 L4 15 Z"/><line x1="12.5" y1="6.5" x2="17.5" y2="11.5"/>';
const DELETE_ICON = '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><rect x="6" y="7" width="12" height="13" rx="1"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>';

// Accent color per category, used in the category chart bars
const CATEGORY_COLORS = {
  Food: '#C08A45', Transport: '#5E7A94', Shopping: '#B26C7E', Bills: '#7C6E96',
  Entertainment: '#B97355', Health: '#5C8A6B', Education: '#6C7B98', Rent: '#8C7A54',
  'Other Expense': '#8C8778',
  Salary: '#4F7A52', Freelance: '#8B9A6C', Business: '#6C7B54', Investment: '#A9863F',
  Bonus: '#B28A57', 'Other Income': '#8C8778',
  // Fallback used only for legacy data.
  Other: '#8C8778'
};

const form = document.getElementById('transactionForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const typeButtons = document.querySelectorAll('.type-btn');

const amountInput = document.getElementById('amountInput');
const categoryInput = document.getElementById('categoryInput');
const dateInput = document.getElementById('dateInput');
const descriptionInput = document.getElementById('descriptionInput');

const balanceValueEl = document.getElementById('balanceValue');
const incomeValueEl = document.getElementById('incomeValue');
const expenseValueEl = document.getElementById('expenseValue');

const transactionListEl = document.getElementById('transactionList');
const transactionCountEl = document.getElementById('transactionCount');
const emptyStateEl = document.getElementById('emptyState');
const filterTabs = document.querySelectorAll('.filter-tab');
const categoryFilterEl = document.getElementById('categoryFilter');
const sortSelectEl = document.getElementById('sortSelect');
const searchInputEl = document.getElementById('searchInput');

const monthSelectEl = document.getElementById('monthSelect');
const monthIncomeEl = document.getElementById('monthIncome');
const monthExpenseEl = document.getElementById('monthExpense');
const monthBalanceEl = document.getElementById('monthBalance');
const monthlyTrendBarsEl = document.getElementById('monthlyTrendBars');

const categoryChartEl = document.getElementById('categoryChart');
const chartEmptyMsgEl = document.getElementById('chartEmptyMsg');

const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const toastContainer = document.getElementById('toastContainer');

const transactionFormSection = document.getElementById('transactionFormSection');

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Could not read saved transactions:', err);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Could not save transactions:', err);
    showToast('Could not save changes — storage may be full.', 'error');
  }
}

function generateId() {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);
  return sign + '₹' + absValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoDate) {
  const parts = isoDate.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
}

function calculateTotals(list) {
  let income = 0;
  let expense = 0;
  list.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });
  return { income, expense, balance: income - expense };
}

function updateDashboard() {
  const { income, expense, balance } = calculateTotals(transactions);
  balanceValueEl.textContent = formatCurrency(balance);
  incomeValueEl.textContent = formatCurrency(income);
  expenseValueEl.textContent = formatCurrency(expense);
}

function filterTransactions() {
  const term = currentSearchTerm.trim().toLowerCase();

  let result = transactions.filter(tx => {
    if (currentTypeFilter !== 'all' && tx.type !== currentTypeFilter) return false;
    if (currentCategoryFilter !== 'all' && tx.category !== currentCategoryFilter) return false;
    if (term) {
      const haystack = (tx.category + ' ' + tx.description).toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    switch (currentSort) {
      case 'date-asc':
        return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'date-desc':
      default:
        return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
    }
  });

  return result;
}

function renderTransactions() {
  const list = filterTransactions();

  transactionCountEl.textContent = `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`;

  if (transactions.length === 0) {
    transactionListEl.hidden = true;
    emptyStateEl.hidden = false;
    transactionListEl.innerHTML = '';
    return;
  }

  transactionListEl.hidden = false;
  emptyStateEl.hidden = true;

  if (list.length === 0) {
    transactionListEl.innerHTML = `<li class="no-results"><p style="padding:24px 6px;color:var(--text-secondary);font-size:13.5px;">No transactions match your filters.</p></li>`;
    return;
  }

  transactionListEl.innerHTML = list.map(tx => {
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '-';
    return `
      <li>
        <div class="transaction-item" data-id="${tx.id}">
          <div class="tx-icon ${isIncome ? 'is-income' : 'is-expense'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${getCategoryIcon(tx.category)}</svg>
          </div>
          <div class="tx-main">
            <div class="tx-top">
              <span class="tx-category">${escapeHtml(tx.category)}</span>
              <span class="tx-badge ${isIncome ? 'is-income' : 'is-expense'}">${isIncome ? 'Income' : 'Expense'}</span>
            </div>
            ${tx.description ? `<p class="tx-desc">${escapeHtml(tx.description)}</p>` : ''}
            <p class="tx-date">${formatDate(tx.date)}</p>
          </div>
          <div class="tx-right">
            <span class="tx-amount ${isIncome ? 'is-income' : 'is-expense'}">${sign} ${formatCurrency(tx.amount)}</span>
            <div class="tx-actions">
              <button type="button" class="tx-action-btn edit" data-action="edit" data-id="${tx.id}" aria-label="Edit transaction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EDIT_ICON}</svg>
              </button>
              <button type="button" class="tx-action-btn delete" data-action="delete" data-id="${tx.id}" aria-label="Delete transaction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DELETE_ICON}</svg>
              </button>
            </div>
          </div>
        </div>
      </li>`;
  }).join('');
}

function getMonthKey(isoDate) {
  return isoDate.slice(0, 7); // 'YYYY-MM'
}

function monthKeyLabel(key) {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function populateMonthSelect() {
  const keys = new Set(transactions.map(tx => getMonthKey(tx.date)));
  keys.add(getMonthKey(todayISO()));

  const sortedKeys = Array.from(keys).sort().reverse();
  const previousValue = monthSelectEl.value;

  monthSelectEl.innerHTML = sortedKeys.map(key =>
    `<option value="${key}">${monthKeyLabel(key)}</option>`
  ).join('');

  if (sortedKeys.includes(previousValue)) {
    monthSelectEl.value = previousValue;
  } else {
    monthSelectEl.value = getMonthKey(todayISO());
  }
}

function renderMonthlySummary() {
  const selectedMonth = monthSelectEl.value || getMonthKey(todayISO());
  const monthTransactions = transactions.filter(tx => getMonthKey(tx.date) === selectedMonth);
  const { income, expense, balance } = calculateTotals(monthTransactions);

  monthIncomeEl.textContent = formatCurrency(income);
  monthExpenseEl.textContent = formatCurrency(expense);
  monthBalanceEl.textContent = formatCurrency(balance);
}

// Buckets the selected month's expenses into weeks for the trend bars
function renderMonthlyTrend() {
  const selectedMonth = monthSelectEl.value || getMonthKey(todayISO());
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7);

  const monthExpenses = transactions.filter(
    tx => tx.type === 'expense' && getMonthKey(tx.date) === selectedMonth
  );

  if (monthExpenses.length === 0) {
    monthlyTrendBarsEl.innerHTML = `<p class="monthly-trend-empty">No spending recorded this month.</p>`;
    return;
  }

  const weekTotals = new Array(weekCount).fill(0);
  monthExpenses.forEach(tx => {
    const day = Number(tx.date.slice(8, 10));
    const weekIndex = Math.min(Math.floor((day - 1) / 7), weekCount - 1);
    weekTotals[weekIndex] += tx.amount;
  });

  const maxTotal = Math.max(...weekTotals);

  monthlyTrendBarsEl.innerHTML = weekTotals.map((total, i) => {
    const pct = maxTotal > 0 && total > 0 ? Math.max((total / maxTotal) * 100, 6) : 0;
    return `
      <div class="trend-bar-col" title="Week ${i + 1}: ${formatCurrency(total)}">
        <div class="trend-bar" style="height:${pct}%"></div>
        <span class="trend-bar-label">W${i + 1}</span>
      </div>`;
  }).join('');
}

function renderCategoryChart() {
  const totals = {};
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    chartEmptyMsgEl.hidden = false;
    categoryChartEl.querySelectorAll('.chart-row').forEach(row => row.remove());
    return;
  }

  chartEmptyMsgEl.hidden = true;
  const maxValue = entries[0][1];

  const rowsHtml = entries.map(([category, amount]) => {
    const pct = maxValue > 0 ? Math.max((amount / maxValue) * 100, 4) : 0;
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
    return `
      <div class="chart-row">
        <span class="chart-row-label">${escapeHtml(category)}</span>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%; background:${color};"></div></div>
        <span class="chart-row-value">${formatCurrency(amount)}</span>
      </div>`;
  }).join('');

  categoryChartEl.querySelectorAll('.chart-row').forEach(row => row.remove());
  categoryChartEl.insertAdjacentHTML('beforeend', rowsHtml);
}

function refreshAll() {
  updateDashboard();
  renderTransactions();
  populateMonthSelect();
  renderMonthlySummary();
  renderMonthlyTrend();
  renderCategoryChart();
}

function clearFieldErrors() {
  document.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
}

function setFieldError(inputEl, message) {
  const group = inputEl.closest('.form-group');
  if (!group) return;
  group.classList.add('has-error');
  const errorEl = group.querySelector('.field-error');
  if (errorEl) errorEl.textContent = message;
}

function validateForm() {
  clearFieldErrors();
  let isValid = true;

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    setFieldError(amountInput, 'Please enter a valid amount greater than 0.');
    isValid = false;
  }

  if (!categoryInput.value) {
    setFieldError(categoryInput, 'Please select a category.');
    isValid = false;
  } else if (!categoriesForType(selectedFormType).includes(categoryInput.value)) {
    // Guards against a stale selection left over from switching Income/Expense.
    setFieldError(categoryInput, `Please select a category valid for ${selectedFormType === 'income' ? 'Income' : 'Expense'}.`);
    isValid = false;
  }

  if (!dateInput.value) {
    setFieldError(dateInput, 'Please select a date.');
    isValid = false;
  }

  if (descriptionInput.value.trim().length === 0) {
    setFieldError(descriptionInput, 'Please enter a description.');
    isValid = false;
  }

  return isValid;
}

function addTransaction(data) {
  const transaction = {
    id: generateId(),
    type: data.type,
    amount: data.amount,
    category: data.category,
    date: data.date,
    description: data.description,
    createdAt: Date.now()
  };
  transactions.push(transaction);
  saveTransactions();
}

function updateTransaction(id, data) {
  const index = transactions.findIndex(tx => tx.id === id);
  if (index === -1) return;
  transactions[index] = { ...transactions[index], ...data };
  saveTransactions();
}

function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions();
}

function populateCategoryOptions(type) {
  const categories = categoriesForType(type);
  const optionsHtml = ['<option value="" disabled selected>Select category</option>']
    .concat(categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`));
  categoryInput.innerHTML = optionsHtml.join('');
}

function setFormType(type) {
  selectedFormType = type;
  typeButtons.forEach(btn => {
    const isActive = btn.dataset.type === type;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  // Rebuild category options and reset selection when type changes
  populateCategoryOptions(type);
}

function resetForm() {
  form.reset();
  clearFieldErrors();
  editingId = null;
  setFormType('expense');
  dateInput.value = todayISO();
  formTitle.textContent = 'Add Transaction';
  submitBtn.textContent = 'Add Transaction';
  cancelEditBtn.hidden = true;
}

function openEditMode(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId = id;
  setFormType(tx.type);
  amountInput.value = tx.amount;
  categoryInput.value = tx.category;
  dateInput.value = tx.date;
  descriptionInput.value = tx.description;

  formTitle.textContent = 'Edit Transaction';
  submitBtn.textContent = 'Update Transaction';
  cancelEditBtn.hidden = false;
  clearFieldErrors();

  scrollToForm();
  amountInput.focus();
}

function scrollToForm() {
  transactionFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.hidden = false;
  confirmDeleteBtn.focus();
  document.addEventListener('keydown', handleModalKeydown);
}

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.hidden = true;
  document.removeEventListener('keydown', handleModalKeydown);
}

function handleModalKeydown(e) {
  if (e.key === 'Escape') closeDeleteModal();
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  const wasEditingDeletedItem = editingId === pendingDeleteId;
  deleteTransaction(pendingDeleteId);
  closeDeleteModal();
  if (wasEditingDeletedItem) resetForm();
  refreshAll();
  showToast('Transaction deleted successfully', 'success');
}

function showToast(message, type = 'success') {
  toastCounter += 1;
  const id = 'toast_' + toastCounter;
  const icon = type === 'success'
    ? '<path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    : '<path d="M12 8v5M12 16h0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>';

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.id = id;
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `<svg class="toast-icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${escapeHtml(message)}</span>`;

  toastContainer.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.add('leaving');
    setTimeout(() => toastEl.remove(), 200);
  }, 3200);
}

typeButtons.forEach(btn => {
  btn.addEventListener('click', () => setFormType(btn.dataset.type));
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const data = {
    type: selectedFormType,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim()
  };

  if (editingId) {
    updateTransaction(editingId, data);
    showToast('Transaction updated successfully', 'success');
  } else {
    addTransaction(data);
    showToast('Transaction added successfully', 'success');
  }

  resetForm();
  refreshAll();
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    currentTypeFilter = tab.dataset.filter;
    filterTabs.forEach(t => {
      const isActive = t === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-pressed', String(isActive));
    });
    renderTransactions();
  });
});

categoryFilterEl.addEventListener('change', () => {
  currentCategoryFilter = categoryFilterEl.value;
  renderTransactions();
});

sortSelectEl.addEventListener('change', () => {
  currentSort = sortSelectEl.value;
  renderTransactions();
});

searchInputEl.addEventListener('input', () => {
  currentSearchTerm = searchInputEl.value;
  renderTransactions();
});

transactionListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit') openEditMode(id);
  if (btn.dataset.action === 'delete') openDeleteModal(id);
});

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', confirmDelete);
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

monthSelectEl.addEventListener('change', () => {
  renderMonthlySummary();
  renderMonthlyTrend();
});

function populateCategoryFilterOptions() {
  const buildGroup = (label, categories) =>
    `<optgroup label="${escapeHtml(label)}">` +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('') +
    `</optgroup>`;

  categoryFilterEl.insertAdjacentHTML(
    'beforeend',
    buildGroup('Income', INCOME_CATEGORIES) + buildGroup('Expense', EXPENSE_CATEGORIES)
  );
}

function init() {
  transactions = loadTransactions();
  dateInput.value = todayISO();
  populateCategoryFilterOptions();
  setFormType('expense');
  refreshAll();
}

init();
