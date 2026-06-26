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

const announcements=[

"👷 Wear PPE at all times",

"📋 Check today's shift schedule",

"🚨 Report hazards immediately",

"☕ Enjoy your shift",

"✅ Safety starts with you"

];

let notice=0;

function rotateAnnouncements(){

const list=document.getElementById("announcements");

if(!list) return;

list.innerHTML="<li>"+announcements[notice]+"</li>";

notice++;

if(notice>=announcements.length){

notice=0;

}

}

rotateAnnouncements();

setInterval(rotateAnnouncements,8000);

/* ===========================
       TICKER TEXT
=========================== */

const ticker=document.getElementById("tickerText");

ticker.innerHTML=
"📢 Welcome &nbsp;&nbsp; • &nbsp;&nbsp; Wear PPE &nbsp;&nbsp; • &nbsp;&nbsp; Check Today's Shift Schedule &nbsp;&nbsp; • &nbsp;&nbsp; Have A Safe Day &nbsp;&nbsp; • &nbsp;&nbsp;";

/* ===========================
      IMAGE AUTO RELOAD
=========================== */

setInterval(function(){

const img=document.getElementById("scheduleImage");

if(img){

img.src="schedule/schedule.png?"+new Date().getTime();

}

},60000);
