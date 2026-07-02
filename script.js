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
      LIVE CLOCK & DATE
=========================== */

function updateClock() {

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

}

updateClock();
setInterval(updateClock,1000);

/* ===========================
          WEATHER
=========================== */

async function loadWeather(){

try{

const url=`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.latitude}&longitude=${CONFIG.longitude}&current=temperature_2m,weather_code`;

const response=await fetch(url);

const data=await response.json();

const temp=Math.round(data.current.temperature_2m);

const code=data.current.weather_code;

document.getElementById("temperature").textContent=temp+"°C";

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

}

catch(e){

document.getElementById("weatherText").textContent="Offline";

}

}

loadWeather();

setInterval(loadWeather,CONFIG.weatherMinutes*60*1000);

/* ===========================
     AUTO REFRESH WEBSITE
=========================== */

setInterval(function(){

location.reload();

},CONFIG.refreshMinutes*60*1000);

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

loadAnnouncements();

setInterval(rotateAnnouncements, 8000);

// Reload announcements every minute
setInterval(loadAnnouncements, 60000);

/* ===========================
       TICKER TEXT
=========================== */

const ticker=document.getElementById("tickerText");

ticker.innerHTML=
"📢 Welcome &nbsp;&nbsp; • &nbsp;&nbsp; Wear PPE &nbsp;&nbsp; • &nbsp;&nbsp; Check Today's Shift Schedule &nbsp;&nbsp; • &nbsp;&nbsp; Have A Safe Day &nbsp;&nbsp; • &nbsp;&nbsp;";

/* ===========================
      IMAGE AUTO RELOAD
=========================== */


(async () => {

    const settings = await loadSettings();

    if (settings) {
        alert("✅ Connected to Supabase successfully!");
    } else {
        alert("❌ Could not connect to Supabase.");
    }

})();

/* ===========================
        BRANDING
=========================== */

async function loadBranding() {

    const { data, error } = await supabaseClient
        .from("branding")
        .select("*")
        .limit(1)
        .single();

    if (error) {

        console.error(error);
        return;

    }

    // Company Name
    const companyName = document.getElementById("companyName");

    if (companyName)
        companyName.textContent = data.company_name;

    // Welcome Message
    const welcomeText = document.getElementById("welcomeText");

    if (welcomeText)
        welcomeText.textContent = data.welcome_text;

    // Logo
    if (data.logo_url) {

        document.getElementById("logo").src =
            data.logo_url + "?t=" + Date.now();

    }

    // Background

    if (data.background_url) {

        document.body.style.backgroundImage =
            `url(${data.background_url}?t=${Date.now()})`;

        document.body.style.backgroundSize = "cover";

        document.body.style.backgroundPosition = "center";

        document.body.style.backgroundRepeat = "no-repeat";

    }

}

loadBranding();

// Refresh branding every minute
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

loadSchedule();

// Check for a new schedule every minute
setInterval(loadSchedule, 60000);
