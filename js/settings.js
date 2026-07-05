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

async function loadSettings() {

    const { data, error } = await supabaseClient
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {

        console.error("Settings Error:", error);

        return false;

    }

    SETTINGS = {

        ...SETTINGS,

        ...data

    };

    applySettings();

    return true;

}

function applySettings() {

    // Display title

    const title = document.getElementById("displayTitle");

    if (title) {

        title.textContent = SETTINGS.display_title;

    }

    // Weather city

    const city = document.getElementById("weatherCity");

    if (city) {

        city.textContent = "📍 " + SETTINGS.city;

    }

}

function getSettings() {

    return SETTINGS;

}
