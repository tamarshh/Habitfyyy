import { getDefaultHabitsTemplate, getDefaultWeeklyTasksTemplate } from './constants.js';

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export const storageMethods = {
    normalizeUserStats(userStats) {
        const xp = Number.isFinite(Number(userStats?.xp)) ? Math.max(0, Math.floor(Number(userStats.xp))) : 0;
        const level = Number.isFinite(Number(userStats?.level)) ? Math.max(1, Math.floor(Number(userStats.level))) : 1;
        const deepWorkMinutes = Number.isFinite(Number(userStats?.deepWorkMinutes)) ? Math.max(0, Math.floor(Number(userStats.deepWorkMinutes))) : 0;
        const deepWorkSessions = Number.isFinite(Number(userStats?.deepWorkSessions)) ? Math.max(0, Math.floor(Number(userStats.deepWorkSessions))) : 0;
        const deepWorkTotalSeconds = Number.isFinite(Number(userStats?.deepWorkTotalSeconds))
            ? Math.max(0, Math.floor(Number(userStats.deepWorkTotalSeconds)))
            : deepWorkMinutes * 60;

        const deepWorkLog = Array.isArray(userStats?.deepWorkLog)
            ? userStats.deepWorkLog
                .map((item, idx) => {
                    const seconds = Math.max(0, Math.floor(Number(item?.seconds) || 0));
                    if (seconds <= 0) return null;
                    return {
                        id: typeof item?.id === 'string' ? item.id : `legacy-${Date.now()}-${idx}`,
                        name: typeof item?.name === 'string' && item.name.trim() ? item.name.trim() : 'General',
                        seconds,
                        startedAt: Number.isFinite(Number(item?.startedAt)) ? Number(item.startedAt) : 0,
                        endedAt: Number.isFinite(Number(item?.endedAt)) ? Number(item.endedAt) : 0
                    };
                })
                .filter(Boolean)
            : [];

        const activeDeepWork = userStats?.activeDeepWork && typeof userStats.activeDeepWork === 'object'
            ? {
                name: typeof userStats.activeDeepWork.name === 'string' ? userStats.activeDeepWork.name : 'General',
                startedAt: Number.isFinite(Number(userStats.activeDeepWork.startedAt)) ? Number(userStats.activeDeepWork.startedAt) : 0,
                baseSeconds: Number.isFinite(Number(userStats.activeDeepWork.baseSeconds)) ? Math.max(0, Math.floor(Number(userStats.activeDeepWork.baseSeconds))) : 0
            }
            : null;

        return {
            xp,
            level,
            deepWorkMinutes,
            deepWorkSessions,
            deepWorkTotalSeconds,
            deepWorkLog,
            activeDeepWork
        };
    },
    normalizeMonthData(monthData, daysInMonth) {
        const safeDays = Number.isFinite(daysInMonth) ? daysInMonth : this.daysInMonth;
        const dailyHabits = Array.isArray(monthData?.dailyHabits)
            ? monthData.dailyHabits.map((h) => ({
                name: typeof h?.name === 'string' ? h.name : '',
                goal: Number.isFinite(Number(h?.goal)) ? Number(h.goal) : safeDays,
                days: Array.from({ length: safeDays }, (_, i) => Boolean(h?.days?.[i]))
            }))
            : [];

        const rawWeekly = Array.isArray(monthData?.weeklyTasks) ? monthData.weeklyTasks : [];
        const weeklyTasks = Array.from({ length: 5 }, (_, w) => {
            const week = Array.isArray(rawWeekly[w]) ? rawWeekly[w] : [];
            return week.map((t) => ({
                name: typeof t?.name === 'string' ? t.name : '',
                done: Boolean(t?.done)
            }));
        });

        return {
            dailyHabits,
            weeklyTasks,
            notes: typeof monthData?.notes === 'string' ? monthData.notes : '',
            moods: Array.from({ length: safeDays }, (_, i) => {
                const val = Number(monthData?.moods?.[i]);
                return Number.isFinite(val) && val >= -1 && val <= 3 ? val : -1;
            })
        };
    },
    normalizeDatabase(rawDatabase) {
        const safeDb = {};
        if (!rawDatabase || typeof rawDatabase !== 'object') return safeDb;

        Object.entries(rawDatabase).forEach(([key, value]) => {
            const parts = key.split('-');
            if (parts.length !== 2) return;

            const y = Number(parts[0]);
            const m = Number(parts[1]);
            if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11) return;

            const monthDays = new Date(y, m + 1, 0).getDate();
            safeDb[key] = this.normalizeMonthData(value, monthDays);
        });

        return safeDb;
    },
    generateBlankTemplate() {
        let templateHabits = getDefaultHabitsTemplate();
        const templateWeeks = getDefaultWeeklyTasksTemplate();

        const keys = Object.keys(this.database);
        if (keys.length > 0) {
            const latestKey = keys.sort((a, b) => {
                const [yA, mA] = a.split('-');
                const [yB, mB] = b.split('-');
                return new Date(yB, mB) - new Date(yA, mA);
            })[0];
            const recentData = this.database[latestKey];
            if (recentData?.dailyHabits?.length > 0) {
                templateHabits = recentData.dailyHabits.map((h) => ({ name: h.name, goal: h.goal }));
            }
        }

        return {
            dailyHabits: templateHabits.map((h) => ({ ...h, days: Array(this.daysInMonth).fill(false) })),
            weeklyTasks: templateWeeks,
            notes: '',
            moods: Array(this.daysInMonth).fill(-1)
        };
    },
    loadOrGenerateMonthData() {
        const key = this.currentMonthKey;
        if (this.database[key]) this.activeData = this.normalizeMonthData(this.database[key], this.daysInMonth);
        else this.activeData = this.generateBlankTemplate();
    },
    persistState(targetKey = this.currentMonthKey) {
        this.database[targetKey] = deepClone(this.activeData);
        localStorage.setItem('focusOS_DB', JSON.stringify({
            database: this.database,
            userStats: this.userStats,
            profile: this.profile,
            settings: { isDarkMode: this.isDarkMode }
        }));
    },
    saveState(immediate = false, targetKey = this.currentMonthKey) {
        if (this.isInitializing) return;

        if (immediate) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
            this.persistState(targetKey);
            return;
        }

        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        const keySnapshot = targetKey;
        this.saveTimeout = setTimeout(() => {
            this.persistState(keySnapshot);
            this.saveTimeout = null;
        }, 250);
    },
    loadState() {
        const saved = localStorage.getItem('focusOS_DB');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.database = this.normalizeDatabase(parsed.database);
                this.userStats = this.normalizeUserStats(parsed.userStats);
                this.profile = {
                    name: typeof parsed?.profile?.name === 'string' ? parsed.profile.name : this.profile.name,
                    email: typeof parsed?.profile?.email === 'string' ? parsed.profile.email : this.profile.email
                };
                this.isDarkMode = Boolean(parsed?.settings?.isDarkMode);
                if (this.isDarkMode) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
            } catch (error) {
                localStorage.removeItem('focusOS_DB');
                this.database = {};
                this.userStats = { xp: 0, level: 1, deepWorkMinutes: 0, deepWorkSessions: 0, deepWorkTotalSeconds: 0, deepWorkLog: [], activeDeepWork: null };
                this.isDarkMode = false;
                document.documentElement.classList.remove('dark');
            }
        }

        this.jumpToToday();
        this.loadOrGenerateMonthData();
        this.isInitializing = false;
    },
    exportData() {
        const payload = {
            database: this.database,
            userStats: this.userStats,
            profile: this.profile,
            settings: { isDarkMode: this.isDarkMode }
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', 'FocusOS_Backup.json');
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
    },
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported || typeof imported !== 'object') throw new Error('Invalid data file.');

                this.database = this.normalizeDatabase(imported.database);
                this.userStats = this.normalizeUserStats(imported.userStats);
                this.profile = {
                    name: typeof imported?.profile?.name === 'string' ? imported.profile.name : this.profile.name,
                    email: typeof imported?.profile?.email === 'string' ? imported.profile.email : this.profile.email
                };
                this.isDarkMode = Boolean(imported?.settings?.isDarkMode);

                if (this.isDarkMode) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');

                this.saveState(true);
                this.loadOrGenerateMonthData();
                alert('Data successfully restored!');
            } catch (err) {
                alert('Error reading file.');
            } finally {
                event.target.value = '';
                this.profile = { name: 'Habitfy User', email: 'local@habitfy.app' };
            }
        };

        reader.readAsText(file);
    }
};
