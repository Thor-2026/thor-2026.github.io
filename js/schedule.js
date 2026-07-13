// ======================================
// THOR DISPLAY CMS
// Schedule Module
// ======================================

let scheduleTimer = null;
let currentSlideIndex = 0;
let activeSlidesCached = [];

async function loadSchedule() {
    const scheduleImage = document.getElementById("scheduleImage");
    if (!scheduleImage) return;

    if (typeof supabaseClient === 'undefined') return;

    try {
        // 1. Fetch active slots from your new database setup
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

        // Store the list globally so we can loop through them
        activeSlidesCached = activeSlides;

        // Ensure our index is safe
        if (currentSlideIndex >= activeSlidesCached.length) {
            currentSlideIndex = 0;
        }

        // 2. Get the current image URL to display
        const imageUrl = activeSlidesCached[currentSlideIndex].url;

        // 3. Preload and swap exactly like your original logic did
        const newImage = new Image();
        newImage.onload = () => {
            scheduleImage.src = imageUrl + "?t=" + Date.now();
            scheduleImage.style.display = "block";
        };
        newImage.src = imageUrl + "?t=" + Date.now();

    } catch (err) {
        console.error("Schedule Engine Error:", err);
    }
}

function startSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
    }

    // Load the first image instantly
    loadSchedule();

    // Set an interval to advance to the next image every 60 seconds
    // exactly like your original 60000ms loop timer.
    scheduleTimer = setInterval(() => {
        if (activeSlidesCached.length > 1) {
            currentSlideIndex = (currentSlideIndex + 1) % activeSlidesCached.length;
        }
        loadSchedule();
    }, 60000);
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
}
