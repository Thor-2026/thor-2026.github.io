// ======================================
// THOR DISPLAY CMS
// Schedule Module (True Seconds - Fast Startup)
// ======================================

let scheduleTimer = null;
let dbSyncTimer = null;
let currentSlideIndex = 0;
let activeSlidesCached = [];
let currentIntervalMs = 5000; // Default fallback to 5 seconds

// Use one stable session timestamp so images are instant after the first download
const sessionToken = Date.now(); 

// 1. FAST ROTATION: Slides through images instantly using your exact original image swap style
function advanceSlide() {
    const scheduleImage = document.getElementById("scheduleImage");
    if (!scheduleImage || activeSlidesCached.length === 0) return;

    // Advance the index cleanly
    currentSlideIndex = (currentSlideIndex + 1) % activeSlidesCached.length;
    const imageUrl = activeSlidesCached[currentSlideIndex].url;

    // Direct original image swap execution
    const newImage = new Image();
    newImage.onload = () => {
        scheduleImage.src = imageUrl + "?t=" + sessionToken;
        scheduleImage.style.display = "block";
    };
    newImage.src = imageUrl + "?t=" + sessionToken;
}

// 2. BACKGROUND SYNC: Fetches settings and new uploads quietly without lagging the slideshow
async function syncWithDatabase() {
    if (typeof supabaseClient === 'undefined') return;

    try {
        // PRIORITIZE IMAGES FIRST: Fetch active layout slots rows indices immediately
        const { data: activeSlides, error } = await supabaseClient
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (!error && activeSlides && activeSlides.length > 0) {
            activeSlidesCached = activeSlides;
            
            // If this is the first run, show the first image immediately!
            const scheduleImage = document.getElementById("scheduleImage");
            if (scheduleImage && (!scheduleImage.src || scheduleImage.src === window.location.href || scheduleImage.style.display === "none")) {
                scheduleImage.src = activeSlidesCached[0].url + "?t=" + sessionToken;
                scheduleImage.style.display = "block";
            }
        } else if (error || !activeSlides || activeSlides.length === 0) {
            const scheduleImage = document.getElementById("scheduleImage");
            if (scheduleImage) scheduleImage.style.display = "none";
            return;
        }

        // DEFER TIMING INFO: Fetch intervals from database quietly afterward
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        if (settingsData && settingsData.schedule_seconds) {
            const dbSeconds = parseInt(settingsData.schedule_seconds, 10);
            const targetMs = (dbSeconds >= 2 ? dbSeconds : 5) * 1000;
            
            // If the timing changed in admin, reset the slideshow timer immediately
            if (targetMs !== currentIntervalMs) {
                currentIntervalMs = targetMs;
                if (scheduleTimer) startSlideshowTimer();
            }
        }
    } catch (err) {
        console.error("Database sync warning:", err);
    }
}

// 3. TIMER ENGINE CONTROL
function startSlideshowTimer() {
    if (scheduleTimer) clearInterval(scheduleTimer);
    
    // This loops exactly on your chosen seconds speed
    scheduleTimer = setInterval(() => {
        if (activeSlidesCached.length > 1) {
            advanceSlide();
        }
    }, currentIntervalMs);
}

// 4. MAIN CMS HOOK ENTRY POINTS
async function loadSchedule() {
    await syncWithDatabase();
}

function startSchedule() {
    // Step A: Stop any lingering ghost loops
    stopSchedule();

    // Step B: Connect immediately, then initialize the fast seconds rotation loop
    syncWithDatabase().then(() => {
        startSlideshowTimer();
    });

    // Step C: Check the database for new files on a quiet 30-second background cycle 
    // so it never lag-spikes your short slide durations.
    dbSyncTimer = setInterval(syncWithDatabase, 30000);
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
    if (dbSyncTimer) {
        clearInterval(dbSyncTimer);
        dbSyncTimer = null;
    }
}
