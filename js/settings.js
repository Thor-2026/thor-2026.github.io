// ======================================
// THOR DISPLAY CMS
// Settings Module
// ======================================

const CONFIG = {

    city: "Langley",

    latitude: 49.1044,

    longitude: -122.6580,

    refreshMinutes: 5,

    weatherMinutes: 15

};

let SETTINGS = {

    city: CONFIG.city,

    latitude: CONFIG.latitude,

    longitude: CONFIG.longitude,

    refresh_minutes: CONFIG.refreshMinutes,

    weather_minutes: CONFIG.weatherMinutes,

    announcement_seconds: 8,

    display_title: "SHIFT SCHEDULE",

    clock_format: 12,

    temperature_unit: "C"

};

// --------------------------------------
// Load Settings
// --------------------------------------

async function loadSettings() {

    const { data, error } = await supabaseClient
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {

        console.error("Settings:", error);

        return false;

    }

    SETTINGS = {

        ...SETTINGS,
        ...data

    };

    applySettings();

    return true;

}

// --------------------------------------
// Apply Settings To Display
// --------------------------------------

function applySettings() {

    // Display Title

    const displayTitle =
        document.getElementById("displayTitle");

    if (displayTitle) {

        displayTitle.textContent =
            SETTINGS.display_title;

    }

    // Weather City

    const weatherCity =
        document.getElementById("weatherCity");

    if (weatherCity) {

        weatherCity.textContent =
            "📍 " + SETTINGS.city;

    }

}

// --------------------------------------
// Get Current Settings
// --------------------------------------

function getSettings() {

    return SETTINGS;

}

// --------------------------------------
// Restart Modules
// (Future live updates)
// --------------------------------------

function refreshModules() {

    // Reserved for future

}
