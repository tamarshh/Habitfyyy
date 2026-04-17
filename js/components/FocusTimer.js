export const FocusTimer = {
    name: 'FocusTimer',
    props: {
        timerOpen: Boolean,
        timerMode: String,
        formattedTime: String,
        timerRunning: Boolean
    },
    emits: ['update:timerOpen', 'toggle-timer', 'reset-timer', 'switch-mode'],
    methods: {
        expandTimer() {
            if (!this.timerOpen) this.$emit('update:timerOpen', true);
        },
        collapseTimer() {
            if (this.timerOpen) this.$emit('update:timerOpen', false);
        }
    },
    template: `
    <div class="fixed bottom-6 right-6 glass-panel rounded-2xl shadow-2xl w-72 overflow-hidden z-40 transition-all duration-300 border border-slate-200 dark:border-slate-700" :class="timerOpen ? 'h-48' : 'h-14 cursor-pointer'" @click="expandTimer">
        <div class="bg-slate-800 dark:bg-slate-900 text-white p-4 flex justify-between items-center h-14" :class="{'cursor-pointer hover:bg-slate-700 dark:hover:bg-slate-800': timerOpen}" @click="collapseTimer">
            <div class="flex items-center gap-2">
                <i class="ph text-xl" :class="timerMode === 'focus' ? 'ph-brain' : 'ph-coffee'"></i>
                <span class="font-bold text-sm tracking-wide">{{ timerMode === 'focus' ? 'Deep Work' : 'Short Break' }}</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-mono font-bold text-lg tracking-wider" v-if="!timerOpen">{{ formattedTime }}</span>
                <i class="ph text-slate-400 hover:text-white transition" :class="timerOpen ? 'ph-caret-down' : 'ph-caret-up'"></i>
            </div>
        </div>
        <div class="p-4 flex flex-col items-center justify-center h-[136px] bg-white/50 dark:bg-slate-800/50">
            <div class="text-4xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-widest mb-3">
                {{ formattedTime }}
            </div>
            <div class="flex gap-2">
                <button @click.stop="$emit('toggle-timer')" class="px-6 py-2 rounded-xl font-bold text-sm text-white transition-colors shadow-md" :class="timerRunning ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'">
                    {{ timerRunning ? 'PAUSE' : 'START' }}
                </button>
                <button @click.stop="$emit('reset-timer')" class="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors">
                    <i class="ph-fill ph-arrow-counter-clockwise text-lg"></i>
                </button>
                <button @click.stop="$emit('switch-mode')" class="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors" title="Switch Mode">
                    <i class="ph-fill ph-swap text-lg"></i>
                </button>
            </div>
        </div>
    </div>
    `
};
