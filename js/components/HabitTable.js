export const HabitTable = {
    name: 'HabitTable',
    props: {
        activeData: Object,
        daysInMonth: Number,
        months: Array,
        currentMonth: Number,
        weeksArray: Array,
        getTextColor: Function,
        isToday: Function,
        openHabitModal: Function,
        getHabitColor: Function,
        getWeekChk: Function,
        handleCheck: Function,
        calculateStreak: Function,
        getHabitBgColor: Function,
        habitCompletedCount: Function,
        addDailyHabit: Function
    },
    template: `
    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden relative">
        <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse" style="min-width: 1200px;">
                <thead>
                    <tr class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th class="p-4 text-left font-extrabold text-slate-800 dark:text-slate-100 w-[300px] sticky left-0 bg-slate-50 dark:bg-slate-900 z-20 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Mission Control</th>
                        <th v-for="(week, wIndex) in weeksArray" :key="'wh-'+wIndex" :colspan="week.days.length" class="py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200 dark:border-slate-800" :class="getTextColor(wIndex)">Week {{ wIndex + 1 }}</th>
                        <th class="p-4 w-48 text-left font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 sticky right-0 z-20 border-l border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">Completion</th>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                        <td class="p-2 sticky left-0 bg-white dark:bg-slate-800 z-20 border-r border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"><span class="pl-2">{{ daysInMonth }} Days in {{ months[currentMonth] }}</span></td>
                        <td v-for="day in daysInMonth" :key="'d-'+day" class="text-center py-2 border-r border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 w-10" :class="{'today-col text-blue-600 dark:text-blue-400': isToday(day)}">{{ day }}</td>
                        <td class="bg-white dark:bg-slate-800 sticky right-0 z-20 border-l border-slate-200 dark:border-slate-800 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]"></td>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="(habit, hIndex) in activeData.dailyHabits" :key="'h-'+hIndex" class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td class="p-3 sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-700 z-10 border-r border-slate-200 dark:border-slate-800 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-colors">
                            <div class="flex items-center gap-3">
                                <button @click="openHabitModal(habit)" class="p-1 text-slate-300 hover:text-indigo-500 transition-colors tooltip-trigger" title="View Analytics">
                                    <i class="ph-fill ph-chart-polar text-lg"></i>
                                </button>
                                <div class="w-1.5 h-6 rounded-full" :class="getHabitColor(hIndex)"></div>
                                <input type="text" v-model="habit.name" placeholder="Define a new goal..." class="font-bold text-slate-700 dark:text-slate-200 text-[13px]">
                            </div>
                        </td>

                        <td v-for="day in daysInMonth" :key="'chk-'+day" class="text-center py-2 border-r border-slate-100 dark:border-slate-800" :class="{'today-col': isToday(day)}">
                            <div class="flex justify-center relative">
                                <input type="checkbox" v-model="habit.days[day-1]" @change="handleCheck($event, habit, day)" class="chk-base" :class="getWeekChk(day)">
                            </div>
                        </td>

                        <td class="p-3 sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-700 z-10 border-l border-slate-200 dark:border-slate-800 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] transition-colors">
                            <div class="flex items-center gap-3 pr-2">
                                <div class="flex items-center justify-center w-10 gap-1 rounded-md font-bold text-xs" :class="calculateStreak(habit) >= 3 ? 'text-orange-500' : 'text-slate-400'">
                                    <i class="ph-fill ph-fire" v-if="calculateStreak(habit) >= 3"></i>
                                    {{ calculateStreak(habit) }}
                                </div>
                                <div class="flex-1 bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div class="h-full transition-all duration-700 ease-out" :class="getHabitBgColor(hIndex)" :style="{ width: (habitCompletedCount(habit)/(habit.goal || daysInMonth))*100 + '%' }"></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button @click="addDailyHabit" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <i class="ph ph-plus-circle text-lg"></i> Append Goal
            </button>
            <span class="text-xs font-semibold text-slate-400">+10 XP per completion</span>
        </div>
    </div>
    `
};
