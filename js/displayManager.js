// ======================================
// THOR DISPLAY CMS
// Display Manager
// ======================================

let refreshTimer = null;
let settingsReloadTimer = null;

// --------------------------------------
// Initialize Display
// --------------------------------------

async function initDisplay() {

    console.log("Starting THOR Display CMS...");

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

    startRefreshTimer();

    startSettingsWatcher();

    console.log("THOR Display CMS Ready.");

}

// --------------------------------------
// Refresh Page Timer
// --------------------------------------

function startRefreshTimer() {

    if (refreshTimer) {

        clearTimeout(refreshTimer);

    }

    refreshTimer = setTimeout(() => {

        location.reload();

    }, getSettings().refresh_minutes * 60000);

}

// --------------------------------------
// Settings Watcher
// --------------------------------------

function startSettingsWatcher() {

    if (settingsReloadTimer) {

        clearInterval(settingsReloadTimer);

    }

    settingsReloadTimer = setInterval(async () => {

        await loadSettings();

    }, 60000);

}
