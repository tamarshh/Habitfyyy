export const InsightBriefing = {
    name: 'InsightBriefing',
    props: {
        smartInsight: String
    },
    template: `
    <div class="glass-panel rounded-xl p-4 flex items-center gap-4 shadow-sm border-l-4 border-l-blue-500">
        <div class="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
            <i class="ph-fill ph-robot text-2xl"></i>
        </div>
        <div>
            <h3 class="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-0.5">AI Daily Briefing</h3>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ smartInsight }}</p>
        </div>
    </div>
    `
};
