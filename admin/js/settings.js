// ======================================
// THOR DISPLAY CMS
// Settings Manager
// ======================================

async function initSettingsPage(){

const displayTitle=document.getElementById("displayTitle");

const refreshMinutes=document.getElementById("refreshMinutes");

const announcementSeconds=document.getElementById("announcementSeconds");

const clockFormat=document.getElementById("clockFormat");

const temperatureUnit=document.getElementById("temperatureUnit");

const saveButton=document.getElementById("saveSettings");

if(!displayTitle)return;

async function loadSettings(){

const {data,error}=await supabaseClient

.from("settings")

.select("*")

.eq("id",1)

.single();

if(error){

console.error(error);

return;

}

displayTitle.value=data.display_title||"SHIFT SCHEDULE";

refreshMinutes.value=data.refresh_minutes;

announcementSeconds.value=data.announcement_seconds;

clockFormat.value=data.clock_format;

temperatureUnit.value=data.temperature_unit;

}

saveButton.onclick=async()=>{

const {error}=await supabaseClient

.from("settings")

.update({

display_title:displayTitle.value,

refresh_minutes:Number(refreshMinutes.value),

announcement_seconds:Number(announcementSeconds.value),

clock_format:clockFormat.value,

temperature_unit:temperatureUnit.value,

updated_at:new Date().toISOString()

})

.eq("id",1);

if(error){

alert(error.message);

return;

}

alert("Settings Saved Successfully");

};

loadSettings();

}
