(function () {
  'use strict';

  var STORAGE_KEY = 'matchaBlossomBudget';
  var CURRENCY_KEY = 'matchaBlossomCurrency';
  var CUSTOM_CAT_KEY = 'matchaBlossomCustomCategories';
  var CATEGORY_BUDGETS_KEY = 'matchaBlossomCategoryBudgets';
  var PAID_BILLS_KEY = 'matchaBlossomPaidBills';
  var BUDGET_COLLAPSED_KEY = 'matchaBlossomBudgetCollapsed';

  var CATEGORIES = {
    expense: [
      { id: 'food', name: 'Food', icon: '🍜' },
      { id: 'groceries', name: 'Groceries', icon: '🛒' },
      { id: 'transport', name: 'Transport', icon: '🚗' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️' },
      { id: 'bills', name: 'Bills', icon: '💡' },
      { id: 'entertainment', name: 'Fun', icon: '🎬' },
      { id: 'health', name: 'Health', icon: '💊' },
      { id: 'beauty', name: 'Beauty', icon: '💅' },
      { id: 'home', name: 'Home', icon: '🏠' },
      { id: 'education', name: 'School', icon: '📚' },
      { id: 'travel', name: 'Travel', icon: '✈️' },
      { id: 'pets', name: 'Pets', icon: '🐾' },
      { id: 'gifts', name: 'Gifts', icon: '🎁' },
      { id: 'other-exp', name: 'Other', icon: '✨' }
    ],
    income: [
      { id: 'salary', name: 'Salary', icon: '💰' },
      { id: 'freelance', name: 'Freelance', icon: '💻' },
      { id: 'allowance', name: 'Allowance', icon: '🌸' },
      { id: 'gift-in', name: 'Gift', icon: '🎁' },
      { id: 'investment', name: 'Invest', icon: '📈' },
      { id: 'bonus', name: 'Bonus', icon: '🎉' },
      { id: 'refund', name: 'Refund', icon: '↩️' },
      { id: 'other-inc', name: 'Other', icon: '✨' }
    ]
  };

  var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var EMOJI_CHOICES = [
    '🍜','🍔','🍕','🌮','🍣','🍰','🍩','🧁','☕','🧋','🍺','🍷',
    '🛒','🛍️','👗','👟','💄','💅','💇',
    '🚗','🚕','🚌','🚆','✈️','⛽','🅿️',
    '💡','🔌','📱','💻','🖥️','🎮','🎧','📷',
    '🎬','🎨','🎯','📚','✏️','🏫',
    '🏠','🛋️','🛏️','🧹','🧺','🔧',
    '💊','🏥','🩺','🧘','🚴',
    '🐾','🐶','🐱','🐹',
    '🎁','🎉','🎈','🎂',
    '💰','💳','🏦','📈','📉','🧾',
    '✨','🌸','🍵','🌱','🧧','💐','🕯️',
    '👶','🧸'
  ];

  // ---------- State ----------
  var state = {
    transactions: loadTransactions(),
    currency: localStorage.getItem(CURRENCY_KEY) || '₱',
    customCategories: loadCustomCategories(),
    categoryBudgets: loadCategoryBudgets(),
    paidBills: loadPaidBills(),
    editingBudgetCatId: null,
    editingCategoryId: null,
    budgetCollapsed: localStorage.getItem(BUDGET_COLLAPSED_KEY) === 'true',
    today: new Date(),
    viewMonth: new Date().getMonth(),
    viewYear: new Date().getFullYear(),
    annualYear: new Date().getFullYear(),
    editingId: null,
    modalType: 'expense',
    selectedCategory: null
  };

  function loadTransactions() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }

  function loadCustomCategories() {
    try {
      var raw = localStorage.getItem(CUSTOM_CAT_KEY);
      return raw ? JSON.parse(raw) : { expense: [], income: [] };
    } catch (e) {
      return { expense: [], income: [] };
    }
  }

  function saveCustomCategories() {
    localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(state.customCategories));
  }

  function getCategories(type) {
    return CATEGORIES[type].concat(state.customCategories[type]);
  }

  function loadCategoryBudgets() {
    try {
      var raw = localStorage.getItem(CATEGORY_BUDGETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCategoryBudgets() {
    localStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(state.categoryBudgets));
  }

  function loadPaidBills() {
    try {
      var raw = localStorage.getItem(PAID_BILLS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function savePaidBills() {
    localStorage.setItem(PAID_BILLS_KEY, JSON.stringify(state.paidBills));
  }

  function monthKey(year, month) {
    return year + '-' + pad(month + 1);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatMoney(amount) {
    var sign = amount < 0 ? '-' : '';
    var abs = Math.abs(amount);
    return sign + state.currency + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function findCategory(id) {
    var all = CATEGORIES.expense.concat(CATEGORIES.income, state.customCategories.expense, state.customCategories.income);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return { id: id, name: 'Other', icon: '✨' };
  }

  // ---------- DOM refs ----------
  var el = {
    totalBalance: document.getElementById('totalBalance'),
    balanceAsOf: document.getElementById('balanceAsOf'),
    monthLabel: document.getElementById('monthLabel'),
    monthIncome: document.getElementById('monthIncome'),
    monthExpense: document.getElementById('monthExpense'),
    monthBalance: document.getElementById('monthBalance'),
    budgetBarFill: document.getElementById('budgetBarFill'),
    budgetSpentLabel: document.getElementById('budgetSpentLabel'),
    budgetTargetLabel: document.getElementById('budgetTargetLabel'),
    budgetItems: document.getElementById('budgetItems'),
    budgetCollapseBtn: document.getElementById('budgetCollapseBtn'),
    budgetChevron: document.getElementById('budgetChevron'),
    addBudgetCatBtn: document.getElementById('addBudgetCatBtn'),
    budgetCatOverlay: document.getElementById('budgetCatOverlay'),
    budgetCatTitle: document.getElementById('budgetCatTitle'),
    closeBudgetCat: document.getElementById('closeBudgetCat'),
    budgetCatSelect: document.getElementById('budgetCatSelect'),
    budgetCatAmount: document.getElementById('budgetCatAmount'),
    saveBudgetCat: document.getElementById('saveBudgetCat'),
    deleteBudgetCat: document.getElementById('deleteBudgetCat'),
    transactionsList: document.getElementById('transactionsList'),
    emptyState: document.getElementById('emptyState'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    resetMonthBtn: document.getElementById('resetMonthBtn'),
    yearLabel: document.getElementById('yearLabel'),
    yearIncome: document.getElementById('yearIncome'),
    yearExpense: document.getElementById('yearExpense'),
    yearBalance: document.getElementById('yearBalance'),
    monthsGrid: document.getElementById('monthsGrid'),
    prevYear: document.getElementById('prevYear'),
    nextYear: document.getElementById('nextYear'),
    navBtns: document.querySelectorAll('.nav-btn'),
    addBtn: document.getElementById('addBtn'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    typeBtns: document.querySelectorAll('.type-btn'),
    categoryGrid: document.getElementById('categoryGrid'),
    addCategoryForm: document.getElementById('addCategoryForm'),
    emojiPickerBtn: document.getElementById('emojiPickerBtn'),
    emojiGrid: document.getElementById('emojiGrid'),
    newCatName: document.getElementById('newCatName'),
    cancelAddCat: document.getElementById('cancelAddCat'),
    deleteCatFromForm: document.getElementById('deleteCatFromForm'),
    confirmAddCat: document.getElementById('confirmAddCat'),
    amountInput: document.getElementById('amountInput'),
    dateInput: document.getElementById('dateInput'),
    noteInput: document.getElementById('noteInput'),
    saveBtn: document.getElementById('saveBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    closeSettings: document.getElementById('closeSettings'),
    currencySelect: document.getElementById('currencySelect'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    statementBtn: document.getElementById('statementBtn'),
    statementOverlay: document.getElementById('statementOverlay'),
    closeStatement: document.getElementById('closeStatement'),
    stmtStepFile: document.getElementById('stmtStepFile'),
    stmtStepReview: document.getElementById('stmtStepReview'),
    stmtChooseBtn: document.getElementById('stmtChooseBtn'),
    stmtFileInput: document.getElementById('stmtFileInput'),
    stmtLoading: document.getElementById('stmtLoading'),
    stmtError: document.getElementById('stmtError'),
    stmtSummary: document.getElementById('stmtSummary'),
    stmtSelectAll: document.getElementById('stmtSelectAll'),
    stmtRows: document.getElementById('stmtRows'),
    stmtBackBtn: document.getElementById('stmtBackBtn'),
    stmtImportBtn: document.getElementById('stmtImportBtn'),
    clearBtn: document.getElementById('clearBtn')
  };

  // ---------- Rendering ----------
  function renderAll() {
    renderMonthView();
    renderAnnualView();
  }

  function renderTotalBalance(income, expense) {
    el.totalBalance.textContent = formatMoney(income - expense);
    el.balanceAsOf.textContent = 'for ' + MONTH_NAMES[state.viewMonth] + ' ' + state.viewYear;
  }

  function txForMonth(year, month) {
    return state.transactions.filter(function (t) {
      var d = t.date.split('-');
      return parseInt(d[0], 10) === year && parseInt(d[1], 10) - 1 === month;
    });
  }

  function renderMonthView() {
    el.monthLabel.textContent = MONTH_NAMES[state.viewMonth] + ' ' + state.viewYear;
    var monthTx = txForMonth(state.viewYear, state.viewMonth);

    var income = 0, expense = 0;
    monthTx.forEach(function (t) {
      if (t.type === 'income') income += t.amount; else expense += t.amount;
    });
    el.monthIncome.textContent = formatMoney(income);
    el.monthExpense.textContent = formatMoney(expense);
    el.monthBalance.textContent = formatMoney(income - expense);
    renderTotalBalance(income, expense);
    renderBudgetCard(monthTx);

    // group by date, newest first
    var byDate = {};
    monthTx.forEach(function (t) {
      (byDate[t.date] = byDate[t.date] || []).push(t);
    });
    var dates = Object.keys(byDate).sort().reverse();

    el.transactionsList.innerHTML = '';
    if (dates.length === 0) {
      el.emptyState.classList.add('show');
    } else {
      el.emptyState.classList.remove('show');
      dates.forEach(function (date) {
        var items = byDate[date].sort(function (a, b) { return b.createdAt - a.createdAt; });
        var subtotal = 0;
        items.forEach(function (t) { subtotal += (t.type === 'income' ? t.amount : -t.amount); });

        var group = document.createElement('div');
        group.className = 'date-group';

        var header = document.createElement('div');
        header.className = 'date-group-header';
        header.innerHTML =
          '<span class="date-title">' + formatDateLabel(date) + '</span>' +
          '<span class="date-subtotal">' + formatMoney(subtotal) + '</span>';
        group.appendChild(header);

        items.forEach(function (t) {
          group.appendChild(renderTransactionItem(t));
        });

        el.transactionsList.appendChild(group);
      });
    }
  }

  function renderBudgetCard(monthTx) {
    var mKey = monthKey(state.viewYear, state.viewMonth);
    var paidForMonth = state.paidBills[mKey] || {};

    var totalSpent = 0, totalTarget = 0;
    var rows = state.categoryBudgets.map(function (b) {
      var spent = 0;
      monthTx.forEach(function (t) {
        if (t.type === 'expense' && t.category === b.id) spent += t.amount;
      });
      totalSpent += spent;
      totalTarget += b.target;
      return { budget: b, spent: spent, paid: !!paidForMonth[b.id] };
    });

    if (totalTarget <= 0) {
      el.budgetBarFill.style.width = '0%';
      el.budgetBarFill.className = 'budget-bar-fill';
      el.budgetSpentLabel.textContent = 'No budget categories yet';
      el.budgetTargetLabel.textContent = 'tap + Add to start 🎯';
    } else {
      var pct = Math.min((totalSpent / totalTarget) * 100, 100);
      var cls = 'budget-bar-fill';
      if (totalSpent > totalTarget) cls += ' over';
      else if (totalSpent >= totalTarget * 0.8) cls += ' warn';
      el.budgetBarFill.className = cls;
      el.budgetBarFill.style.width = pct + '%';
      el.budgetSpentLabel.textContent = formatMoney(totalSpent) + ' spent';
      el.budgetTargetLabel.textContent = 'of ' + formatMoney(totalTarget) +
        (totalSpent > totalTarget ? ' (over by ' + formatMoney(totalSpent - totalTarget) + ')' : '');
    }

    el.budgetItems.hidden = state.budgetCollapsed;
    el.budgetChevron.classList.toggle('collapsed', state.budgetCollapsed);

    el.budgetItems.innerHTML = '';
    if (rows.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'budget-empty';
      empty.textContent = '🧾 No budget categories yet. Tap + Add to track a bill or spending goal.';
      el.budgetItems.appendChild(empty);
      return;
    }

    rows.forEach(function (row) {
      var cat = findCategory(row.budget.id);
      var item = document.createElement('div');
      item.className = 'budget-item' + (row.paid ? ' paid' : '');

      var label = document.createElement('label');
      label.className = 'budget-checkbox';
      label.innerHTML = '<input type="checkbox" ' + (row.paid ? 'checked' : '') + '><span class="checkmark"></span>';
      label.querySelector('input').addEventListener('change', function () {
        togglePaid(row.budget.id);
      });
      item.appendChild(label);

      var info = document.createElement('div');
      info.className = 'budget-item-info';
      info.innerHTML =
        '<span class="budget-item-name">' + cat.icon + ' ' + cat.name + '</span>' +
        '<span class="budget-item-amounts">' + formatMoney(row.spent) + ' of ' + formatMoney(row.budget.target) + '</span>';
      info.addEventListener('click', function () { openBudgetCatModal(row.budget.id); });
      item.appendChild(info);

      var del = document.createElement('button');
      del.className = 'budget-item-del';
      del.textContent = '✕';
      del.addEventListener('click', function () { deleteBudgetCat(row.budget.id); });
      item.appendChild(del);

      el.budgetItems.appendChild(item);
    });
  }

  function togglePaid(categoryId) {
    var mKey = monthKey(state.viewYear, state.viewMonth);
    state.paidBills[mKey] = state.paidBills[mKey] || {};
    state.paidBills[mKey][categoryId] = !state.paidBills[mKey][categoryId];
    savePaidBills();
    renderMonthView();
  }

  function deleteBudgetCat(categoryId) {
    if (!confirm('Remove this budget category?')) return;
    state.categoryBudgets = state.categoryBudgets.filter(function (b) { return b.id !== categoryId; });
    saveCategoryBudgets();
    renderMonthView();
  }

  function populateBudgetCatSelect() {
    el.budgetCatSelect.innerHTML = getCategories('expense').map(function (c) {
      return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
    }).join('');
  }

  function openBudgetCatModal(categoryId) {
    populateBudgetCatSelect();
    state.editingBudgetCatId = categoryId || null;
    if (categoryId) {
      var existing = state.categoryBudgets.find(function (b) { return b.id === categoryId; });
      el.budgetCatTitle.textContent = 'Edit Budget Category';
      el.budgetCatSelect.value = categoryId;
      el.budgetCatAmount.value = existing ? existing.target : '';
      el.deleteBudgetCat.hidden = false;
    } else {
      el.budgetCatTitle.textContent = 'Add Budget Category';
      el.budgetCatAmount.value = '';
      el.deleteBudgetCat.hidden = true;
    }
    el.budgetCatOverlay.classList.add('show');
  }

  function closeBudgetCatModal() {
    el.budgetCatOverlay.classList.remove('show');
    state.editingBudgetCatId = null;
  }

  el.budgetCollapseBtn.addEventListener('click', function () {
    state.budgetCollapsed = !state.budgetCollapsed;
    localStorage.setItem(BUDGET_COLLAPSED_KEY, state.budgetCollapsed);
    el.budgetItems.hidden = state.budgetCollapsed;
    el.budgetChevron.classList.toggle('collapsed', state.budgetCollapsed);
  });
  el.addBudgetCatBtn.addEventListener('click', function () { openBudgetCatModal(null); });
  el.closeBudgetCat.addEventListener('click', closeBudgetCatModal);
  el.budgetCatOverlay.addEventListener('click', function (e) {
    if (e.target === el.budgetCatOverlay) closeBudgetCatModal();
  });
  el.deleteBudgetCat.addEventListener('click', function () {
    if (state.editingBudgetCatId) deleteBudgetCat(state.editingBudgetCatId);
    closeBudgetCatModal();
  });
  el.saveBudgetCat.addEventListener('click', function () {
    var categoryId = el.budgetCatSelect.value;
    var target = parseFloat(el.budgetCatAmount.value);
    if (!categoryId || !target || target <= 0) {
      el.budgetCatAmount.focus();
      return;
    }
    var existing = state.categoryBudgets.find(function (b) { return b.id === categoryId; });
    if (existing) existing.target = target;
    else state.categoryBudgets.push({ id: categoryId, target: target });
    saveCategoryBudgets();
    closeBudgetCatModal();
    renderMonthView();
  });

  function formatDateLabel(iso) {
    var parts = iso.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    var weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    return weekday + ', ' + MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
  }

  function renderTransactionItem(t) {
    var cat = findCategory(t.category);
    var row = document.createElement('div');
    row.className = 'transaction-item ' + t.type;
    row.innerHTML =
      '<span class="t-icon">' + cat.icon + '</span>' +
      '<span class="t-info">' +
        '<div class="t-category">' + cat.name + '</div>' +
        (t.note ? '<div class="t-note">' + escapeHtml(t.note) + '</div>' : '') +
      '</span>' +
      '<span class="t-amount">' + (t.type === 'income' ? '+' : '-') + formatMoney(t.amount) + '</span>';
    row.addEventListener('click', function () { openModal(t); });
    return row;
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderAnnualView() {
    el.yearLabel.textContent = state.annualYear;
    var yearIncome = 0, yearExpense = 0;
    var monthTotals = [];

    for (var m = 0; m < 12; m++) {
      var tx = txForMonth(state.annualYear, m);
      var inc = 0, exp = 0;
      tx.forEach(function (t) { if (t.type === 'income') inc += t.amount; else exp += t.amount; });
      yearIncome += inc;
      yearExpense += exp;
      monthTotals.push({ month: m, income: inc, expense: exp });
    }

    el.yearIncome.textContent = formatMoney(yearIncome);
    el.yearExpense.textContent = formatMoney(yearExpense);
    el.yearBalance.textContent = formatMoney(yearIncome - yearExpense);

    var maxVal = 1;
    monthTotals.forEach(function (mt) { maxVal = Math.max(maxVal, mt.income, mt.expense); });

    el.monthsGrid.innerHTML = '';
    monthTotals.forEach(function (mt) {
      var net = mt.income - mt.expense;
      var incPct = (mt.income / maxVal) * 100;
      var expPct = (mt.expense / maxVal) * 100;

      var card = document.createElement('div');
      card.className = 'month-card';
      card.innerHTML =
        '<div class="month-card-top">' +
          '<span class="month-card-name">' + MONTH_NAMES[mt.month] + '</span>' +
          '<span class="month-card-net ' + (net >= 0 ? 'pos' : 'neg') + '">' + formatMoney(net) + '</span>' +
        '</div>' +
        '<div class="bar-track"><div class="bar-income" style="width:' + incPct + '%"></div></div>' +
        '<div class="bar-track" style="margin-top:4px"><div class="bar-expense" style="width:' + expPct + '%"></div></div>' +
        '<div class="month-card-legend">' +
          '<span>🌱 ' + formatMoney(mt.income) + '</span>' +
          '<span>🌸 ' + formatMoney(mt.expense) + '</span>' +
        '</div>';
      card.addEventListener('click', function (month) {
        return function () {
          state.viewYear = state.annualYear;
          state.viewMonth = month;
          switchView('homeView');
          renderMonthView();
        };
      }(mt.month));
      el.monthsGrid.appendChild(card);
    });
  }

  // ---------- Navigation ----------
  function switchView(viewId) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.getElementById(viewId).classList.add('active');
    el.navBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === viewId);
    });
  }

  el.navBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { switchView(btn.dataset.view); });
  });

  el.prevMonth.addEventListener('click', function () {
    state.viewMonth--;
    if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
    renderMonthView();
  });
  el.nextMonth.addEventListener('click', function () {
    state.viewMonth++;
    if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
    renderMonthView();
  });
  el.resetMonthBtn.addEventListener('click', function () {
    var label = MONTH_NAMES[state.viewMonth] + ' ' + state.viewYear;
    if (!confirm('Erase all transactions for ' + label + '? This cannot be undone.')) return;
    var year = state.viewYear, month = state.viewMonth;
    state.transactions = state.transactions.filter(function (t) {
      var d = t.date.split('-');
      return !(parseInt(d[0], 10) === year && parseInt(d[1], 10) - 1 === month);
    });
    saveTransactions();
    renderAll();
  });
  el.prevYear.addEventListener('click', function () { state.annualYear--; renderAnnualView(); });
  el.nextYear.addEventListener('click', function () { state.annualYear++; renderAnnualView(); });

  // ---------- Modal ----------
  function openModal(tx) {
    state.editingId = tx ? tx.id : null;
    state.modalType = tx ? tx.type : 'expense';
    state.selectedCategory = tx ? tx.category : null;

    el.modalTitle.textContent = tx ? 'Edit Transaction' : 'Add Transaction';
    el.deleteBtn.hidden = !tx;
    el.amountInput.value = tx ? tx.amount : '';
    el.dateInput.value = tx ? tx.date : todayISO();
    el.noteInput.value = tx ? (tx.note || '') : '';

    setModalType(state.modalType);
    el.modalOverlay.classList.add('show');
  }

  function closeModalFn() {
    el.modalOverlay.classList.remove('show');
    state.editingId = null;
  }

  el.addBtn.addEventListener('click', function () { openModal(null); });
  el.closeModal.addEventListener('click', closeModalFn);
  el.modalOverlay.addEventListener('click', function (e) {
    if (e.target === el.modalOverlay) closeModalFn();
  });

  function setModalType(type) {
    state.modalType = type;
    el.typeBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.type === type); });
    toggleAddCategoryForm(false);
    renderCategoryGrid(type);
  }

  el.typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.selectedCategory = null;
      setModalType(btn.dataset.type);
    });
  });

  function renderCategoryGrid(type) {
    el.categoryGrid.innerHTML = '';
    var cats = getCategories(type);
    var customIds = state.customCategories[type].map(function (c) { return c.id; });
    var hasSelected = cats.some(function (c) { return c.id === state.selectedCategory; });
    if (!hasSelected) state.selectedCategory = cats[0].id;

    cats.forEach(function (c) {
      var isCustom = customIds.indexOf(c.id) !== -1;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-btn' + (c.id === state.selectedCategory ? ' active' : '');
      btn.innerHTML = '<span class="cat-icon">' + c.icon + '</span><span>' + c.name + '</span>';
      btn.addEventListener('click', function () {
        state.selectedCategory = c.id;
        renderCategoryGrid(type);
      });
      if (isCustom) {
        var editBadge = document.createElement('span');
        editBadge.className = 'cat-edit';
        editBadge.textContent = '✎';
        editBadge.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleAddCategoryForm(true, c);
        });
        btn.appendChild(editBadge);
      }
      el.categoryGrid.appendChild(btn);
    });

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'category-btn add-tile';
    addBtn.innerHTML = '<span class="cat-icon">➕</span><span>Add</span>';
    addBtn.addEventListener('click', function () { toggleAddCategoryForm(true); });
    el.categoryGrid.appendChild(addBtn);
  }

  function renderEmojiGrid() {
    el.emojiGrid.innerHTML = EMOJI_CHOICES.map(function (e) {
      return '<button type="button">' + e + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.emojiGrid.querySelectorAll('button'), function (btn) {
      btn.addEventListener('click', function () {
        el.emojiPickerBtn.textContent = btn.textContent;
        el.emojiGrid.hidden = true;
      });
    });
  }

  el.emojiPickerBtn.addEventListener('click', function () {
    el.emojiGrid.hidden = !el.emojiGrid.hidden;
  });

  function toggleAddCategoryForm(show, editCat) {
    el.addCategoryForm.hidden = !show;
    el.emojiGrid.hidden = true;
    if (show) {
      renderEmojiGrid();
      state.editingCategoryId = editCat ? editCat.id : null;
      el.emojiPickerBtn.textContent = editCat ? editCat.icon : '🍩';
      el.newCatName.value = editCat ? editCat.name : '';
      el.deleteCatFromForm.hidden = !editCat;
      el.confirmAddCat.textContent = editCat ? 'Save Changes' : 'Add Category';
      el.newCatName.focus();
    } else {
      state.editingCategoryId = null;
    }
  }

  function deleteCustomCategory(type, id) {
    if (!confirm('Delete this category?')) return;
    state.customCategories[type] = state.customCategories[type].filter(function (c) { return c.id !== id; });
    saveCustomCategories();
    if (state.selectedCategory === id) state.selectedCategory = null;
    renderCategoryGrid(type);
  }

  el.cancelAddCat.addEventListener('click', function () { toggleAddCategoryForm(false); });
  el.deleteCatFromForm.addEventListener('click', function () {
    if (state.editingCategoryId) deleteCustomCategory(state.modalType, state.editingCategoryId);
    toggleAddCategoryForm(false);
  });
  el.confirmAddCat.addEventListener('click', function () {
    var name = el.newCatName.value.trim();
    if (!name) {
      el.newCatName.focus();
      return;
    }
    var icon = el.emojiPickerBtn.textContent.trim() || '✨';

    if (state.editingCategoryId) {
      var existing = state.customCategories[state.modalType].find(function (c) { return c.id === state.editingCategoryId; });
      if (existing) { existing.name = name; existing.icon = icon; }
      saveCustomCategories();
      toggleAddCategoryForm(false);
      renderCategoryGrid(state.modalType);
      return;
    }

    var id = 'custom-' + uid();
    state.customCategories[state.modalType].push({ id: id, name: name, icon: icon });
    saveCustomCategories();
    state.selectedCategory = id;
    toggleAddCategoryForm(false);
    renderCategoryGrid(state.modalType);
  });

  el.saveBtn.addEventListener('click', function () {
    var amount = parseFloat(el.amountInput.value);
    if (!amount || amount <= 0) {
      el.amountInput.focus();
      el.amountInput.style.borderColor = '#d8477a';
      return;
    }
    var date = el.dateInput.value || todayISO();
    var note = el.noteInput.value.trim();

    if (state.editingId) {
      var tx = state.transactions.find(function (t) { return t.id === state.editingId; });
      if (tx) {
        tx.type = state.modalType;
        tx.category = state.selectedCategory;
        tx.amount = amount;
        tx.date = date;
        tx.note = note;
      }
    } else {
      state.transactions.push({
        id: uid(),
        type: state.modalType,
        category: state.selectedCategory,
        amount: amount,
        date: date,
        note: note,
        createdAt: Date.now()
      });
    }
    saveTransactions();
    closeModalFn();
    renderAll();
  });

  el.deleteBtn.addEventListener('click', function () {
    if (!state.editingId) return;
    state.transactions = state.transactions.filter(function (t) { return t.id !== state.editingId; });
    saveTransactions();
    closeModalFn();
    renderAll();
  });

  // ---------- Settings ----------
  function openSettings() {
    el.currencySelect.value = state.currency;
    el.settingsOverlay.classList.add('show');
  }

  el.settingsBtn.addEventListener('click', function () { openSettings(); });
  el.closeSettings.addEventListener('click', function () { el.settingsOverlay.classList.remove('show'); });
  el.settingsOverlay.addEventListener('click', function (e) {
    if (e.target === el.settingsOverlay) el.settingsOverlay.classList.remove('show');
  });
  el.currencySelect.addEventListener('change', function () {
    state.currency = el.currencySelect.value;
    localStorage.setItem(CURRENCY_KEY, state.currency);
    renderAll();
  });
  function exportData() {
    return {
      transactions: state.transactions,
      customCategories: state.customCategories,
      categoryBudgets: state.categoryBudgets,
      paidBills: state.paidBills,
      currency: state.currency,
      budgetCollapsed: state.budgetCollapsed
    };
  }

  el.exportBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'matcha-blossom-budget-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  el.importBtn.addEventListener('click', function () { el.importFile.click(); });
  el.importFile.addEventListener('change', function () {
    var file = el.importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch (e) {
        alert('That file is not a valid backup.');
        el.importFile.value = '';
        return;
      }
      var isLegacyArray = Array.isArray(data);
      var incomingTx = isLegacyArray ? data : data.transactions;
      if (!Array.isArray(incomingTx)) {
        alert('That file is not a valid backup.');
        el.importFile.value = '';
        return;
      }
      if (!confirm('Import will replace all current data on this device. Continue?')) {
        el.importFile.value = '';
        return;
      }

      state.transactions = incomingTx;
      state.customCategories = (!isLegacyArray && data.customCategories) || { expense: [], income: [] };
      state.categoryBudgets = (!isLegacyArray && data.categoryBudgets) || [];
      state.paidBills = (!isLegacyArray && data.paidBills) || {};
      state.currency = (!isLegacyArray && data.currency) || state.currency;
      state.budgetCollapsed = !isLegacyArray && !!data.budgetCollapsed;

      saveTransactions();
      saveCustomCategories();
      saveCategoryBudgets();
      savePaidBills();
      localStorage.setItem(CURRENCY_KEY, state.currency);
      localStorage.setItem(BUDGET_COLLAPSED_KEY, state.budgetCollapsed);

      el.importFile.value = '';
      el.settingsOverlay.classList.remove('show');
      renderAll();
      alert('Import complete!');
    };
    reader.readAsText(file);
  });

  el.clearBtn.addEventListener('click', function () {
    if (confirm('Erase all transactions? This cannot be undone.')) {
      state.transactions = [];
      saveTransactions();
      el.settingsOverlay.classList.remove('show');
      renderAll();
    }
  });

  // ---------- Bank Statement Import ----------
  var PDFJS_VERSION = '3.11.174';

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + PDFJS_VERSION + '/pdf.min.js';
      script.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + PDFJS_VERSION + '/pdf.worker.min.js';
        resolve();
      };
      script.onerror = function () { reject(new Error('Could not load PDF reader.')); };
      document.head.appendChild(script);
    });
  }

  function parseCSVText(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\r') {
        // skip
      } else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }

  function mapCsvColumns(header) {
    var map = {};
    header.forEach(function (h, idx) {
      var k = (h || '').toLowerCase().trim();
      if (map.date == null && /date/.test(k)) map.date = idx;
      else if (map.desc == null && /(desc|narrative|memo|detail|particular|payee|merchant|reference)/.test(k)) map.desc = idx;
      else if (map.amount == null && /^amount$/.test(k)) map.amount = idx;
      else if (map.debit == null && /(debit|withdrawal|money ?out|paid ?out)/.test(k)) map.debit = idx;
      else if (map.credit == null && /(credit|deposit|money ?in|paid ?in)/.test(k)) map.credit = idx;
    });
    return map;
  }

  function parseAmountStr(str) {
    if (str == null) return null;
    var s = String(str).trim();
    if (!s) return null;
    var neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    if (/^-/.test(s)) neg = true;
    s = s.replace(/[^\d.]/g, '');
    if (!s) return null;
    var n = parseFloat(s);
    if (isNaN(n)) return null;
    return neg ? -n : n;
  }

  function parseDateFlexible(str) {
    if (!str) return null;
    var s = String(str).trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      var a = parseInt(m[1], 10), b = parseInt(m[2], 10), y = m[3];
      if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
      var month = a, day = b;
      if (a > 12 && b <= 12) { month = b; day = a; }
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      return y + '-' + pad(month) + '-' + pad(day);
    }
    var d = new Date(s);
    if (!isNaN(d.getTime())) return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return null;
  }

  function buildRowsFromCsv(text) {
    var table = parseCSVText(text);
    if (!table.length) return [];
    var map = mapCsvColumns(table[0]);
    var rows = [];
    for (var r = 1; r < table.length; r++) {
      var cols = table[r];
      if (!cols || !cols.some(function (c) { return c.trim() !== ''; })) continue;

      var date = parseDateFlexible(map.date != null ? cols[map.date] : null) || todayISO();
      var desc;
      if (map.desc != null) {
        desc = cols[map.desc];
      } else {
        var used = [map.date, map.amount, map.debit, map.credit];
        desc = cols.filter(function (_, i) { return used.indexOf(i) === -1; }).join(' ');
      }

      var amount = null, type = 'expense';
      if (map.amount != null) {
        var amt = parseAmountStr(cols[map.amount]);
        if (amt != null) { type = amt < 0 ? 'expense' : 'income'; amount = Math.abs(amt); }
      } else {
        var debitVal = map.debit != null ? parseAmountStr(cols[map.debit]) : null;
        var creditVal = map.credit != null ? parseAmountStr(cols[map.credit]) : null;
        if (debitVal) { amount = Math.abs(debitVal); type = 'expense'; }
        else if (creditVal) { amount = Math.abs(creditVal); type = 'income'; }
      }
      if (amount == null || isNaN(amount) || amount === 0) continue;

      rows.push({
        date: date,
        note: (desc || '').trim().slice(0, 80),
        amount: amount,
        type: type,
        category: type === 'expense' ? 'other-exp' : 'other-inc'
      });
    }
    return rows;
  }

  function extractPdfLines(file) {
    return file.arrayBuffer().then(function (buf) {
      return window.pdfjsLib.getDocument({ data: buf }).promise;
    }).then(function (pdf) {
      var pagePromises = [];
      for (var p = 1; p <= pdf.numPages; p++) {
        pagePromises.push(pdf.getPage(p).then(function (page) {
          return page.getTextContent().then(function (content) {
            var lines = {};
            content.items.forEach(function (it) {
              var y = Math.round(it.transform[5]);
              if (!lines[y]) lines[y] = [];
              lines[y].push({ x: it.transform[4], str: it.str });
            });
            var ys = Object.keys(lines).map(Number).sort(function (a, b) { return b - a; });
            return ys.map(function (y) {
              return lines[y].sort(function (a, b) { return a.x - b.x; })
                .map(function (it) { return it.str; }).join(' ');
            });
          });
        }));
      }
      return Promise.all(pagePromises).then(function (pages) {
        return pages.reduce(function (all, page) { return all.concat(page); }, []);
      });
    });
  }

  function buildRowsFromPdfLines(lines) {
    var rows = [];
    var lineRe = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\(?-?\s?[₱$€£]?\s?\d[\d,]*\.\d{2}\)?)\s*$/;
    lines.forEach(function (line) {
      var m = line.match(lineRe);
      if (!m) return;
      var date = parseDateFlexible(m[1]);
      var amount = parseAmountStr(m[3]);
      if (!date || amount == null || amount === 0) return;
      var type = amount < 0 ? 'expense' : 'income';
      rows.push({
        date: date,
        note: m[2].trim().slice(0, 80),
        amount: Math.abs(amount),
        type: type,
        category: type === 'expense' ? 'other-exp' : 'other-inc'
      });
    });
    return rows;
  }

  function openStatementModal() {
    el.settingsOverlay.classList.remove('show');
    el.stmtStepFile.hidden = false;
    el.stmtStepReview.hidden = true;
    el.stmtError.hidden = true;
    el.stmtLoading.hidden = true;
    el.stmtFileInput.value = '';
    el.statementOverlay.classList.add('show');
  }

  function closeStatementModal() {
    el.statementOverlay.classList.remove('show');
  }

  function showStatementError(msg) {
    el.stmtLoading.hidden = true;
    el.stmtError.textContent = msg;
    el.stmtError.hidden = false;
  }

  el.statementBtn.addEventListener('click', openStatementModal);
  el.closeStatement.addEventListener('click', closeStatementModal);
  el.statementOverlay.addEventListener('click', function (e) {
    if (e.target === el.statementOverlay) closeStatementModal();
  });
  el.stmtChooseBtn.addEventListener('click', function () { el.stmtFileInput.click(); });
  el.stmtBackBtn.addEventListener('click', function () {
    el.stmtStepReview.hidden = true;
    el.stmtStepFile.hidden = false;
  });

  el.stmtFileInput.addEventListener('change', function () {
    var file = el.stmtFileInput.files[0];
    if (!file) return;
    el.stmtError.hidden = true;
    el.stmtLoading.hidden = false;

    var isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';

    var parsePromise;
    if (isPdf) {
      parsePromise = loadPdfJs()
        .then(function () { return extractPdfLines(file); })
        .then(buildRowsFromPdfLines);
    } else {
      parsePromise = file.text().then(buildRowsFromCsv);
    }

    parsePromise.then(function (rows) {
      el.stmtLoading.hidden = true;
      if (!rows.length) {
        showStatementError('Couldn\'t find any transactions in that file. For best results, export a CSV statement from your bank\'s website instead.');
        return;
      }
      renderStatementReview(rows);
    }).catch(function (err) {
      showStatementError('Something went wrong reading that file: ' + err.message);
    });
  });

  function populateStmtCategorySelect(selectEl, type, selectedId) {
    selectEl.innerHTML = getCategories(type).map(function (c) {
      return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
    }).join('');
    selectEl.value = selectedId;
    if (!selectEl.value) selectEl.selectedIndex = 0;
  }

  function renderStatementReview(rows) {
    el.stmtStepFile.hidden = true;
    el.stmtStepReview.hidden = false;
    el.stmtSelectAll.checked = true;
    el.stmtSummary.textContent = rows.length + ' transaction' + (rows.length === 1 ? '' : 's') + ' found — review before importing';
    el.stmtRows.innerHTML = '';

    rows.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'stmt-row';

      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'stmt-check';
      check.checked = true;
      check.addEventListener('change', function () {
        rowEl.classList.toggle('excluded', !check.checked);
      });
      rowEl.appendChild(check);

      var main = document.createElement('div');
      main.className = 'stmt-row-main';

      var top = document.createElement('div');
      top.className = 'stmt-row-top';
      var dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'stmt-date';
      dateInput.value = row.date;
      var amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.step = '0.01';
      amountInput.min = '0';
      amountInput.className = 'stmt-amount';
      amountInput.value = row.amount.toFixed(2);
      top.appendChild(dateInput);
      top.appendChild(amountInput);
      main.appendChild(top);

      var descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.className = 'stmt-desc';
      descInput.maxLength = 80;
      descInput.value = row.note;
      descInput.placeholder = 'Description';
      main.appendChild(descInput);

      var bottom = document.createElement('div');
      bottom.className = 'stmt-row-bottom';

      var toggle = document.createElement('div');
      toggle.className = 'stmt-type-toggle';
      var expBtn = document.createElement('button');
      expBtn.type = 'button';
      expBtn.className = 'stmt-type-btn expense' + (row.type === 'expense' ? ' active' : '');
      expBtn.dataset.type = 'expense';
      expBtn.textContent = '🌸';
      var incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.className = 'stmt-type-btn income' + (row.type === 'income' ? ' active' : '');
      incBtn.dataset.type = 'income';
      incBtn.textContent = '🌱';
      toggle.appendChild(expBtn);
      toggle.appendChild(incBtn);
      bottom.appendChild(toggle);

      var catSelect = document.createElement('select');
      catSelect.className = 'stmt-category';
      populateStmtCategorySelect(catSelect, row.type, row.category);
      bottom.appendChild(catSelect);

      function setType(newType) {
        expBtn.classList.toggle('active', newType === 'expense');
        incBtn.classList.toggle('active', newType === 'income');
        populateStmtCategorySelect(catSelect, newType, newType === 'expense' ? 'other-exp' : 'other-inc');
      }
      expBtn.addEventListener('click', function () { setType('expense'); });
      incBtn.addEventListener('click', function () { setType('income'); });

      main.appendChild(bottom);
      rowEl.appendChild(main);
      el.stmtRows.appendChild(rowEl);
    });
  }

  el.stmtSelectAll.addEventListener('change', function () {
    var checked = el.stmtSelectAll.checked;
    Array.prototype.forEach.call(el.stmtRows.querySelectorAll('.stmt-row'), function (rowEl) {
      var box = rowEl.querySelector('.stmt-check');
      box.checked = checked;
      rowEl.classList.toggle('excluded', !checked);
    });
  });

  el.stmtImportBtn.addEventListener('click', function () {
    var rowEls = el.stmtRows.querySelectorAll('.stmt-row');
    var count = 0;
    Array.prototype.forEach.call(rowEls, function (rowEl) {
      if (!rowEl.querySelector('.stmt-check').checked) return;
      var date = rowEl.querySelector('.stmt-date').value;
      var note = rowEl.querySelector('.stmt-desc').value.trim();
      var amount = parseFloat(rowEl.querySelector('.stmt-amount').value);
      var activeTypeBtn = rowEl.querySelector('.stmt-type-btn.active');
      var type = activeTypeBtn ? activeTypeBtn.dataset.type : 'expense';
      var category = rowEl.querySelector('.stmt-category').value;
      if (!date || !amount || amount <= 0) return;

      state.transactions.push({
        id: uid(),
        type: type,
        category: category,
        amount: amount,
        date: date,
        note: note,
        createdAt: Date.now()
      });
      count++;
    });

    saveTransactions();
    closeStatementModal();
    renderAll();
    alert(count + ' transaction' + (count === 1 ? '' : 's') + ' imported!');
  });

  // ---------- Init ----------
  renderAll();
})();
