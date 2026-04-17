import { HABIT_BG_COLORS, HABIT_COLORS, RANKS, WEEK_HEX_COLORS } from './constants.js';

export const analyticsComputed = {
    weeksArray() {
        const weeks = [];
        let currentWeekDays = [];
        for (let d = 1; d <= this.daysInMonth; d++) {
            currentWeekDays.push(d);
            if (currentWeekDays.length === 7 || d === this.daysInMonth) {
                weeks.push({ days: currentWeekDays });
                currentWeekDays = [];
            }
        }
        return weeks;
    },
    userLevel() { return this.userStats.level; },
    userXP() { return this.userStats.xp; },
    xpToNextLevel() { return this.userStats.level * 100; },
    levelProgress() { return Math.min(100, (this.userXP / this.xpToNextLevel) * 100); },
    rankTitle() {
        return RANKS[Math.min(this.userLevel - 1, RANKS.length - 1)];
    },
    totalHabitsCompleted() {
        if (!this.activeData.dailyHabits) return 0;
        return this.activeData.dailyHabits.reduce((total, h) => total + h.days.filter(Boolean).length, 0);
    },
    overallProgress() {
        if (!this.activeData.dailyHabits || this.activeData.dailyHabits.length === 0) return 0;
        const totalPossible = this.activeData.dailyHabits.length * this.daysInMonth;
        return totalPossible === 0 ? 0 : Math.round((this.totalHabitsCompleted / totalPossible) * 100);
    },
    chartPolygon() {
        if (!this.activeData.dailyHabits || this.activeData.dailyHabits.length === 0) return '0,100 100,100';
        let points = '0,100 ';
        const widthStep = this.daysInMonth > 1 ? 100 / (this.daysInMonth - 1) : 100;
        for (let d = 1; d <= this.daysInMonth; d++) {
            const doneCount = this.activeData.dailyHabits.filter((h) => h.days[d - 1]).length;
            const percent = doneCount / this.activeData.dailyHabits.length;
            const x = (d - 1) * widthStep;
            const y = 100 - percent * 90;
            points += `${x},${y} `;
        }
        points += '100,100';
        return points;
    },
    totalWeeklyTasks() {
        if (!this.activeData.weeklyTasks) return 0;
        return this.activeData.weeklyTasks.flat().length;
    },
    totalWeeklyTasksDone() {
        if (!this.activeData.weeklyTasks) return 0;
        return this.activeData.weeklyTasks.flat().filter((t) => t.done).length;
    },
    smartInsight() {
        if (this.isInitializing || !this.activeData.dailyHabits || this.activeData.dailyHabits.length === 0) {
            return 'Ready to build some momentum? Add a habit below!';
        }

        const todayDate = new Date().getDate();
        if (this.currentMonth !== new Date().getMonth() || this.currentYear !== new Date().getFullYear()) {
            return 'You are viewing a past or future log. History is written here.';
        }

        let highestStreak = 0;
        let bestHabit = null;
        let strugglingHabit = null;
        let maxMisses = 0;

        this.activeData.dailyHabits.forEach((habit) => {
            const streak = this.calculateStreak(habit);
            if (streak > highestStreak) {
                highestStreak = streak;
                bestHabit = habit.name;
            }
            let misses = 0;
            for (let i = todayDate - 1; i >= Math.max(0, todayDate - 3); i--) {
                if (habit.days[i] === false) misses++;
            }
            if (misses > maxMisses) {
                maxMisses = misses;
                strugglingHabit = habit.name;
            }
        });

        if (highestStreak >= 5) return `🔥 You are unstoppable! Your ${highestStreak}-day streak on '${bestHabit}' is incredible.`;
        if (highestStreak >= 3) return `🚀 Great momentum! Keep up the work on '${bestHabit}'.`;
        if (maxMisses >= 2 && strugglingHabit) return `💡 Don't forget about '${strugglingHabit}'. Doing just 5 minutes today counts!`;
        if (this.overallProgress > 50) return "📈 You're over halfway to your monthly goals. Keep pushing!";
        return "A new day, a new opportunity to build your streak. Let's focus!";
    }
};

export const analyticsMethods = {
    openHabitModal(habit) {
        this.selectedHabit = habit;
        let allTimeTotal = 0;
        const habitName = habit.name.toLowerCase().trim();

        Object.values(this.database).forEach((monthData) => {
            if (monthData.dailyHabits) {
                const matchedHabit = monthData.dailyHabits.find((h) => h.name.toLowerCase().trim() === habitName);
                if (matchedHabit) allTimeTotal += matchedHabit.days.filter(Boolean).length;
            }
        });

        this.allTimeHabitStats.totalCompletions = allTimeTotal;
    },
    closeModal() {
        this.selectedHabit = null;
    },
    habitCompletedCount(habit) {
        if (!habit.days) return 0;
        return habit.days.slice(0, this.daysInMonth).filter(Boolean).length;
    },
    calculateStreak(habit) {
        let streak = 0;
        let maxDay = this.daysInMonth - 1;
        const today = new Date();
        if (today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear) {
            maxDay = today.getDate() - 1;
        }
        for (let i = maxDay; i >= 0; i--) {
            if (habit.days[i]) streak++;
            else if (i !== maxDay) break;
        }
        return streak;
    },
    getWeekPercentage(wIndex) {
        if (!this.activeData.dailyHabits) return 0;
        const startDay = wIndex * 7;
        const endDay = Math.min(startDay + 7, this.daysInMonth);
        const daysInWeek = endDay - startDay;
        if (daysInWeek <= 0) return 0;

        const possible = this.activeData.dailyHabits.length * daysInWeek;
        let completed = 0;
        this.activeData.dailyHabits.forEach((h) => {
            completed += h.days.slice(startDay, endDay).filter(Boolean).length;
        });

        return possible === 0 ? 0 : Math.round((completed / possible) * 100);
    },
    getWeekIndex(day) { return Math.floor((day - 1) / 7); },
    getWeekChk(day) { return `chk-w${this.getWeekIndex(day) % 5}`; },
    getTextColor(wIndex) { return `text-w${wIndex % 5}`; },
    getHabitColor(index) { return HABIT_COLORS[index % HABIT_COLORS.length]; },
    getHabitBgColor(index) { return HABIT_BG_COLORS[index % HABIT_BG_COLORS.length]; },
    getWeekHexColor(wIndex) { return WEEK_HEX_COLORS[wIndex % WEEK_HEX_COLORS.length]; },
    isToday(day) {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear;
    }
};
