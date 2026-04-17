export const WeeklyPanels = {
    name: 'WeeklyPanels',
    props: {
        weeksArray: Array,
        activeData: Object,
        totalWeeklyTasksDone: Number,
        totalWeeklyTasks: Number,
        getTextColor: Function,
        getWeekHexColor: Function,
        getWeekPercentage: Function,
        handleTaskCheck: Function,
        addWeeklyTask: Function
    },
    template: `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div class="md:col-span-8 glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">Weekly Diagnostics</h2>
            </div>
            <div class="flex-1 p-6 flex justify-around items-center">
                <div v-for="(week, wIndex) in weeksArray" :key="'wdonut-'+wIndex" class="flex flex-col items-center gap-3">
                    <div class="relative w-16 h-16">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path class="stroke-slate-200 dark:stroke-slate-700" stroke-width="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path :stroke="getWeekHexColor(wIndex)" stroke-width="4" :stroke-dasharray="getWeekPercentage(wIndex) + ', 100'" stroke-linecap="round" fill="none" class="transition-all duration-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200">{{ getWeekPercentage(wIndex) }}%</div>
                    </div>
                    <span class="text-xs font-bold uppercase tracking-wider" :class="getTextColor(wIndex)">W{{wIndex + 1}}</span>
                </div>
            </div>
        </div>

        <div class="md:col-span-4 glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
             <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">Weekly To-Dos</h2>
                <span class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{{ totalWeeklyTasksDone }}/{{ totalWeeklyTasks }}</span>
            </div>
            <div class="p-4 flex-1 overflow-y-auto max-h-[200px] space-y-4">
                <div v-for="(weekTasks, wIndex) in activeData.weeklyTasks" :key="'wt-'+wIndex">
                    <h3 class="text-[10px] font-bold uppercase tracking-widest mb-2" :class="getTextColor(wIndex)">Week {{wIndex + 1}}</h3>
                    <div class="space-y-2">
                        <div v-for="(task, tIndex) in weekTasks" :key="'t-'+tIndex" class="flex items-center gap-2">
                            <input type="checkbox" v-model="task.done" @change="handleTaskCheck($event)" class="chk-base" :class="'chk-w' + wIndex">
                            <input type="text" v-model="task.name" placeholder="Task..." class="text-sm font-medium text-slate-600 dark:text-slate-300 w-full" :class="{'line-through opacity-50': task.done}">
                        </div>
                        <button @click="addWeeklyTask(wIndex)" class="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-500 transition">+ Add Task</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
