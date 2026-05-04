
    'use strict';

    /* ══════════════════════════════════════
       THEME SYSTEM
    ══════════════════════════════════════ */
    var Themes = {
      list: [
        { id: 'dark', label: 'Dark', color: '#4f8cff', bg: '#181b26' },
        { id: 'white', label: 'Light', color: '#e2e8f0', bg: '#f0f2f7' },
        { id: 'green', label: 'Green', color: '#22c55e', bg: '#071a0f' },
        { id: 'red', label: 'Red', color: '#ef4444', bg: '#1a0707' },
        { id: 'pink', label: 'Pink', color: '#ec4899', bg: '#1a0713' },
        { id: 'yellow', label: 'Yellow', color: '#f59e0b', bg: '#1a1505' },
        { id: 'purple', label: 'Purple', color: '#8b5cf6', bg: '#0f071a' },
        { id: 'teal', label: 'Teal', color: '#14b8a6', bg: '#061a18' },
        { id: 'orange', label: 'Orange', color: '#f97316', bg: '#1a0f05' },
      ],

      current: 'dark',

      apply: function (id) {
        var body = document.body;
        this.list.forEach(function (t) { body.classList.remove('theme-' + t.id); });
        if (id !== 'dark') body.classList.add('theme-' + id);
        this.current = id;
        // Update active swatch
        document.querySelectorAll('.theme-swatch').forEach(function (s) {
          s.classList.toggle('active', s.dataset.theme === id);
        });
        localStorage.setItem('lt_theme', id);
      },

      init: function () {
        var saved = localStorage.getItem('lt_theme') || 'dark';
        var picker = document.getElementById('theme-picker');
        if (!picker) return;
        var self = this;
        this.list.forEach(function (t) {
          var btn = document.createElement('button');
          btn.className = 'theme-swatch' + (t.id === saved ? ' active' : '');
          btn.dataset.theme = t.id;
          btn.title = t.label;
          btn.style.background = t.id === 'white' ? 'linear-gradient(135deg, #f0f2f7, #c8cedf)' : 'linear-gradient(135deg, ' + t.color + ', ' + t.bg + ')';
          btn.addEventListener('click', function () { self.apply(t.id); });
          picker.appendChild(btn);
        });
        this.apply(saved);
      }
    };

    /* ══════════════════════════════════════
       UTILITIES
    ══════════════════════════════════════ */
    function pad2(n) { return String(n).padStart(2, '0'); }
    function todayKey() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function dateKeyOffset(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
    var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /* ══════════════════════════════════════
       AUTH
    ══════════════════════════════════════ */
    var Auth = (function () {
      var SESSION_KEY = 'lt_session';
      var isSignup = false;

      function currentUser() { return localStorage.getItem(SESSION_KEY) || null; }
      function userKey(u) { return 'lt_user_' + u.toLowerCase(); }
      function loadData(u) { if (!u) return null; var r = localStorage.getItem(userKey(u)); if (!r) return null; try { return JSON.parse(r); } catch (e) { return null; } }
      function saveData(u, d) { localStorage.setItem(userKey(u), JSON.stringify(d)); }
      function freshData(u) {
        return {
          user: u, createdAt: new Date().toISOString().slice(0, 10),
          tasks: {}, water: {}, exercise: {}, study: {}, sleep: {}, cycle: {},
          settings: { cycleEnabled: false, waterGoal: 8 }, trend: {}
        };
      }

      function showError(msg) { document.getElementById('auth-error').textContent = msg; }

      function setMode(signup) {
        isSignup = signup;
        document.getElementById('auth-title').textContent = signup ? 'Create account' : 'Welcome back';
        document.getElementById('auth-sub').textContent = signup ? 'Start tracking your life' : 'Sign in to your space';
        document.getElementById('auth-submit').textContent = signup ? 'Create Account' : 'Sign In';
        showError('');
      }

      function attempt() {
        var username = (document.getElementById('auth-username').value || '').trim().toLowerCase();
        var password = (document.getElementById('auth-password').value || '');
        if (!username) { showError('Username is required.'); return; }
        if (username.length < 2) { showError('Username must be at least 2 characters.'); return; }
        if (!password) { showError('Password is required.'); return; }
        if (password.length < 4) { showError('Password must be at least 4 characters.'); return; }
        var existing = loadData(username);
        if (isSignup) {
          if (existing) { showError('Username taken. Try logging in.'); return; }
          var data = freshData(username); data._pw = btoa(password);
          saveData(username, data); localStorage.setItem(SESSION_KEY, username); onLogin(username);
        } else {
          if (!existing) { showError('No account found. Create one below.'); return; }
          if (existing._pw !== btoa(password)) { showError('Incorrect password.'); return; }
          localStorage.setItem(SESSION_KEY, username); onLogin(username);
        }
      }

      function onLogin(username) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        App.init(username);
      }

      function logout() {
        localStorage.removeItem(SESSION_KEY);
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        App.destroy(); setMode(false);
      }

      function init() {
        document.getElementById('auth-submit').addEventListener('click', attempt);
        document.getElementById('auth-toggle').addEventListener('click', function () { setMode(!isSignup); });
        document.getElementById('auth-username').addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('auth-password').focus(); });
        document.getElementById('auth-password').addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
        var user = currentUser();
        if (user && loadData(user)) onLogin(user);
      }

      return { init: init, currentUser: currentUser, loadData: loadData, saveData: saveData, logout: logout, freshData: freshData };
    })();

    /* ══════════════════════════════════════
       TASKS MODULE
    ══════════════════════════════════════ */
    var TaskModule = (function () {
      var START_DATE = null, donutChart = null, trendChart = null;

      function getUser() { return Auth.currentUser(); }
      function getData() { return Auth.loadData(getUser()) || {}; }
      function setData(d) { Auth.saveData(getUser(), d); }
      function loadTasks() { var d = getData(); return d.tasks || {}; }
      function saveTasks(t) { var d = getData(); d.tasks = t; setData(d); }
      function loadTrend() { var d = getData(); return d.trend || {}; }
      function saveTrend(tr) { var d = getData(); d.trend = tr; setData(d); }

      function buildDayRange() {
        var startStr = START_DATE || todayKey();
        var start = new Date(startStr + 'T00:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var todayStr = todayKey();
        var days = [];
        var cur = new Date(start);
        while (cur <= today) {
          var key = cur.getFullYear() + '-' + pad2(cur.getMonth() + 1) + '-' + pad2(cur.getDate());
          days.push({ key: key, label: String(cur.getDate()), dow: DOW[cur.getDay()], isToday: key === todayStr, isWeekend: cur.getDay() === 0 || cur.getDay() === 6 });
          cur.setDate(cur.getDate() + 1);
        }
        return days;
      }

      function cycleState(s) { if (s === 'empty' || !s) return 'tick'; if (s === 'tick') return 'cross'; return 'empty'; }

      function calcStats(tasks, dayRange) {
        var done = 0, miss = 0, blank = 0;
        tasks.forEach(function (task) { dayRange.forEach(function (d) { var s = (task.days && task.days[d.key]) || 'empty'; if (s === 'tick') done++; else if (s === 'cross') miss++; else blank++; }); });
        var filled = done + miss;
        var pct = filled === 0 ? 0 : Math.round((done / filled) * 100);
        return { taskCount: tasks.length, done: done, miss: miss, blank: blank, pct: pct };
      }

      function renderStatsBar(stats) {
        var el = document.getElementById('task-stats'); if (!el) return;
        el.innerHTML = '<div class="task-stat s-total"><b>' + stats.taskCount + '</b>&nbsp;tasks</div>' + '<div class="task-stat s-done"><b>' + stats.done + '</b>&nbsp;done</div>' + '<div class="task-stat s-miss"><b>' + stats.miss + '</b>&nbsp;missed</div>' + '<div class="task-stat s-pct"><b>' + stats.pct + '%</b>&nbsp;rate</div>';
      }

      function renderHeader(dayRange) {
        var el = document.getElementById('tasks-thead'); if (!el) return;
        var html = '<tr><th>Tasks</th>';
        dayRange.forEach(function (d) {
          var cls = (d.isToday ? 'today-col' : '') + (d.isWeekend ? ' weekend' : '');
          html += '<th' + (cls ? ' class="' + cls.trim() + '"' : '') + '><div class="th-day"><span class="th-dow">' + d.dow + '</span><span class="th-num">' + d.label + '</span></div></th>';
        });
        el.innerHTML = html + '</tr>';
      }

      function renderBody(tasks, dayRange) {
        var el = document.getElementById('tasks-tbody'); if (!el) return;
        if (tasks.length === 0) {
          el.innerHTML = '<tr><td colspan="' + (dayRange.length + 1) + '" style="text-align:center;padding:3rem 1rem;color:var(--muted);font-size:.88rem"><span style="font-size:2.2rem;display:block;opacity:.25;margin-bottom:.4rem">📋</span>No habits yet — add one above!</td></tr>';
          return;
        }
        var html = '';
        tasks.forEach(function (task, ti) {
          if (!task.days) task.days = {};
          var cells = '';
          dayRange.forEach(function (d) {
            var state = (task.days[d.key]) || 'empty';
            cells += '<td class="day-cell' + (d.isToday ? ' today-col' : '') + '"><button class="cell-btn" data-s="' + state + '" data-ti="' + ti + '" data-key="' + d.key + '"></button></td>';
          });
          html += '<tr data-ti="' + ti + '"><td class="name-cell"><div class="name-inner">' + '<button class="del-btn" data-ti="' + ti + '" aria-label="Delete"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' + '<span class="task-label" title="' + escHtml(task.name) + '">' + escHtml(task.name) + '</span></div></td>' + cells + '</tr>';
        });
        el.innerHTML = html;
      }

      function spawnRipple(btn) { var r = document.createElement('span'); r.className = 'rpl'; btn.appendChild(r); r.addEventListener('animationend', function () { if (r.parentNode) r.parentNode.removeChild(r); }, { once: true }); }

      function updateScore(tasks, dayRange) {
        var today = todayKey(), done = 0, miss = 0, blank = 0;
        tasks.forEach(function (task) { var s = (task.days && task.days[today]) || 'empty'; if (s === 'tick') done++; else if (s === 'cross') miss++; else blank++; });
        var filled = done + miss;
        var pct = filled === 0 ? 0 : Math.round((done / filled) * 100);
        var el = document.getElementById('score-num'); if (el) el.textContent = pct + '%';
        renderDonut(done, miss, blank);
        var tr = loadTrend(); tr[today] = pct; saveTrend(tr);
        renderTrend(dayRange);
      }

      function renderDonut(done, miss, blank) {
        var ctx = document.getElementById('donut-chart'); if (!ctx) return;
        if (donutChart) { donutChart.destroy(); donutChart = null; }
        donutChart = new Chart(ctx.getContext('2d'), {
          type: 'doughnut',
          data: { labels: ['Completed', 'Missed', 'Blank'], datasets: [{ data: [done, miss, blank], backgroundColor: ['#2ecc8b', '#ff5572', '#272b3e'], borderWidth: 0, hoverOffset: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return ' ' + c.label + ': ' + c.parsed; } } } } }
        });
      }

      function renderTrend(dayRange) {
        var ctx = document.getElementById('trend-chart'); if (!ctx) return;
        var tr = loadTrend(); var labels = [], scores = [];
        dayRange.forEach(function (d) { labels.push(d.key.slice(5)); scores.push(tr[d.key] !== undefined ? tr[d.key] : null); });
        if (trendChart) { trendChart.destroy(); trendChart = null; }
        trendChart = new Chart(ctx.getContext('2d'), {
          type: 'line',
          data: { labels: labels, datasets: [{ label: 'Productivity %', data: scores, borderColor: 'var(--accent)', backgroundColor: 'rgba(79,140,255,.12)', tension: .4, fill: true, pointRadius: 3, pointBackgroundColor: 'var(--accent)', spanGaps: true }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 } } }, x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 }, maxTicksLimit: 10, maxRotation: 0 } } }, plugins: { legend: { display: false } } }
        });
      }

      function render() {
        var taskMap = loadTasks();
        var tasks = Array.isArray(taskMap) ? taskMap : (taskMap.__arr || []);
        var dayRange = buildDayRange();
        renderHeader(dayRange); renderBody(tasks, dayRange);
        var stats = calcStats(tasks, dayRange);
        renderStatsBar(stats); updateScore(tasks, dayRange);
      }

      function addTask(name) {
        name = (name || '').trim(); if (!name) return false;
        var d = getData();
        if (!d.tasks) d.tasks = { __arr: [] };
        if (!d.tasks.__arr) d.tasks.__arr = [];
        for (var i = 0; i < d.tasks.__arr.length; i++) { if (d.tasks.__arr[i].name.toLowerCase() === name.toLowerCase()) return false; }
        d.tasks.__arr.push({ id: Date.now(), name: name, days: {} });
        setData(d); if (!START_DATE) START_DATE = todayKey();
        render(); return true;
      }

      function toggleCell(ti, key, btn) {
        var d = getData();
        if (!d.tasks || !d.tasks.__arr || !d.tasks.__arr[ti]) return;
        var task = d.tasks.__arr[ti]; if (!task.days) task.days = {};
        var current = task.days[key] || 'empty';
        var next = cycleState(current);
        if (next === 'empty') delete task.days[key]; else task.days[key] = next;
        setData(d); btn.setAttribute('data-s', next); spawnRipple(btn);
        var tasks = d.tasks.__arr, dayRange = buildDayRange();
        renderStatsBar(calcStats(tasks, dayRange));
        updateScore(tasks, dayRange); App.refreshDashboard();
      }

      function deleteTask(ti) {
        var row = document.querySelector('#tasks-tbody tr[data-ti="' + ti + '"]'); if (!row) return;
        row.classList.add('row-out');
        row.addEventListener('animationend', function () {
          var d = getData(); if (d.tasks && d.tasks.__arr) d.tasks.__arr.splice(ti, 1);
          setData(d); render(); App.refreshDashboard();
        }, { once: true });
      }

      function todaySummary() {
        var d = getData(); var tasks = (d.tasks && d.tasks.__arr) || [];
        var today = todayKey(); var done = 0, total = tasks.length;
        tasks.forEach(function (t) { if (t.days && t.days[today] === 'tick') done++; });
        return { done: done, total: total };
      }

      function init() {
        START_DATE = todayKey();
        var d = getData();
        if (d.tasks && d.tasks.__arr && d.tasks.__arr.length > 0) {
          var earliest = todayKey();
          d.tasks.__arr.forEach(function (t) { if (t.days) { Object.keys(t.days).forEach(function (k) { if (k < earliest) earliest = k; }); } });
          var thirtyAgo = dateKeyOffset(29);
          START_DATE = earliest < thirtyAgo ? thirtyAgo : earliest;
          if (START_DATE > todayKey()) START_DATE = todayKey();
        }

        document.getElementById('task-add-btn').addEventListener('click', function () {
          var inp = document.getElementById('task-input');
          if (addTask(inp.value)) inp.value = ''; inp.focus();
        });
        document.getElementById('task-input').addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { if (addTask(this.value)) this.value = ''; }
        });
        document.getElementById('tasks-tbody').addEventListener('click', function (e) {
          var cb = e.target.closest('.cell-btn');
          if (cb) { toggleCell(parseInt(cb.getAttribute('data-ti'), 10), cb.getAttribute('data-key'), cb); return; }
          var db = e.target.closest('.del-btn');
          if (db) { deleteTask(parseInt(db.getAttribute('data-ti'), 10)); }
        });

        var sub = document.getElementById('tasks-date-sub');
        if (sub) sub.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        render();
      }

      function destroy() { donutChart = null; trendChart = null; }
      return { init: init, render: render, todaySummary: todaySummary, destroy: destroy };
    })();

    /* ══════════════════════════════════════
       WATER MODULE
    ══════════════════════════════════════ */
    var WaterModule = (function () {
      var histChart = null;
      function getData() { return Auth.loadData(Auth.currentUser()) || {}; }
      function setData(d) { Auth.saveData(Auth.currentUser(), d); }
      function getGoal() { var d = getData(); return (d.settings && d.settings.waterGoal) || 8; }
      function setGoal(g) { var d = getData(); if (!d.settings) d.settings = {}; d.settings.waterGoal = g; setData(d); }
      function todayCount() { var d = getData(); return (d.water && d.water[todayKey()]) || 0; }
      function setToday(n) { var d = getData(); if (!d.water) d.water = {}; d.water[todayKey()] = Math.max(0, n); setData(d); }

      function render() {
        var goal = getGoal(), count = todayCount();
        var pct = Math.min(100, Math.round((count / goal) * 100));
        var fill = document.getElementById('water-fill'); if (fill) fill.style.height = pct + '%';
        var wc = document.getElementById('water-count'); if (wc) wc.textContent = count;
        var wcu = document.getElementById('water-current'); if (wcu) wcu.textContent = count;
        var wgd = document.getElementById('water-goal-display'); if (wgd) wgd.textContent = goal;
        var wb = document.getElementById('water-bar'); if (wb) wb.style.width = pct + '%';
        var wgi = document.getElementById('water-goal-input'); if (wgi) wgi.value = goal;
        renderHistory();
      }

      function renderHistory() {
        var ctx = document.getElementById('water-history-chart'); if (!ctx) return;
        var d = getData(); var w = d.water || {};
        var keys = []; for (var i = 6; i >= 0; i--)keys.push(dateKeyOffset(i));
        var goal = getGoal();
        var labels = keys.map(function (k) { return k.slice(5); });
        var values = keys.map(function (k) { return w[k] || 0; });
        if (histChart) { histChart.destroy(); histChart = null; }
        histChart = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels, datasets: [
              { label: 'Glasses', data: values, backgroundColor: 'rgba(79,140,255,.5)', borderColor: '#4f8cff', borderWidth: 1.5, borderRadius: 6 },
              { label: 'Goal', data: keys.map(function () { return goal; }), type: 'line', borderColor: 'rgba(79,140,255,.35)', borderDash: [4, 3], pointRadius: 0, fill: false }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: Math.max(goal + 2, 12), grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#6b748f', font: { size: 11 } } } }, plugins: { legend: { display: false } } }
        });
      }

      function summary() { var goal = getGoal(), count = todayCount(); return { count: count, goal: goal, pct: Math.min(100, Math.round((count / goal) * 100)) }; }

      function init() {
        document.getElementById('water-plus').addEventListener('click', function () { setToday(todayCount() + 1); render(); App.refreshDashboard(); });
        document.getElementById('water-minus').addEventListener('click', function () { setToday(todayCount() - 1); render(); App.refreshDashboard(); });
        document.getElementById('water-goal-save').addEventListener('click', function () {
          var v = parseInt(document.getElementById('water-goal-input').value, 10);
          if (v >= 1 && v <= 20) { setGoal(v); render(); }
        });
        render();
      }
      function destroy() { histChart = null; }
      return { init: init, render: render, summary: summary, destroy: destroy };
    })();

    /* ══════════════════════════════════════
       EXERCISE MODULE
    ══════════════════════════════════════ */
    var ExerciseModule = (function () {
      function getData() { return Auth.loadData(Auth.currentUser()) || {}; }
      function setData(d) { Auth.saveData(Auth.currentUser(), d); }
      function getEx() { var d = getData(); return d.exercise || {}; }
      function saveEx(ex) { var d = getData(); d.exercise = ex; setData(d); }
      function todayEntry() { return getEx()[todayKey()] || null; }

      function calcStreak() {
        var ex = getEx(); var streak = 0;
        for (var i = 1; i <= 365; i++) { var key = dateKeyOffset(i); if (ex[key] && ex[key].done) streak++; else break; }
        if (ex[todayKey()] && ex[todayKey()].done) streak++;
        return streak;
      }

      function dayLabel(n) { if (n === 0) return 'Today'; var d = new Date(); d.setDate(d.getDate() - n); return DOW[d.getDay()]; }

      function render() {
        var entry = todayEntry(); var isDone = !!(entry && entry.done);
        var track = document.getElementById('ex-toggle-track');
        var label = document.getElementById('ex-toggle-label');
        var streakEl = document.getElementById('ex-streak');
        if (track) { isDone ? track.classList.add('on') : track.classList.remove('on'); }
        if (label) label.textContent = isDone ? 'Done! ✔' : 'Mark as Done';
        if (streakEl) streakEl.textContent = calcStreak();
        if (entry && entry.type) document.getElementById('ex-type').value = entry.type;
        if (entry && entry.duration) document.getElementById('ex-duration').value = entry.duration;
        renderHistory();
      }

      function renderHistory() {
        var ex = getEx(); var el = document.getElementById('ex-history'); if (!el) return;
        var html = '';
        for (var i = 6; i >= 0; i--) {
          var key = dateKeyOffset(i); var e = ex[key]; var done = !!(e && e.done);
          html += '<div class="ex-history-day' + (done ? ' done' : '') + '"><div class="ex-day-label">' + dayLabel(i) + '</div><div class="ex-day-icon">' + (done ? '💪' : '—') + '</div>' + (done && e.type ? '<div class="ex-day-type">' + escHtml(e.type) + '</div>' : '') + (done && e.duration ? '<div class="ex-day-type">' + e.duration + 'm</div>' : '') + '</div>';
        }
        el.innerHTML = html;
      }

      function saveToday(done, type, duration) {
        var ex = getEx(); ex[todayKey()] = { done: done, type: type || '', duration: duration || 0 }; saveEx(ex);
      }

      function summary() { var entry = todayEntry(); return { done: !!(entry && entry.done), streak: calcStreak(), type: entry ? entry.type : '' }; }

      function init() {
        var toggleEl = document.getElementById('ex-toggle');

        function doToggle() {
          var entry = todayEntry(); var isDone = !(entry && entry.done);
          var type = (document.getElementById('ex-type').value || '').trim();
          var dur = parseInt(document.getElementById('ex-duration').value, 10) || 0;
          saveToday(isDone, type, dur); render(); App.refreshDashboard();
        }

        toggleEl.addEventListener('click', doToggle);
        toggleEl.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doToggle(); } });

        document.getElementById('ex-save-btn').addEventListener('click', function () {
          var type = (document.getElementById('ex-type').value || '').trim();
          var dur = parseInt(document.getElementById('ex-duration').value, 10) || 0;
          var entry = todayEntry();
          saveToday(entry ? entry.done : true, type, dur); render(); App.refreshDashboard();
          var btn = this; btn.textContent = 'Saved ✔';
          setTimeout(function () { btn.textContent = 'Save Workout'; }, 1500);
        });
        render();
      }
      return { init: init, render: render, summary: summary };
    })();

    /* ══════════════════════════════════════
       STUDY MODULE
    ══════════════════════════════════════ */
    var StudyModule = (function () {
      var studyChart = null;
      function getData() { return Auth.loadData(Auth.currentUser()) || {}; }
      function setData(d) { Auth.saveData(Auth.currentUser(), d); }
      function getStudy() { var d = getData(); return d.study || {}; }
      function saveStudy(s) { var d = getData(); d.study = s; setData(d); }

      function todayHours() { var s = getStudy(); return (s[todayKey()] || []).reduce(function (a, x) { return a + x.hours; }, 0); }
      function weekHours() { var s = getStudy(); var total = 0; for (var i = 0; i < 7; i++) { var key = dateKeyOffset(i); total += (s[key] || []).reduce(function (a, x) { return a + x.hours; }, 0); } return total; }

      function render() {
        var s = getStudy(); var today = todayKey(); var sessions = s[today] || [];
        var th = document.getElementById('study-today-hrs'); if (th) th.textContent = todayHours().toFixed(1) + 'h';
        var wh = document.getElementById('study-week-hrs'); if (wh) wh.textContent = weekHours().toFixed(1) + 'h';
        var logEl = document.getElementById('study-today-log');
        if (logEl) {
          if (sessions.length === 0) { logEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div>No sessions logged today.</div>'; }
          else { logEl.innerHTML = sessions.map(function (x) { return '<div class="study-log-item"><span class="study-log-subject">' + escHtml(x.subject) + '</span><span class="study-log-hours">' + x.hours + 'h</span><button class="study-log-del" data-id="' + x.id + '" data-date="' + today + '">×</button></div>'; }).join(''); }
        }
        renderChart();
      }

      function renderChart() {
        var ctx = document.getElementById('study-chart'); if (!ctx) return;
        var s = getStudy(); var labels = [], values = [];
        for (var i = 6; i >= 0; i--) {
          var key = dateKeyOffset(i); var d = new Date(); d.setDate(d.getDate() - i);
          labels.push(i === 0 ? 'Today' : DOW[d.getDay()]);
          values.push((s[key] || []).reduce(function (a, x) { return a + x.hours; }, 0));
        }
        if (studyChart) { studyChart.destroy(); studyChart = null; }
        studyChart = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: { labels: labels, datasets: [{ label: 'Hours', data: values, backgroundColor: 'rgba(167,139,250,.5)', borderColor: '#a78bfa', borderWidth: 1.5, borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#6b748f', font: { size: 11 } } } }, plugins: { legend: { display: false } } }
        });
      }

      function addSession(subject, hours) {
        var s = getStudy(); var today = todayKey();
        if (!s[today]) s[today] = [];
        s[today].push({ id: Date.now(), subject: subject, hours: hours });
        saveStudy(s); render(); App.refreshDashboard();
      }

      function deleteSession(date, id) {
        var s = getStudy(); if (!s[date]) return;
        s[date] = s[date].filter(function (x) { return x.id != id; });
        saveStudy(s); render(); App.refreshDashboard();
      }

      function summary() { return { today: todayHours(), week: weekHours() }; }

      function init() {
        document.getElementById('study-add-btn').addEventListener('click', function () {
          var subj = (document.getElementById('study-subject').value || '').trim();
          var hours = parseFloat(document.getElementById('study-hours').value);
          if (!subj || !hours || hours <= 0) return;
          addSession(subj, hours);
          document.getElementById('study-subject').value = '';
          document.getElementById('study-hours').value = '';
        });
        document.getElementById('study-today-log').addEventListener('click', function (e) {
          var del = e.target.closest('.study-log-del');
          if (!del) return;
          deleteSession(del.getAttribute('data-date'), del.getAttribute('data-id'));
        });
        render();
      }
      function destroy() { studyChart = null; }
      return { init: init, render: render, summary: summary, destroy: destroy };
    })();

    /* ══════════════════════════════════════
       SLEEP MODULE
    ══════════════════════════════════════ */
    var SleepModule = (function () {
      var sleepChart = null;
      function getData() { return Auth.loadData(Auth.currentUser()) || {}; }
      function setData(d) { Auth.saveData(Auth.currentUser(), d); }
      function getSleep() { var d = getData(); return d.sleep || {}; }
      function saveSleep(s) { var d = getData(); d.sleep = s; setData(d); }

      function calcHours(bed, wake) {
        var bp = bed.split(':').map(Number), wp = wake.split(':').map(Number);
        var bm = bp[0] * 60 + bp[1], wm = wp[0] * 60 + wp[1];
        var diff = wm - bm; if (diff < 0) diff += 1440; return diff / 60;
      }

      function quality(hours) {
        if (hours < 6) return { label: 'Poor', cls: 'poor', color: '#ff5572' };
        if (hours < 7) return { label: 'OK', cls: 'ok', color: '#f5c842' };
        return { label: 'Good', cls: 'good', color: '#2ecc8b' };
      }

      function render() {
        var s = getSleep(); var entry = s[todayKey()];
        var resultEl = document.getElementById('sleep-result');
        var durEl = document.getElementById('sleep-duration');
        var qualEl = document.getElementById('sleep-quality-badge');
        if (entry) {
          var h = Math.floor(entry.hours), m = Math.round((entry.hours - h) * 60);
          var q = quality(entry.hours);
          if (durEl) durEl.textContent = h + 'h ' + m + 'm';
          if (qualEl) { qualEl.textContent = q.label; qualEl.className = 'sleep-quality-badge ' + q.cls; }
          if (resultEl) resultEl.classList.remove('hidden');
          if (entry.bed) document.getElementById('sleep-bed').value = entry.bed;
          if (entry.wake) document.getElementById('sleep-wake').value = entry.wake;
        } else { if (resultEl) resultEl.classList.add('hidden'); }
        renderChart();
      }

      function renderChart() {
        var ctx = document.getElementById('sleep-chart'); if (!ctx) return;
        var s = getSleep(); var labels = [], values = [], colors = [];
        for (var i = 6; i >= 0; i--) {
          var key = dateKeyOffset(i); var d = new Date(); d.setDate(d.getDate() - i);
          labels.push(i === 0 ? 'Today' : DOW[d.getDay()]);
          var entry = s[key]; var hrs = entry ? entry.hours : 0;
          values.push(hrs || null);
          colors.push(hrs ? quality(hrs).color + '99' : 'rgba(255,255,255,.05)');
        }
        if (sleepChart) { sleepChart.destroy(); sleepChart = null; }
        sleepChart = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels, datasets: [
              { label: 'Hours', data: values, backgroundColor: colors, borderRadius: 6 },
              { label: '8h target', data: labels.map(function () { return 8; }), type: 'line', borderColor: 'rgba(46,204,139,.35)', borderDash: [4, 3], pointRadius: 0, fill: false }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 12, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#6b748f', font: { size: 11 } } } }, plugins: { legend: { display: false } } }
        });
      }

      function summary() { var s = getSleep(); var entry = s[todayKey()]; if (!entry) return { logged: false }; var q = quality(entry.hours); return { logged: true, hours: entry.hours, quality: q.label, qClass: q.cls }; }

      function init() {
        document.getElementById('sleep-log-btn').addEventListener('click', function () {
          var bed = document.getElementById('sleep-bed').value;
          var wake = document.getElementById('sleep-wake').value;
          if (!bed || !wake) return;
          var s = getSleep(); var hours = calcHours(bed, wake);
          s[todayKey()] = { bed: bed, wake: wake, hours: parseFloat(hours.toFixed(2)) };
          saveSleep(s); render(); App.refreshDashboard();
        });
        render();
      }
      function destroy() { sleepChart = null; }
      return { init: init, render: render, summary: summary, destroy: destroy };
    })();

    /* ══════════════════════════════════════
       CYCLE MODULE
    ══════════════════════════════════════ */
    var CycleModule = (function () {
      function getData() { return Auth.loadData(Auth.currentUser()) || {}; }
      function setData(d) { Auth.saveData(Auth.currentUser(), d); }
      function getCycle() { var d = getData(); return d.cycle || {}; }
      function saveCycle(c) { var d = getData(); d.cycle = c; setData(d); }
      function isEnabled() { var d = getData(); return !!(d.settings && d.settings.cycleEnabled); }

      function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
      function addDays(dateStr, n) { var d = new Date(dateStr); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

      function calcStatus(c) {
        var today = todayKey();
        var daysInCycle = daysBetween(c.lastStart, today);
        if (daysInCycle < 0) daysInCycle = 0;
        var cycleDay = (daysInCycle % c.cycleLength) + 1;
        var cyclesCompleted = Math.floor(daysInCycle / c.cycleLength);
        var nextPeriod = addDays(c.lastStart, (cyclesCompleted + 1) * c.cycleLength);
        var daysToNext = daysBetween(today, nextPeriod);
        var ovulationDay = c.cycleLength - 14;
        var fertileStart = ovulationDay - 5, fertileEnd = ovulationDay + 1;
        var status = 'Normal';
        if (cycleDay <= c.periodDuration) status = 'Period';
        else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) status = 'Fertile';
        return { cycleDay: cycleDay, cycleLength: c.cycleLength, nextPeriod: nextPeriod, daysToNext: Math.max(0, daysToNext), status: status, pct: Math.round((cycleDay / c.cycleLength) * 100) };
      }

      function render() {
        if (!isEnabled()) return;
        var c = getCycle();
        if (c.lastStart) document.getElementById('cycle-last-start').value = c.lastStart;
        if (c.cycleLength) document.getElementById('cycle-length').value = c.cycleLength;
        if (c.periodDuration) document.getElementById('cycle-duration').value = c.periodDuration;
        var statusGrid = document.getElementById('cycle-status'); if (!statusGrid || !c.lastStart) return;
        var s = calcStatus(c);
        var sc = s.status === 'Period' ? 'period' : s.status === 'Fertile' ? 'fertile' : 'normal';
        var barCls = sc === 'period' ? 'red' : sc === 'fertile' ? 'green' : 'blue';
        statusGrid.innerHTML = '<div class="cycle-card"><div class="cycle-card-title">Cycle Day</div><div class="cycle-card-val">' + s.cycleDay + ' / ' + s.cycleLength + '</div><div class="prog-bar-wrap" style="margin-top:.6rem"><div class="prog-bar-fill ' + barCls + '" style="width:' + s.pct + '%"></div></div></div>' + '<div class="cycle-card"><div class="cycle-card-title">Current Status</div><div class="cycle-card-val">' + s.status + '</div><span class="cycle-status-pill ' + sc + '">' + s.status + '</span></div>' + '<div class="cycle-card"><div class="cycle-card-title">Next Period</div><div class="cycle-card-val">' + s.nextPeriod + '</div><div style="font-size:.8rem;color:var(--subtext);margin-top:.4rem">in ' + s.daysToNext + ' days</div></div>' + '<div class="cycle-card"><div class="cycle-card-title">Ovulation Window</div><div class="cycle-card-val" style="font-size:1rem">Day ' + (c.cycleLength - 19) + '–' + (c.cycleLength - 13) + '</div><div style="font-size:.8rem;color:var(--subtext);margin-top:.4rem">of your cycle</div></div>';
      }

      function summary() { if (!isEnabled()) return null; var c = getCycle(); if (!c.lastStart) return { enabled: true, configured: false }; var s = calcStatus(c); return { enabled: true, configured: true, status: s.status, daysToNext: s.daysToNext }; }

      function init() {
        document.getElementById('cycle-save-btn').addEventListener('click', function () {
          var lastStart = document.getElementById('cycle-last-start').value;
          var len = parseInt(document.getElementById('cycle-length').value, 10) || 28;
          var dur = parseInt(document.getElementById('cycle-duration').value, 10) || 5;
          if (!lastStart) return;
          saveCycle({ lastStart: lastStart, cycleLength: len, periodDuration: dur }); render();
        });
        render();
      }
      return { init: init, render: render, summary: summary };
    })();

    /* ══════════════════════════════════════
       POMODORO TIMER
    ══════════════════════════════════════ */
    var Pomodoro = (function () {
      var WORK = 25 * 60, BREAK = 5 * 60;
      var timeLeft = WORK, interval = null, sessions = 0, warnings = 0, isBreak = false;

      function fmt(s) { return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }

      function updateDisplay() {
        var el = document.getElementById('timer-display'); if (!el) return;
        el.textContent = fmt(timeLeft);
        el.className = 'timer-display' + (interval ? (isBreak ? ' breaking' : ' running') : '');
        var total = isBreak ? BREAK : WORK;
        var bar = document.getElementById('timer-bar'); if (bar) bar.style.width = Math.round((timeLeft / total) * 100) + '%';
      }

      function tick() {
        timeLeft--; updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(interval); interval = null;
          if (!isBreak) { sessions++; var el = document.getElementById('pomo-sessions'); if (el) el.textContent = sessions; isBreak = true; timeLeft = BREAK; }
          else { isBreak = false; timeLeft = WORK; }
          updateDisplay();
        }
      }

      function start() { if (interval) return; interval = setInterval(tick, 1000); updateDisplay(); }
      function pause() { clearInterval(interval); interval = null; updateDisplay(); }
      function reset() { clearInterval(interval); interval = null; isBreak = false; timeLeft = WORK; sessions = 0; warnings = 0; var se = document.getElementById('pomo-sessions'); if (se) se.textContent = 0; var we = document.getElementById('pomo-warnings'); if (we) we.textContent = 0; updateDisplay(); }

      function handleVisibility() { if (document.hidden) { warnings++; var el = document.getElementById('pomo-warnings'); if (el) el.textContent = warnings; } }

      function init() {
        document.getElementById('btn-start').addEventListener('click', start);
        document.getElementById('btn-pause').addEventListener('click', pause);
        document.getElementById('btn-reset').addEventListener('click', reset);
        document.addEventListener('visibilitychange', handleVisibility);
        updateDisplay();
      }
      function destroy() { clearInterval(interval); interval = null; document.removeEventListener('visibilitychange', handleVisibility); }
      return { init: init, destroy: destroy };
    })();

    /* ══════════════════════════════════════
       APP CONTROLLER
    ══════════════════════════════════════ */
    var App = (function () {
      var weeklyChart = null;
      var initialized = false;

      function getUser() { return Auth.currentUser(); }
      function getData() { return Auth.loadData(getUser()) || {}; }

      function closeSidebar() {
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('sidebar-overlay').style.opacity = '0';
        setTimeout(function () { document.getElementById('sidebar-overlay').style.display = 'none'; }, 250);
      }
      function openSidebar() {
        document.getElementById('sidebar').classList.add('mobile-open');
        var ov = document.getElementById('sidebar-overlay');
        ov.style.display = 'block';
        requestAnimationFrame(function () { ov.style.opacity = '1'; });
      }

      function navigateTo(page) {
        document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        document.querySelectorAll('.bottom-nav-item').forEach(function (n) { n.classList.remove('active'); });
        var pageEl = document.getElementById('page-' + page); if (pageEl) pageEl.classList.add('active');
        var navEl = document.querySelector('.nav-item[data-page="' + page + '"]'); if (navEl) navEl.classList.add('active');
        var bnEl = document.querySelector('.bottom-nav-item[data-page="' + page + '"]'); if (bnEl) bnEl.classList.add('active');
        if (page === 'water') WaterModule.render();
        if (page === 'exercise') ExerciseModule.render();
        if (page === 'study') StudyModule.render();
        if (page === 'sleep') SleepModule.render();
        if (page === 'cycle') CycleModule.render();
        if (page === 'tasks') TaskModule.render();
        if (page === 'dashboard') refreshDashboard();
        // Close mobile sidebar on navigation
        if (window.innerWidth <= 768) closeSidebar();
      }

      function getGreeting() { var h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; }

      function calcOverallStreak(username) {
        var data = Auth.loadData(username); if (!data) return 0;
        var streak = 0;
        for (var i = 1; i <= 365; i++) {
          var key = dateKeyOffset(i);
          var tasks = data.tasks && data.tasks.__arr && data.tasks.__arr.some(function (t) { return t.days && t.days[key] === 'tick'; });
          var water = data.water && data.water[key] && data.water[key] > 0;
          var ex = data.exercise && data.exercise[key] && data.exercise[key].done;
          var study = data.study && data.study[key] && data.study[key].length > 0;
          var sleep = data.sleep && data.sleep[key];
          if (tasks || water || ex || study || sleep) streak++; else break;
        }
        return streak;
      }

      function refreshDashboard() {
        var username = getUser(); if (!username) return;
        var greetEl = document.getElementById('dash-greeting'); if (greetEl) greetEl.textContent = getGreeting() + ', ' + capitalize(username) + ' 👋';
        var dateEl = document.getElementById('dash-date'); if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        var streakEl = document.getElementById('streak-count'); if (streakEl) streakEl.textContent = calcOverallStreak(username);

        var taskSum = TaskModule.todaySummary();
        var waterSum = WaterModule.summary();
        var exSum = ExerciseModule.summary();
        var studySum = StudyModule.summary();
        var sleepSum = SleepModule.summary();

        var summaryEl = document.getElementById('dash-summary');
        if (summaryEl) {
          summaryEl.innerHTML =
            makeSummaryCard('📋', taskSum.done + '/' + taskSum.total, 'Tasks done', 'var(--accent)') +
            makeSummaryCard('💧', waterSum.count + '/' + waterSum.goal, 'Glasses', 'var(--accent)') +
            makeSummaryCard('📚', studySum.today.toFixed(1) + 'h', 'Study today', '#a78bfa') +
            makeSummaryCard('🌙', sleepSum.logged ? (Math.floor(sleepSum.hours) + 'h') : '—', 'Sleep', sleepSum.logged ? (sleepSum.qClass === 'good' ? '#2ecc8b' : sleepSum.qClass === 'ok' ? '#f5c842' : '#ff5572') : '#48516b') +
            makeSummaryCard('💪', exSum.done ? 'Done' : '—', 'Exercise', exSum.done ? '#2ecc8b' : '#48516b');
        }

        var glanceEl = document.getElementById('dash-glance');
        if (glanceEl) {
          var waterPct = waterSum.pct;
          var taskPct = taskSum.total ? Math.round((taskSum.done / taskSum.total) * 100) : 0;
          var cycleSum = CycleModule.summary();
          glanceEl.innerHTML =
            makeGlanceCard('💧 Water', waterSum.count + ' / ' + waterSum.goal + ' glasses', '<div class="prog-bar-wrap"><div class="prog-bar-fill blue" style="width:' + waterPct + '%"></div></div>') +
            makeGlanceCard('📋 Tasks', taskSum.done + ' done of ' + taskSum.total, '<div class="prog-bar-wrap"><div class="prog-bar-fill green" style="width:' + taskPct + '%"></div></div>') +
            makeGlanceCard('📚 Study', studySum.today.toFixed(1) + 'h today · ' + studySum.week.toFixed(1) + 'h this week', '') +
            makeGlanceCard('💪 Exercise', exSum.done ? (exSum.type || 'Workout done') + ' · 🔥 ' + exSum.streak + ' day streak' : 'Not logged yet', '') +
            makeGlanceCard('🌙 Sleep', sleepSum.logged ? (Math.floor(sleepSum.hours) + 'h ' + Math.round((sleepSum.hours % 1) * 60) + 'm · ' + sleepSum.quality) : 'Not logged yet', '') +
            (cycleSum && cycleSum.enabled && cycleSum.configured ? makeGlanceCard('🌸 Cycle', cycleSum.status + ' · Next in ' + cycleSum.daysToNext + ' days', '') : '');
        }
        renderWeeklyChart();
      }

      function makeSummaryCard(icon, val, lbl, color) { return '<div class="summary-card"><div class="summary-card-icon">' + icon + '</div><div class="summary-card-val" style="color:' + color + '">' + val + '</div><div class="summary-card-lbl">' + lbl + '</div></div>'; }
      function makeGlanceCard(title, val, extra) { return '<div class="glance-card"><div class="glance-card-title">' + title + '</div><div class="glance-value">' + val + '</div>' + (extra || '') + '</div>'; }

      function renderWeeklyChart() {
        var ctx = document.getElementById('dash-weekly-chart'); if (!ctx) return;
        var data = getData();
        var labels = [], taskData = [], waterData = [], studyData = [];
        for (var i = 6; i >= 0; i--) {
          var key = dateKeyOffset(i); var d = new Date(); d.setDate(d.getDate() - i);
          labels.push(i === 0 ? 'Today' : DOW[d.getDay()]);
          var dayTasks = (data.tasks && data.tasks.__arr) || [];
          var done = dayTasks.filter(function (t) { return t.days && t.days[key] === 'tick'; }).length;
          taskData.push(dayTasks.length ? Math.round((done / dayTasks.length) * 100) : null);
          var goal = (data.settings && data.settings.waterGoal) || 8;
          var wc = (data.water && data.water[key]) || 0;
          waterData.push(Math.min(100, Math.round((wc / goal) * 100)));
          var sessions = (data.study && data.study[key]) || [];
          studyData.push(sessions.reduce(function (a, x) { return a + x.hours; }, 0));
        }
        if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
        weeklyChart = new Chart(ctx.getContext('2d'), {
          data: {
            labels: labels, datasets: [
              { type: 'bar', label: 'Task %', data: taskData, backgroundColor: 'rgba(46,204,139,.4)', borderColor: '#2ecc8b', borderWidth: 1.5, borderRadius: 6, yAxisID: 'y' },
              { type: 'bar', label: 'Water %', data: waterData, backgroundColor: 'rgba(79,140,255,.4)', borderColor: '#4f8cff', borderWidth: 1.5, borderRadius: 6, yAxisID: 'y' },
              { type: 'line', label: 'Study hrs', data: studyData, borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,.1)', tension: .4, fill: true, pointRadius: 3, yAxisID: 'y2', spanGaps: true }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100, position: 'left', grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6b748f', font: { size: 11 } } }, y2: { min: 0, max: 12, position: 'right', grid: { display: false }, ticks: { color: '#6b748f', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#6b748f', font: { size: 11 } } } },
            plugins: { legend: { display: true, labels: { color: '#6b748f', font: { size: 11 }, boxWidth: 12 } } }
          }
        });
      }

      function initSidebar() {
        // Desktop toggle
        document.getElementById('sidebar-toggle').addEventListener('click', function () {
          var sb = document.getElementById('sidebar');
          var mc = document.getElementById('main-content');
          if (window.innerWidth > 768) {
            sb.classList.toggle('collapsed'); mc.classList.toggle('collapsed');
          } else {
            if (sb.classList.contains('mobile-open')) closeSidebar(); else openSidebar();
          }
        });

        // Mobile hamburger
        document.getElementById('mobile-hamburger').addEventListener('click', function () {
          var sb = document.getElementById('sidebar');
          if (sb.classList.contains('mobile-open')) closeSidebar(); else openSidebar();
        });

        // Overlay click to close
        document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

        // Sidebar nav items
        document.getElementById('sidebar').addEventListener('click', function (e) {
          var item = e.target.closest('.nav-item');
          if (item && item.dataset.page) navigateTo(item.dataset.page);
        });

        // Bottom nav
        document.querySelector('.mobile-bottom-nav').addEventListener('click', function (e) {
          var item = e.target.closest('.bottom-nav-item');
          if (item && item.dataset.page) navigateTo(item.dataset.page);
        });
      }

      function updateSidebarUser(username) {
        var av = document.getElementById('sidebar-avatar'); if (av) av.textContent = username.charAt(0).toUpperCase();
        var un = document.getElementById('sidebar-username'); if (un) un.textContent = capitalize(username);
        var data = Auth.loadData(username);
        var si = document.getElementById('sidebar-since'); if (si && data && data.createdAt) si.textContent = 'Since ' + data.createdAt;
        var navCycle = document.getElementById('nav-cycle');
        if (navCycle) navCycle.style.display = (data && data.settings && data.settings.cycleEnabled) ? 'flex' : 'none';
      }

      function initSettings(username) {
        var su = document.getElementById('settings-username'); if (su) su.textContent = capitalize(username);
        var data = Auth.loadData(username);
        var cb = document.getElementById('cycle-toggle');
        if (cb) {
          cb.checked = !!(data && data.settings && data.settings.cycleEnabled);
          cb.addEventListener('change', function () {
            var d = Auth.loadData(username); if (!d.settings) d.settings = {};
            d.settings.cycleEnabled = cb.checked; Auth.saveData(username, d);
            var nav = document.getElementById('nav-cycle'); if (nav) nav.style.display = cb.checked ? 'flex' : 'none';
          });
        }
        document.getElementById('clear-data-btn').addEventListener('click', function () {
          if (!confirm('Clear ALL your tracking data? This cannot be undone.')) return;
          var d = Auth.loadData(username); var fresh = Auth.freshData(username); fresh._pw = d._pw;
          Auth.saveData(username, fresh);
          TaskModule.render(); WaterModule.render(); ExerciseModule.render(); StudyModule.render(); SleepModule.render(); refreshDashboard();
        });
        // Init theme picker swatches
        Themes.init();
      }

      function initLogout() {
        function show() { document.getElementById('logout-modal').classList.remove('hidden'); }
        function hide() { document.getElementById('logout-modal').classList.add('hidden'); }
        document.getElementById('logout-btn').addEventListener('click', show);
        document.getElementById('settings-logout').addEventListener('click', show);
        document.getElementById('modal-cancel').addEventListener('click', hide);
        document.getElementById('modal-confirm').addEventListener('click', function () { hide(); Auth.logout(); });
        document.getElementById('logout-modal').addEventListener('click', function (e) { if (e.target === this) hide(); });
      }

      function init(username) {
        if (initialized) destroy();
        initialized = true;
        updateSidebarUser(username);
        initSidebar(); initLogout(); initSettings(username);
        TaskModule.init(); WaterModule.init(); ExerciseModule.init();
        StudyModule.init(); SleepModule.init(); CycleModule.init(); Pomodoro.init();
        navigateTo('dashboard');
      }

      function destroy() {
        Pomodoro.destroy();
        if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
        initialized = false;
      }

      return { init: init, destroy: destroy, refreshDashboard: refreshDashboard };
    })();

    /* ══════════════════════════════════════
       BOOT
    ══════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', function () {
      Auth.init();
    });
