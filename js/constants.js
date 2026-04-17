export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const RANKS = [
    'Novice Tracker',
    'Habit Apprentice',
    'Consistency Adept',
    'Focus Warrior',
    'Productivity Ninja',
    'Zen Master',
    'Unstoppable Force'
];

export const HABIT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500'];
export const HABIT_BG_COLORS = ['bg-indigo-400', 'bg-emerald-400', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-400', 'bg-purple-400'];
export const WEEK_HEX_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export function getDefaultHabitsTemplate() {
    return [
        { name: 'GATE Prep (COA/DBMS)', goal: 31 },
        { name: 'Aptitude Practice', goal: 25 },
        { name: 'Spoken English Practice', goal: 31 },
        { name: 'Attendance Tracker Dev', goal: 20 }
    ];
}

export function getDefaultWeeklyTasksTemplate() {
    return [
        [{ name: 'Take Full Mock Test', done: false }],
        [{ name: 'Review College Attendance', done: false }],
        [],
        [],
        []
    ];
}
