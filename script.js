/* ===========================
   MyDisplay Configuration
=========================== */

const CONFIG = {
    city: "Langley",
    latitude: 49.1044,
    longitude: -122.6580,
    refreshMinutes: 5,
    weatherMinutes: 15
};

/* ===========================
      SYSTEM SETTINGS
=========================== */

let SETTINGS = {
    city: CONFIG.city,
    latitude: CONFIG.latitude,
    longitude: CONFIG.longitude,
    refresh_minutes: CONFIG.refreshMinutes,
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
        console.error(error);
        return;
    }

    if (data) {
        CONFIG.city = data.city;
        CONFIG.latitude = data.latitude;
        CONFIG.longitude = data.longitude;

        const title = document.getElementById("displayTitle");
        if (title) {
            title.textContent = data.display_title || SETTINGS.display_title;
        }

        const city = document.getElementById("weatherCity");
        if (city) {
            city.textContent = "📍 " + data.city;
        }
    }
}

/* ===========================
      LIVE CLOCK & DATE
=========================== */

function updateClock() {
    const now = new Date();

    const clockElem = document.getElementById("clock");
    if (clockElem) {
        clockElem.textContent = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: SETTINGS.clock_format == 12
        });
    }

    const dateElem = document.getElementById("date");
    if (dateElem) {
        dateElem.textContent = now.toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
}
setInterval(updateClock, 1000);

/* ===========================
          WEATHER
=========================== */

async function loadWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,weather_code`;
        const response = await fetch(url);
        const data = await response.json();

        let temp = data.current.temperature_2m;
        let unit = "°C";

        if (SETTINGS.temperature_unit === "F") {
            temp = (temp * 9 / 5) + 32;
            unit = "°F";
        }

        const tempElem = document.getElementById("temperature");
        if (tempElem) {
            tempElem.textContent = Math.round(temp) + unit;
        }

        const code = data.current.weather_code;
        let icon = "☀️";
        let text = "Clear";

        if (code >= 1 && code <= 3) {
            icon = "⛅";
            text = "Partly Cloudy";
        } else if (code >= 45 && code <= 48) {
            icon = "🌫️";
            text = "Fog";
        } else if (code >= 51 && code <= 67) {
            icon = "🌧️";
            text = "Rain";
        } else if (code >= 71 && code <= 86) {
            icon = "❄️";
            text = "Snow";
        } else if (code >= 95) {
            icon = "⛈️";
            text = "Thunderstorm";
        }

        const iconElem = document.getElementById("weatherIcon");
        const textElem = document.getElementById("weatherText");
        const updatedElem = document.getElementById("weatherUpdated");

        if (iconElem) iconElem.textContent = icon;
        if (textElem) textElem.textContent = text;
        if (updatedElem) {
            updatedElem.textContent = "Updated: " + new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    } catch (e) {
        const textElem = document.getElementById("weatherText");
        if (textElem) textElem.textContent = "Offline";
    }
}

(async () => {
    await loadSettings();
    setInterval(loadWeather, CONFIG.weatherMinutes * 60 * 1000);
})();

/* ===========================
     AUTO REFRESH WEBSITE
=========================== */

setTimeout(function refreshPage() {
    location.reload();
}, SETTINGS.refresh_minutes * 60000);

/* ===========================
      ANNOUNCEMENTS
=========================== */

let announcements = [];
let notice = 0;

async function loadAnnouncements() {
    const { data, error } = await supabaseClient
        .from("announcements")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    announcements = data;
    notice = 0;

    rotateAnnouncements();
}

function rotateAnnouncements() {
    const list = document.getElementById("announcements");
    if (!list) return;

    if (!announcements || announcements.length === 0) {
        list.innerHTML = `
            <li>
                <strong style="color:#06B6D4;">No Announcements</strong><br>
                <span style="color:#94A3B8;">Everything is up to date.</span>
            </li>
        `;
        return;
    }

    const item = announcements[notice];

    list.innerHTML = `
        <li>
            <strong style="font-size:20px;color:#06B6D4;">
                ${item.title}
            </strong>
            <br><br>
            <span style="font-size:16px;color:#FFFFFF;">
                ${item.message}
            </span>
        </li>
    `;

    notice++;
    if (notice >= announcements.length) {
        notice = 0;
    }
}

setInterval(rotateAnnouncements, SETTINGS.announcement_seconds * 1000);
setInterval(loadAnnouncements, 60000);

/* ===========================
       TICKER TEXT
=========================== */

const ticker = document.getElementById("tickerText");
if (ticker) {
    ticker.innerHTML =
        "📢 Welcome &nbsp;&nbsp; • &nbsp;&nbsp; Wear PPE &nbsp;&nbsp; • &nbsp;&nbsp; Check Today's Shift Schedule &nbsp;&nbsp; • &nbsp;&nbsp; Have A Safe Day &nbsp;&nbsp; • &nbsp;&nbsp;";
}

/* ===========================
        BRANDING
=========================== */

async function loadBranding() {
    const { data, error } = await supabaseClient
        .from("branding")
        .select("*");

    if (error || !data || data.length === 0) return;

    const branding = data[0];

    // Company Name: Handles split "Ops" (white) + "Vision" (blue) styling
    const companyName = document.getElementById("companyName");
    if (companyName) {
        const rawName = branding.company_name || "OpsVision";
        if (rawName.toLowerCase() === "opsvision") {
            companyName.innerHTML = `Ops<span style="color: #2563EB;">Vision</span>`;
        } else {
            companyName.textContent = rawName;
        }
    }

    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText) {
        welcomeText.textContent = branding.welcome_text || "";
    }

    const logo = document.getElementById("logo");
    if (logo && branding.logo_url) {
        logo.src = branding.logo_url + "?t=" + Date.now();
    }

    if (branding.background_url) {
        document.body.style.backgroundImage = `url(${branding.background_url}?t=${Date.now()})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
    }
}

(async () => {
    await loadSettings();
    loadBranding();
    loadWeather();
    loadAnnouncements();
    loadSchedule();
})();

setInterval(loadBranding, 60000);

async function loadSchedule() {
    const scheduleImage = document.getElementById("scheduleImage");
    if (!scheduleImage) return;

    const imageUrl = supabaseClient.storage
        .from("display")
        .getPublicUrl("schedule/current.png")
        .data.publicUrl;

    scheduleImage.src = imageUrl + "?t=" + Date.now();
}

setInterval(loadSchedule, 60000);
