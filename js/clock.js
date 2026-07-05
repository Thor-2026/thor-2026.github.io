// ======================================
// THOR DISPLAY CMS
// Clock Module
// ======================================

let clockTimer = null;

function updateClock() {

    const settings = getSettings();

    const now = new Date();

    const clock = document.getElementById("clock");
    const date = document.getElementById("date");

    if (clock) {

        clock.textContent = now.toLocaleTimeString([], {

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",

            hour12: settings.clock_format == 12

        });

    }

    if (date) {

        date.textContent = now.toLocaleDateString([], {

            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"

        });

    }

}

function startClock() {

    if (clockTimer) {

        clearInterval(clockTimer);

    }

    updateClock();

    clockTimer = setInterval(updateClock, 1000);

}

function stopClock() {

    if (clockTimer) {

        clearInterval(clockTimer);

        clockTimer = null;

    }

}
