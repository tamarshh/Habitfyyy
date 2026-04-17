import { MONTHS } from './constants.js';
import { analyticsComputed, analyticsMethods } from './analytics.js';
import { timerComputed, timerMethods } from './timer.js';
import { storageMethods } from './storage.js';

const { createApp } = window.Vue;

createApp({
    data() {
        return {
            months: MONTHS,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            currentView: 'dashboard',
            mobileNavOpen: false,
            database: {},
            activeData: { dailyHabits: [], weeklyTasks: [[], [], [], [], []], notes: '', moods: [] },

            userStats: { xp: 0, level: 1, deepWorkMinutes: 0, deepWorkSessions: 0, deepWorkTotalSeconds: 0, deepWorkLog: [], activeDeepWork: null },
            profile: { name: 'Habitfy User', email: 'local@habitfy.app' },
            xpPerAction: 10,
            isInitializing: true,

            soundEnabled: true,
            isDarkMode: false,

            timerOpen: false,
            timerRunning: false,
            deepWorkTaskName: '',
            deepWorkElapsedSeconds: 0,
            deepWorkBaseSeconds: 0,
            deepWorkStartTs: null,
            timerInterval: null,

            selectedHabit: null,
            allTimeHabitStats: { totalCompletions: 0 },
            editingHabitIndex: null,
            editingWeeklyTask: { weekIndex: null, taskIndex: null },
            habitSearch: '',
            weeklySearch: '',
            habitSort: 'manual',
            undoStack: [],
            activityLog: [],

            saveTimeout: null,
            audioCtx: null,
            onKeydown: null,

            navSections: [
                {
                    title: 'MAIN',
                    items: [
                        { key: 'dashboard', label: 'Dashboard', icon: 'ph-squares-four' },
                        { key: 'daily-goals', label: 'Daily Goals', icon: 'ph-target' },
                        { key: 'deep-work', label: 'Deep Work', icon: 'ph-timer' }
                    ]
                },
                {
                    title: 'HABITS',
                    items: [
                        { key: 'daily', label: 'Daily Habits', icon: 'ph-calendar-check' },
                        { key: 'weekly', label: 'Weekly Habits', icon: 'ph-calendar-plus' },
                        { key: 'monthly', label: 'Monthly Habits', icon: 'ph-calendar-blank' },
                        { key: 'yearly', label: 'Yearly Overview', icon: 'ph-chart-line-up' }
                    ]
                },
                {
                    title: 'ACCOUNT',
                    items: [
                        { key: 'profile', label: 'My Profile', icon: 'ph-user-circle' },
                        { key: 'how', label: 'How To Use', icon: 'ph-question' },
                        { key: 'support', label: 'Support', icon: 'ph-lifebuoy' }
                    ]
                }
            ]
        };
    },
    computed: {
        years() {
            const now = new Date().getFullYear();
            const min = Math.min(now - 5, this.currentYear - 1);
            const max = Math.max(now + 5, this.currentYear + 1);
            const result = [];
            for (let y = min; y <= max; y++) result.push(y);
            return result;
        },
        currentMonthKey() {
            return `${this.currentYear}-${this.currentMonth}`;
        },
        daysInMonth() {
            return new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        },
        currentViewTitle() {
            const map = {
                dashboard: 'Dashboard',
                'daily-goals': 'Daily Goals',
                'deep-work': 'Deep Work',
                daily: 'Daily Habits',
                weekly: 'Weekly Habits',
                monthly: 'Monthly Habits',
                yearly: 'Yearly Overview',
                profile: 'My Profile',
                how: 'How To Use',
                support: 'Support'
            };
            return map[this.currentView] || 'Dashboard';
        },
        currentDateLabel() {
            return new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        },
        todayIndex() {
            const today = new Date();
            if (today.getMonth() !== this.currentMonth || today.getFullYear() !== this.currentYear) return -1;
            return today.getDate() - 1;
        },
        totalHabits() {
            return this.activeData?.dailyHabits?.length || 0;
        },
        doneToday() {
            if (this.todayIndex < 0 || !this.activeData?.dailyHabits) return 0;
            return this.activeData.dailyHabits.filter((h) => h.days[this.todayIndex]).length;
        },
        deepWorkMinutes() {
            const secs = Number(this.userStats?.deepWorkTotalSeconds);
            if (Number.isFinite(secs)) return Math.floor(Math.max(0, secs) / 60);
            const mins = Number(this.userStats?.deepWorkMinutes);
            return Number.isFinite(mins) ? Math.max(0, Math.floor(mins)) : 0;
        },
        deepWorkSessions() {
            const sessions = Number(this.userStats?.deepWorkSessions);
            return Number.isFinite(sessions) ? Math.max(0, Math.floor(sessions)) : 0;
        },
        deepWorkHoursLabel() {
            return (this.deepWorkMinutes / 60).toFixed(this.deepWorkMinutes % 60 === 0 ? 0 : 1);
        },
        avgHabitRate() {
            if (!this.totalHabits) return 0;
            let total = 0;
            this.activeData.dailyHabits.forEach((h) => {
                total += this.habitCompletedCount(h) / this.daysInMonth;
            });
            return Math.round((total / this.totalHabits) * 100);
        },
        filteredDailyHabits() {
            const query = this.habitSearch.trim().toLowerCase();
            if (!query) return this.activeData.dailyHabits;
            return this.activeData.dailyHabits.filter((habit) => (habit.name || '').toLowerCase().includes(query));
        },
        sortedDailyHabits() {
            const list = [...this.filteredDailyHabits];
            if (this.habitSort === 'name') {
                return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            }
            if (this.habitSort === 'high') {
                return list.sort((a, b) => this.habitCompletedCount(b) - this.habitCompletedCount(a));
            }
            if (this.habitSort === 'low') {
                return list.sort((a, b) => this.habitCompletedCount(a) - this.habitCompletedCount(b));
            }
            return list;
        },
        filteredWeeklyTasks() {
            const query = this.weeklySearch.trim().toLowerCase();
            if (!query) return this.activeData.weeklyTasks;
            return this.activeData.weeklyTasks.map((week) => week.filter((task) => (task.name || '').toLowerCase().includes(query)));
        },
        moodDays() {
            return Array.from({ length: this.daysInMonth }, (_, idx) => idx + 1);
        },
        moodLegend() {
            return [
                { value: 0, label: 'Focused', className: 'mood-calm' },
                { value: 1, label: 'Balanced', className: 'mood-cool' },
                { value: 2, label: 'High Energy', className: 'mood-warm' },
                { value: 3, label: 'Peak', className: 'mood-hot' }
            ];
        },
        maxStreak() {
            if (!this.activeData?.dailyHabits?.length) return 0;
            return Math.max(...this.activeData.dailyHabits.map((h) => this.calculateStreak(h)));
        },
        monthlyProgressSeries() {
            const values = [];
            for (let m = 0; m < 12; m++) {
                const key = `${this.currentYear}-${m}`;
                const data = this.database[key];
                if (!data?.dailyHabits?.length) {
                    values.push(0);
                    continue;
                }
                const monthDays = new Date(this.currentYear, m + 1, 0).getDate();
                let completed = 0;
                data.dailyHabits.forEach((h) => {
                    completed += (h.days || []).slice(0, monthDays).filter(Boolean).length;
                });
                const possible = data.dailyHabits.length * monthDays;
                values.push(possible ? Math.round((completed / possible) * 100) : 0);
            }
            return values;
        },
        yearlyGoalRows() {
            return (this.activeData.dailyHabits || []).slice(0, 3).map((h, index) => {
                const done = this.habitCompletedCount(h);
                const goal = h.goal || this.daysInMonth;
                return {
                    id: index + 1,
                    name: h.name || `Goal ${index + 1}`,
                    progress: Math.min(100, Math.round((done / Math.max(goal, 1)) * 100))
                };
            });
        },
        achievementBadges() {
            const badges = [];
            if (this.doneToday >= 3) badges.push({ label: 'Daily Starter', hint: 'Completed 3+ habits today' });
            if (this.maxStreak >= 7) badges.push({ label: 'Streak Pilot', hint: '7 day streak reached' });
            if (this.overallProgress >= 60) badges.push({ label: 'Consistency Core', hint: '60% monthly progress' });
            if (this.totalHabits >= 5) badges.push({ label: 'System Builder', hint: '5 active habits tracked' });
            if (!badges.length) badges.push({ label: 'Onboarding', hint: 'Add habits and complete today to unlock badges' });
            return badges;
        },
        ...analyticsComputed,
        ...timerComputed
    },
    methods: {
        ...storageMethods,
        ...analyticsMethods,
        ...timerMethods,
        setView(viewKey) {
            this.currentView = viewKey;
            this.mobileNavOpen = false;
        },
        completionBadgeClass(percent) {
            if (percent >= 75) return 'chip chip-success';
            if (percent >= 40) return 'chip chip-warning';
            return 'chip chip-muted';
        },
        startEditingHabit(index) {
            this.editingHabitIndex = index;
        },
        stopEditingHabit() {
            this.editingHabitIndex = null;
        },
        addActivity(message) {
            const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.activityLog.unshift(`${stamp} - ${message}`);
            if (this.activityLog.length > 12) this.activityLog.pop();
        },
        pushUndo(action) {
            this.undoStack.push(action);
            if (this.undoStack.length > 20) this.undoStack.shift();
        },
        undoLastAction() {
            const last = this.undoStack.pop();
            if (!last) return;

            if (last.type === 'removeHabit') {
                this.activeData.dailyHabits.splice(last.index, 0, last.habit);
                this.addActivity(`Undid delete for ${last.habit.name || 'habit'}`);
            } else if (last.type === 'clearHabit') {
                const habit = this.activeData.dailyHabits[last.index];
                if (habit) habit.days = [...last.days];
                this.addActivity(`Restored checks for ${habit?.name || 'habit'}`);
            } else if (last.type === 'removeTask') {
                if (!this.activeData.weeklyTasks[last.weekIndex]) this.activeData.weeklyTasks[last.weekIndex] = [];
                this.activeData.weeklyTasks[last.weekIndex].splice(last.taskIndex, 0, last.task);
                this.addActivity(`Undid delete for weekly task ${last.task.name || ''}`.trim());
            } else if (last.type === 'bulkToday') {
                this.activeData.dailyHabits.forEach((habit, index) => {
                    if (Array.isArray(last.prevValues[index]) && last.prevValues[index].length === habit.days.length) {
                        habit.days = [...last.prevValues[index]];
                    }
                });
                this.addActivity('Undid bulk today update');
            } else if (last.type === 'weekBulk') {
                if (Array.isArray(this.activeData.weeklyTasks[last.weekIndex])) {
                    this.activeData.weeklyTasks[last.weekIndex].forEach((task, idx) => {
                        if (typeof last.prevDone[idx] === 'boolean') task.done = last.prevDone[idx];
                    });
                }
                this.addActivity(`Undid week ${last.weekIndex + 1} bulk action`);
            }

            this.saveState();
        },
        removeHabit(index) {
            const removed = this.activeData.dailyHabits[index];
            if (!removed) return;
            this.pushUndo({
                type: 'removeHabit',
                index,
                habit: {
                    name: removed.name,
                    goal: removed.goal,
                    days: [...(removed.days || [])]
                }
            });
            this.activeData.dailyHabits.splice(index, 1);
            this.addActivity(`Deleted habit ${removed.name || 'Untitled Habit'}`);
            this.saveState();
        },
        getMoodClass(day) {
            const value = Number(this.activeData?.moods?.[day - 1]);
            if (value === 0) return 'mood-calm';
            if (value === 1) return 'mood-cool';
            if (value === 2) return 'mood-warm';
            if (value === 3) return 'mood-hot';
            return 'mood-empty';
        },
        getMoodLabel(day) {
            const value = Number(this.activeData?.moods?.[day - 1]);
            if (value === 0) return 'Focused';
            if (value === 1) return 'Balanced';
            if (value === 2) return 'High Energy';
            if (value === 3) return 'Peak';
            return 'Not set';
        },
        cycleMood(day) {
            if (!Array.isArray(this.activeData.moods)) this.activeData.moods = Array(this.daysInMonth).fill(-1);
            const idx = day - 1;
            const current = Number.isFinite(Number(this.activeData.moods[idx])) ? Number(this.activeData.moods[idx]) : -1;
            const next = current >= 3 ? -1 : current + 1;
            this.activeData.moods[idx] = next;
            this.saveState();
        },
        setTodayMood(value) {
            if (this.todayIndex < 0) return;
            if (!Array.isArray(this.activeData.moods)) this.activeData.moods = Array(this.daysInMonth).fill(-1);
            this.activeData.moods[this.todayIndex] = value;
            this.saveState();
        },
        clearHabit(index) {
            const habit = this.activeData.dailyHabits[index];
            if (!habit) return;
            this.pushUndo({
                type: 'clearHabit',
                index,
                days: [...habit.days]
            });
            habit.days = Array(this.daysInMonth).fill(false);
            this.addActivity(`Cleared checks for ${habit.name || 'habit'}`);
            this.saveState();
        },
        duplicateHabit(index) {
            const habit = this.activeData.dailyHabits[index];
            if (!habit) return;
            this.activeData.dailyHabits.splice(index + 1, 0, {
                name: `${habit.name || 'Untitled Habit'} Copy`,
                goal: habit.goal || this.daysInMonth,
                days: Array(this.daysInMonth).fill(false)
            });
            this.addActivity(`Duplicated ${habit.name || 'habit'}`);
            this.saveState();
        },
        removeWeeklyTask(weekIndex, taskIndex) {
            if (!this.activeData.weeklyTasks[weekIndex]) return;
            const task = this.activeData.weeklyTasks[weekIndex][taskIndex];
            if (!task) return;
            this.pushUndo({
                type: 'removeTask',
                weekIndex,
                taskIndex,
                task: { name: task.name, done: task.done }
            });
            this.activeData.weeklyTasks[weekIndex].splice(taskIndex, 1);
            this.addActivity(`Deleted weekly task ${task.name || ''}`.trim());
            this.saveState();
        },
        setAllToday(value) {
            if (this.todayIndex < 0 || !this.activeData.dailyHabits.length) return;
            const prevValues = this.activeData.dailyHabits.map((habit) => [...habit.days]);
            this.pushUndo({ type: 'bulkToday', prevValues });
            this.activeData.dailyHabits.forEach((habit) => {
                habit.days[this.todayIndex] = value;
            });
            this.addActivity(value ? 'Marked all habits done for today' : 'Cleared today for all habits');
            this.saveState();
        },
        markWeekTasks(weekIndex, value) {
            const week = this.activeData.weeklyTasks[weekIndex];
            if (!Array.isArray(week) || !week.length) return;
            this.pushUndo({
                type: 'weekBulk',
                weekIndex,
                prevDone: week.map((task) => !!task.done)
            });
            week.forEach((task) => {
                task.done = value;
            });
            this.addActivity(`${value ? 'Completed' : 'Reset'} all tasks in week ${weekIndex + 1}`);
            this.saveState();
        },
        startEditingWeeklyTask(weekIndex, taskIndex) {
            this.editingWeeklyTask = { weekIndex, taskIndex };
        },
        stopEditingWeeklyTask() {
            this.editingWeeklyTask = { weekIndex: null, taskIndex: null };
        },
        saveProfile() {
            this.saveState(true);
        },
        toggleMobileNav() {
            this.mobileNavOpen = !this.mobileNavOpen;
        },
        handleGlobalKeydown(e) {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undoLastAction();
                return;
            }

            if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                const viewMap = {
                    '1': 'dashboard',
                    '2': 'daily-goals',
                    '3': 'deep-work',
                    '4': 'daily',
                    '5': 'weekly',
                    '6': 'monthly',
                    '7': 'yearly',
                    '8': 'profile'
                };
                if (viewMap[e.key]) {
                    e.preventDefault();
                    this.setView(viewMap[e.key]);
                    return;
                }
            }

            if (e.key === 'Escape') {
                if (this.selectedHabit) this.closeModal();
                this.timerOpen = false;
                this.mobileNavOpen = false;
            }
        },
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            if (this.isDarkMode) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            this.saveState(true);
        },
        jumpToToday() {
            this.currentMonth = new Date().getMonth();
            this.currentYear = new Date().getFullYear();
        },
        addXP(amount) {
            this.userStats.xp += amount;
            if (this.userStats.xp >= this.xpToNextLevel) {
                this.userStats.xp -= this.xpToNextLevel;
                this.userStats.level++;
                this.fireMassiveConfetti();
                setTimeout(() => alert(`Level Up! You are now a Level ${this.userLevel} ${this.rankTitle}!`), 500);
            }
            this.saveState();
        },
        removeXP(amount) {
            this.userStats.xp = Math.max(0, this.userStats.xp - amount);
            this.saveState();
        },
        checkPerfectDay(day) {
            if (this.activeData.dailyHabits.length === 0) return;
            const allDone = this.activeData.dailyHabits.every((h) => h.days[day - 1] === true);
            if (allDone) {
                setTimeout(() => {
                    this.fireMassiveConfetti();
                }, 300);
            }
        },
        handleCheck(event, habit, day) {
            const dayIndex = day - 1;
            if (!habit || !Array.isArray(habit.days) || dayIndex < 0 || dayIndex >= habit.days.length) return;

            const isChecked = Boolean(event?.target?.checked);
            habit.days[dayIndex] = isChecked;

            if (isChecked) {
                this.playPopSound();
                confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
                this.addXP(this.xpPerAction);
                this.checkPerfectDay(day);
            } else {
                this.removeXP(this.xpPerAction);
            }
        },
        handleTaskCheck(event) {
            if (event.target.checked) {
                this.playPopSound();
                confetti({ particleCount: 20, spread: 30, origin: { y: 0.9 } });
                this.addXP(15);
            } else {
                this.removeXP(15);
            }
        },
        addDailyHabit() {
            this.activeData.dailyHabits.push({
                name: '',
                goal: this.daysInMonth,
                days: Array(this.daysInMonth).fill(false)
            });
            this.addActivity('Added a new daily habit');
            this.saveState();
        },
        addWeeklyTask(wIndex) {
            if (!this.activeData.weeklyTasks[wIndex]) this.activeData.weeklyTasks[wIndex] = [];
            this.activeData.weeklyTasks[wIndex].push({ name: '', done: false });
            this.addActivity(`Added task in week ${wIndex + 1}`);
            this.saveState();
        }
    },
    watch: {
        currentMonthKey(newKey, oldKey) {
            if (!this.isInitializing) {
                this.saveState(true, oldKey);
                this.loadOrGenerateMonthData();
            }
        },
        activeData: {
            handler() {
                this.saveState();
            },
            deep: true
        }
    },
    mounted() {
        document.documentElement.classList.add('dark');
        this.isDarkMode = true;
        this.onKeydown = (e) => this.handleGlobalKeydown(e);
        document.addEventListener('keydown', this.onKeydown);
        this.loadState();
        if (typeof this.hydrateDeepWorkRuntime === 'function') this.hydrateDeepWorkRuntime();
    },
    beforeUnmount() {
        if (this.onKeydown) document.removeEventListener('keydown', this.onKeydown);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
    }
}).mount('#app');
