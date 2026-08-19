// ============================================
// Ingoizer's World - Anonymous Gameplay Events
// ============================================

const GameAnalytics = (() => {
    const sentEvents = new Set();
    const pendingEvents = [];
    let retryTimer = null;
    let retryAttempts = 0;

    function flush() {
        if (!window.goatcounter || typeof window.goatcounter.count !== "function") return false;

        while (pendingEvents.length > 0) {
            const eventName = pendingEvents[0];
            try {
                window.goatcounter.count({
                    path: eventName,
                    title: eventName,
                    event: true,
                });
                pendingEvents.shift();
            } catch (_) {
                // Analytics must never interrupt the game.
                return false;
            }
        }
        return true;
    }

    function stopRetrying() {
        if (retryTimer !== null) {
            clearInterval(retryTimer);
            retryTimer = null;
        }
        retryAttempts = 0;
    }

    function scheduleRetry() {
        if (retryTimer !== null) return;
        retryAttempts = 0;
        retryTimer = setInterval(() => {
            retryAttempts++;
            if (flush() || retryAttempts >= 40) stopRetrying();
        }, 250);
    }

    return {
        track(eventName) {
            if (sentEvents.has(eventName)) return;
            sentEvents.add(eventName);
            pendingEvents.push(eventName);
            if (!flush()) scheduleRetry();
        },
    };
})();
