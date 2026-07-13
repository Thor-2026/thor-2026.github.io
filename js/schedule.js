// ======================================
// THOR DISPLAY CMS
// Schedule Module (Dynamic Seconds Loop)
// ======================================

let scheduleTimer = null;
let currentSlideIndex = 0;
let activeSlidesCached = [];
let currentIntervalMs = 5000; // Fallback default (5 seconds)

async function loadSchedule() {
    const scheduleImage = document.getElementById("scheduleImage");
    if (!scheduleImage) return;

    if (typeof supabaseClient === 'undefined') return;

    try {
        // 1. Fetch Dynamic Timing settings configuration row from database
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        if (settingsData && settingsData.schedule_seconds) {
            const dbSeconds = parseInt(settingsData.schedule_seconds, 10);
            const targetMs = (dbSeconds >= 2 ? dbSeconds : 5) * 1000;
            
            // If the admin changed the timing setting on the fly, restart the loop cleanly
            if (targetMs !== currentIntervalMs && scheduleTimer) {
                currentIntervalMs = targetMs;
                resetAutomationTimer();
            } else {
                currentIntervalMs = targetMs;
            }
        }

        // 2. Fetch active slots from your layout rows mapping table
        const { data: activeSlides, error } = await supabaseClient
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (error || !activeSlides || activeSlides.length === 0) {
            scheduleImage.style.display = "none";
            return;
        }

        activeSlidesCached = activeSlides;

        if (currentSlideIndex >= activeSlidesCached.length) {
            currentSlideIndex = 0;
        }

        // 3. Extract target URL path string index map
        const imageUrl = activeSlidesCached[currentSlideIndex].url;

        // 4. Preload and swap exactly like your original logic did
        const newImage = new Image();
        newImage.onload = () => {
            scheduleImage.src = imageUrl + "?t=" + Date.now();
            scheduleImage.style.display = "block";
        };
        newImage.src = imageUrl + "?t=" + Date.now();

    } catch (err) {
        console.error("Schedule Engine Loop Sync Error:", err);
    }
}

function resetAutomationTimer() {
    if (scheduleTimer) clearInterval(scheduleTimer);
    
    scheduleTimer = setInterval(() => {
        if (activeSlidesCached.length > 1) {
            currentSlideIndex = (currentSlideIndex + 1) % activeSlidesCached.length;
            loadSchedule(); // Advances to the next slide image directly
        } else {
            // If there's only 1 slide, just check the database for updates/timing changes
            loadSchedule();
        }
    }, currentIntervalMs);
}

function startSchedule() {
    // 1. Perform immediate bootstrap load invocation sequence mapping execution
    loadSchedule().then(() => {
        // 2. Initialize the automated interval execution rotation pipeline using live seconds
        resetAutomationTimer();
    });
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
}
