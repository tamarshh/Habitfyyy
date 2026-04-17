export const HabitModal = {
    name: 'HabitModal',
    props: {
        selectedHabit: Object,
        allTimeHabitStats: Object,
        habitCompletedCount: Function,
        calculateStreak: Function
    },
    emits: ['close-modal'],
    template: `
    <Transition name="modal">
        <div v-if="selectedHabit" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Transition name="modal-scale" appear>
                <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden" @click.stop>
                    <div class="bg-indigo-600 p-6 text-white flex justify-between items-start">
                        <div>
                            <div class="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Deep Dive Analytics</div>
                            <h2 class="text-2xl font-bold leading-tight">{{ selectedHabit.name }}</h2>
                        </div>
                        <button @click="$emit('close-modal')" class="text-indigo-200 hover:text-white bg-indigo-500/30 hover:bg-indigo-500/50 p-2 rounded-full transition">
                            <i class="ph ph-x text-xl"></i>
                        </button>
                    </div>

                    <div class="p-6 grid grid-cols-2 gap-4">
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">This Month</div>
                            <div class="text-3xl font-black text-slate-800 dark:text-white">{{ habitCompletedCount(selectedHabit) }} <span class="text-sm font-medium text-slate-500">days</span></div>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Streak</div>
                            <div class="text-3xl font-black text-orange-500">{{ calculateStreak(selectedHabit) }} <span class="text-sm font-medium text-slate-500">days</span></div>
                        </div>
                        <div class="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-center justify-between">
                            <div>
                                <div class="text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">All-Time Database Total</div>
                                <div class="text-4xl font-black text-blue-700 dark:text-blue-300">{{ allTimeHabitStats.totalCompletions }} <span class="text-base font-semibold opacity-70">lifetimes</span></div>
                            </div>
                            <div class="text-right">
                                <div class="text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Record</div>
                                <div class="text-xl font-bold text-blue-700 dark:text-blue-300"><i class="ph-fill ph-trophy text-amber-500"></i> Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
    `
};
