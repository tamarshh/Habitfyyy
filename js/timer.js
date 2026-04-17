export const timerComputed = {
    formattedTime() {
        const total = Math.max(0, Math.floor(Number(this.deepWorkElapsedSeconds) || 0));
        const hrs = Math.floor(total / 3600).toString().padStart(2, '0');
        const mins = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
        const secs = (total % 60).toString().padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    },
    recentDeepWorkSessions() {
        const log = Array.isArray(this.userStats?.deepWorkLog) ? this.userStats.deepWorkLog : [];
        return [...log]
            .sort((a, b) => Number(b.endedAt || 0) - Number(a.endedAt || 0))
            .slice(0, 6);
    },
    deepWorkByTopic() {
        const log = Array.isArray(this.userStats?.deepWorkLog) ? this.userStats.deepWorkLog : [];
        const map = {};
        log.forEach((item) => {
            const key = typeof item?.name === 'string' && item.name.trim() ? item.name.trim() : 'General';
            const seconds = Math.max(0, Math.floor(Number(item?.seconds) || 0));
            map[key] = (map[key] || 0) + seconds;
        });
        return Object.entries(map)
            .map(([name, seconds]) => ({ name, seconds }))
            .sort((a, b) => b.seconds - a.seconds)
            .slice(0, 5);
    }
};

