// ======================================
// THOR DISPLAY CMS
// Dashboard Controller
// ======================================

const modules = {
    dashboard: {
        file: "views/dashboard.html",
        init: null
    },
    schedule: {
        file: "views/schedule.html",
        init: "initSchedulePage"
    },
    announcements: {
        file: "views/announcements.html",
        init: "initAnnouncementsPage"
    },
    branding: {
        file: "views/branding.html",
        init: "initBrandingPage"
    },
    weather: {
        file: "views/weather.html",
        init: "initWeatherPage"
    },
    ticker: {
    file: "views/ticker.html",
    init: "initTickerPage"
    },
    settings: {
        file: "views/settings.html",
        init: "initSettingsPage"
    }
};

async function loadPage(page) {

    try {

        const module = modules[page];

        if (!module) {
            throw new Error("Unknown page: " + page);
        }

        const response = await fetch(module.file);

        if (!response.ok) {
            throw new Error("Cannot load " + module.file);
        }

        const html = await response.text();

        document.getElementById("pageContent").innerHTML = html;

        if (module.init && typeof window[module.init] === "function") {
            window[module.init]();
        }

    } catch (err) {

        console.error(err);

        document.getElementById("pageContent").innerHTML = `
            <div class="card">
                <h2>⚠ Error</h2>
                <p>${err.message}</p>
            </div>
        `;

    }

}

// Sidebar buttons

document.querySelectorAll(".menu").forEach(button => {

    if (button.id === "logoutBtn") return;

    button.addEventListener("click", () => {

        document.querySelectorAll(".menu").forEach(m =>
            m.classList.remove("active")
        );

        button.classList.add("active");

        loadPage(button.dataset.page);

    });

});

// Logout

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    location.href = "index.html";

});

// Start

loadPage("dashboard");
