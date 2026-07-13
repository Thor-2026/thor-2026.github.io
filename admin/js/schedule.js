// ======================================
// THOR DISPLAY CMS
// Schedule Module
// ======================================

let scheduleTimer = null;

async function loadSchedule() {

    const scheduleImage =
        document.getElementById("scheduleImage");

    if (!scheduleImage) return;

    try {

        const imageUrl = supabaseClient.storage
            .from("display")
            .getPublicUrl("schedule/current.png")
            .data.publicUrl;

        const newImage = new Image();

        newImage.onload = () => {

            scheduleImage.src =
                imageUrl + "?t=" + Date.now();

        };

        newImage.src =
            imageUrl + "?t=" + Date.now();

    }

    catch (err) {

        console.error("Schedule:", err);

    }

}

function startSchedule() {

    if (scheduleTimer) {

        clearInterval(scheduleTimer);

    }

    loadSchedule();

    scheduleTimer = setInterval(

        loadSchedule,

        60000

    );

}

function stopSchedule() {

    if (scheduleTimer) {

        clearInterval(scheduleTimer);

        scheduleTimer = null;

    }

}
