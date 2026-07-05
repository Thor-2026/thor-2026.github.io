// ======================================
// THOR DISPLAY CMS
// Display Manager
// ======================================

let refreshTimer = null;

async function initDisplay() {

    // Load settings first
    const loaded = await loadSettings();

    if (!loaded) {

        console.error("Unable to load settings.");

        return;

    }

    // Start all modules

    startClock();

    startWeather();

    startAnnouncements();

    startTicker();

    startBranding();

    startSchedule();

    // Auto refresh display

    if (refreshTimer) {

        clearTimeout(refreshTimer);

    }

    refreshTimer = setTimeout(() => {

        location.reload();

    }, getSettings().refresh_minutes * 60 * 1000);

}

// Reload settings every minute

setInterval(async () => {

    await loadSettings();

}, 60000);
