// ======================================
// THOR DISPLAY CMS
// Main Startup
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await initDisplay();

    }

    catch (err) {

        console.error("Startup Error:", err);

    }

});
