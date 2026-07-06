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
    },

    team: {
        file: "views/team.html",
        init: "initTeam"
    }

};

// ======================================
// Load Page
// ======================================

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

        const pageContent = document.getElementById("pageContent");

        pageContent.innerHTML = html;

        // Small delay so new HTML exists before initialization

        if (module.init &&
            typeof window[module.init] === "function") {

            setTimeout(() => {

                window[module.init]();

            }, 50);

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

// ======================================
// Sidebar Navigation
// ======================================

document.querySelectorAll(".menu").forEach(button => {

    if (button.id === "logoutBtn") return;

    button.addEventListener("click", () => {

        document.querySelectorAll(".menu").forEach(menu => {

            menu.classList.remove("active");

        });

        button.classList.add("active");

        loadPage(button.dataset.page);

    });

});

// ======================================
// Logout
// ======================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "admin/login.html";

    });

}

// ======================================
// Start Dashboard
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadPage("dashboard");

});
