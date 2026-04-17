export const HeaderBar = {
    name: 'HeaderBar',
    props: {
        userLevel: Number,
        rankTitle: String,
        userXP: Number,
        xpToNextLevel: Number,
        levelProgress: Number,
        months: Array,
        years: Array,
        currentMonth: Number,
        currentYear: Number,
        isDarkMode: Boolean,
        soundEnabled: Boolean
    },
    emits: ['update:currentMonth', 'update:currentYear', 'jump-to-today', 'toggle-theme', 'toggle-sound', 'export-data', 'import-data'],
    methods: {
        onMonthChange(event) {
            this.$emit('update:currentMonth', Number(event.target.value));
        },
        onYearChange(event) {
            this.$emit('update:currentYear', Number(event.target.value));
        }
    },
    template: `
    <header class="glass-panel rounded-2xl shadow-sm p-5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-4 w-full md:w-1/3">
            <div class="relative">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                    Lvl {{ userLevel }}
                </div>
            </div>
            <div class="flex-1">
                <h1 class="text-lg font-extrabold tracking-tight dark:text-white">{{ rankTitle }}</h1>
                <div class="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 mb-1">
                    <span>XP: {{ userXP }}</span>
                    <span>Next: {{ xpToNextLevel }}</span>
                </div>
                <div class="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-700 ease-out" :style="{ width: levelProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <div class="flex gap-2">
            <div class="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <select :value="currentMonth" @change="onMonthChange" class="bg-transparent font-bold text-slate-700 dark:text-slate-300 px-3 py-1 outline-none cursor-pointer">
                    <option v-for="(m, i) in months" :key="'m-' + i" :value="i">{{ m }}</option>
                </select>
                <div class="w-px bg-slate-300 dark:bg-slate-600 my-1 mx-1"></div>
                <select :value="currentYear" @change="onYearChange" class="bg-transparent font-bold text-slate-700 dark:text-slate-300 px-3 py-1 outline-none cursor-pointer">
                    <option v-for="y in years" :key="'y-' + y" :value="y">{{ y }}</option>
                </select>
            </div>
            <button @click="$emit('jump-to-today')" class="px-4 py-2 bg-slate-800 dark:bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-slate-700 dark:hover:bg-indigo-500 transition shadow-md">
                Today
            </button>
        </div>

        <div class="flex gap-2 w-full md:w-auto justify-end items-center">
            <button @click="$emit('toggle-theme')" class="p-2.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
                <i class="ph text-xl" :class="isDarkMode ? 'ph-sun' : 'ph-moon'"></i>
            </button>
            <button @click="$emit('toggle-sound')" class="p-2.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
                <i class="ph text-xl" :class="soundEnabled ? 'ph-speaker-high' : 'ph-speaker-slash'"></i>
            </button>
            <div class="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button @click="$emit('export-data')" class="p-2.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition" title="Backup Data">
                <i class="ph ph-download-simple text-xl"></i>
            </button>
            <label class="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer" title="Restore Data">
                <i class="ph ph-upload-simple text-xl"></i>
                <input type="file" accept=".json" @change="$emit('import-data', $event)" class="hidden">
            </label>
        </div>
    </header>
    `
};
