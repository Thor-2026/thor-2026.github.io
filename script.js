/* ===========================
   MyDisplay Configuration
   Edit these values only
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

/* async function loadSettings() {

    const { data, error } = await supabaseClient
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    SETTINGS = data;
} */

async function loadSettings() {

    const { data, error } = await supabaseClient
        .from("settings")
        .select("*")
        .eq("id",1)
        .single();

    if(error){
        console.error(error);
        return;
       
const title = document.getElementById("displayTitle");

if (title) {
    title.textContent = SETTINGS.display_title;
}
       
    }

    CONFIG.city=data.city;
    CONFIG.latitude=data.latitude;
    CONFIG.longitude=data.longitude;

    const city=document.getElementById("weatherCity");

    if(city){

        city.textContent="📍 "+data.city;

    }

}


/* ===========================
      LIVE CLOCK & DATE
=========================== */

/* function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

    document.getElementById("date").textContent =
        now.toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

} */

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString([], {

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",

            hour12: SETTINGS.clock_format == 12

        });

    document.getElementById("date").textContent =
        now.toLocaleDateString([], {

            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"

        });

}
setInterval(updateClock,1000);

/* ===========================
          WEATHER
=========================== */

async function loadWeather(){

try{

const url=`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,weather_code`;

const response=await fetch(url);

const data=await response.json();

let temp = data.current.temperature_2m;
let unit = "°C";

if (SETTINGS.temperature_unit === "F") {

    temp = (temp * 9 / 5) + 32;
    unit = "°F";

}

document.getElementById("temperature").textContent =
    Math.round(temp) + unit;

const code=data.current.weather_code;

//document.getElementById("temperature").textContent=temp+"°C";

let icon="☀️";
let text="Clear";

if(code>=1 && code<=3){

icon="⛅";
text="Partly Cloudy";

}

else if(code>=45 && code<=48){

icon="🌫️";
text="Fog";

}

else if(code>=51 && code<=67){

icon="🌧️";
text="Rain";

}

else if(code>=71 && code<=86){

icon="❄️";
text="Snow";

}

else if(code>=95){

icon="⛈️";
text="Thunderstorm";

}

document.getElementById("weatherIcon").textContent=icon;
document.getElementById("weatherText").textContent=text;
document.getElementById("weatherUpdated").textContent =
"Updated: " +
new Date().toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
});   

}

catch(e){

document.getElementById("weatherText").textContent="Offline";

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

    if (announcements.length === 0) {

        list.innerHTML = `
            <li>
                <strong>No Announcements</strong><br>
                Everything is up to date.
            </li>
        `;

        return;

    }

    const item = announcements[notice];

    list.innerHTML = `
        <li>
            <strong style="font-size:22px;color:#FFD54F;">
                ${item.title}
            </strong>

            <br><br>

            <span style="font-size:18px;">
                ${item.message}
            </span>
        </li>
    `;

    notice++;

    if (notice >= announcements.length) {
        notice = 0;
    }

}

setInterval(() => {

    rotateAnnouncements();

}, SETTINGS.announcement_seconds * 1000);

// Reload announcements every minute
setInterval(loadAnnouncements, 60000);

/* ===========================
       TICKER TEXT
=========================== */

const ticker=document.getElementById("tickerText");

ticker.innerHTML=
"📢 Welcome &nbsp;&nbsp; • &nbsp;&nbsp; Wear PPE &nbsp;&nbsp; • &nbsp;&nbsp; Check Today's Shift Schedule &nbsp;&nbsp; • &nbsp;&nbsp; Have A Safe Day &nbsp;&nbsp; • &nbsp;&nbsp;";

;

/* ===========================
        BRANDING
=========================== */

async function loadBranding() {

    const { data, error } = await supabaseClient
        .from("branding")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No branding row found.");
        return;
    }

    const branding = data[0];

    // Company Name
    const companyName = document.getElementById("companyName");

    if (companyName) {
        companyName.textContent = branding.company_name || "THOR DISPLAY";
    }

    // Welcome Message
    const welcomeText = document.getElementById("welcomeText");

    if (welcomeText) {
        welcomeText.textContent = branding.welcome_text || "";
    }

    // Logo
    const logo = document.getElementById("logo");

    if (logo && branding.logo_url) {
        logo.src = branding.logo_url + "?t=" + Date.now();
    }

    // Background
    if (branding.background_url) {

        document.body.style.backgroundImage =
            `url(${branding.background_url}?t=${Date.now()})`;

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

//loadSchedule();

// Check for a new schedule every minute
setInterval(loadSchedule, 60000);