export const timerMethods = {
    formatDuration(totalSeconds) {
        const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const hrs = Math.floor(safe / 3600);
        const mins = Math.floor((safe % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    },
    formatSessionDate(timestamp) {
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || ts <= 0) return 'Unknown date';
        return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    ensureDeepWorkUserStats() {
        if (!this.userStats || typeof this.userStats !== 'object') this.userStats = {};
        if (!Array.isArray(this.userStats.deepWorkLog)) this.userStats.deepWorkLog = [];
        if (!Number.isFinite(Number(this.userStats.deepWorkTotalSeconds))) {
            const mins = Number(this.userStats.deepWorkMinutes || 0);
            this.userStats.deepWorkTotalSeconds = Number.isFinite(mins) ? Math.max(0, Math.floor(mins * 60)) : 0;
        }
        if (!Number.isFinite(Number(this.userStats.deepWorkSessions))) this.userStats.deepWorkSessions = 0;
        if (!Number.isFinite(Number(this.userStats.deepWorkMinutes))) this.userStats.deepWorkMinutes = Math.floor(this.userStats.deepWorkTotalSeconds / 60);
        if (!this.userStats.activeDeepWork || typeof this.userStats.activeDeepWork !== 'object') this.userStats.activeDeepWork = null;
    },
    hydrateDeepWorkRuntime() {
        this.ensureDeepWorkUserStats();
        const active = this.userStats.activeDeepWork;
        if (!active) return;

        const startedAt = Number(active.startedAt);
        const baseSeconds = Math.max(0, Math.floor(Number(active.baseSeconds) || 0));
        if (!Number.isFinite(startedAt) || startedAt <= 0) {
            this.userStats.activeDeepWork = null;
            this.saveState(true);
            return;
        }

        this.deepWorkTaskName = typeof active.name === 'string' ? active.name : '';
        this.deepWorkBaseSeconds = baseSeconds;
        this.deepWorkStartTs = startedAt;
        this.timerRunning = true;
        this.tickDeepWorkElapsed();
        this.startDeepWorkInterval();
    },
    tickDeepWorkElapsed() {
        if (!this.timerRunning || !this.deepWorkStartTs) return;
        const delta = Math.floor((Date.now() - this.deepWorkStartTs) / 1000);
        this.deepWorkElapsedSeconds = Math.max(0, this.deepWorkBaseSeconds + Math.max(0, delta));
    },
    startDeepWorkInterval() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.tickDeepWorkElapsed();
        }, 1000);
    },
    startDeepWork() {
        this.ensureDeepWorkUserStats();
        if (!this.deepWorkTaskName || !this.deepWorkTaskName.trim()) this.deepWorkTaskName = 'General';

        this.deepWorkBaseSeconds = Math.max(0, Math.floor(Number(this.deepWorkElapsedSeconds) || 0));
        this.deepWorkStartTs = Date.now();
        this.timerRunning = true;
        this.userStats.activeDeepWork = {
            name: this.deepWorkTaskName.trim(),
            startedAt: this.deepWorkStartTs,
            baseSeconds: this.deepWorkBaseSeconds
        };
        this.startDeepWorkInterval();
        this.saveState(true);
    },
    pauseDeepWork() {
        if (!this.timerRunning) return;
        this.tickDeepWorkElapsed();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerRunning = false;
        this.deepWorkBaseSeconds = this.deepWorkElapsedSeconds;
        this.deepWorkStartTs = null;
        this.userStats.activeDeepWork = null;
        this.saveState(true);
    },
    toggleTimer() {
        if (this.timerRunning) this.pauseDeepWork();
        else this.startDeepWork();
    },
    resetTimer() {
        if (this.timerRunning) this.pauseDeepWork();
        this.deepWorkElapsedSeconds = 0;
        this.deepWorkBaseSeconds = 0;
        this.deepWorkStartTs = null;
        this.userStats.activeDeepWork = null;
        this.saveState(true);
    },
    saveDeepWorkSession() {
        this.ensureDeepWorkUserStats();
        if (this.timerRunning) this.pauseDeepWork();

        const seconds = Math.max(0, Math.floor(Number(this.deepWorkElapsedSeconds) || 0));
        if (seconds < 60) {
            alert('Track at least 1 minute before saving a session.');
            return;
        }

        const endedAt = Date.now();
        const startedAt = endedAt - seconds * 1000;
        const name = (this.deepWorkTaskName || 'General').trim() || 'General';

        this.userStats.deepWorkLog.unshift({
            id: `${endedAt}-${Math.random().toString(16).slice(2, 8)}`,
            name,
            seconds,
            startedAt,
            endedAt
        });

        this.userStats.deepWorkTotalSeconds = Math.max(0, Number(this.userStats.deepWorkTotalSeconds || 0)) + seconds;
        this.userStats.deepWorkSessions = Math.max(0, Number(this.userStats.deepWorkSessions || 0)) + 1;
        this.userStats.deepWorkMinutes = Math.floor(this.userStats.deepWorkTotalSeconds / 60);

        if (typeof this.addActivity === 'function') this.addActivity(`Saved deep work session for ${name} (${this.formatDuration(seconds)})`);

        this.deepWorkElapsedSeconds = 0;
        this.deepWorkBaseSeconds = 0;
        this.deepWorkStartTs = null;
        this.userStats.activeDeepWork = null;
        this.addXP(20);
        this.saveState(true);
    },
    deleteDeepWorkSession(sessionId) {
        this.ensureDeepWorkUserStats();
        if (!Array.isArray(this.userStats.deepWorkLog)) return;
        const idx = this.userStats.deepWorkLog.findIndex((item) => item?.id === sessionId);
        if (idx < 0) return;
        const removed = this.userStats.deepWorkLog.splice(idx, 1)[0];
        const seconds = Math.max(0, Math.floor(Number(removed?.seconds) || 0));
        this.userStats.deepWorkTotalSeconds = Math.max(0, Number(this.userStats.deepWorkTotalSeconds || 0) - seconds);
        this.userStats.deepWorkSessions = Math.max(0, Number(this.userStats.deepWorkSessions || 0) - 1);
        this.userStats.deepWorkMinutes = Math.floor(this.userStats.deepWorkTotalSeconds / 60);
        if (typeof this.addActivity === 'function') this.addActivity(`Deleted deep work session for ${removed?.name || 'General'}`);
        this.saveState(true);
    },
    playPopSound() {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = this.audioCtx;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            // Audio may be blocked by browser permissions; ignore safely.
        }
    },
    fireMassiveConfetti() {
        const end = Date.now() + 2000;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#8b5cf6'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#10b981', '#f59e0b'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
};
