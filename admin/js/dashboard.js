// ==============================
// THOR DISPLAY CMS
// Dashboard Controller
// ==============================

// Load a module into the content area
async function loadPage(page) {

    try {

        const response = await fetch("views/" + page + ".html");

        if (!response.ok) {
            throw new Error("Unable to load " + page + ".html");
        }

        const html = await response.text();

        document.getElementById("pageContent").innerHTML = html;

        // Initialize page-specific JavaScript
        switch (page) {

            case "schedule":
                if (typeof initSchedulePage === "function") {
                    initSchedulePage();
                }
                break;

            case "announcements":
                if (typeof initAnnouncementsPage === "function") {
                    initAnnouncementsPage();
                }
                break;

            case "branding":
                if (typeof initBrandingPage === "function") {
                    initBrandingPage();
                }
                break;

            case "weather":
                if (typeof initWeatherPage === "function") {
                    initWeatherPage();
                }
                break;

            case "settings":
                if (typeof initSettingsPage === "function") {
                    initSettingsPage();
                }
                break;

        }

    } catch (error) {

        console.error(error);

        document.getElementById("pageContent").innerHTML = `
            <div class="card">
                <h2>⚠ Error</h2>
                <p>${error.message}</p>
            </div>
        `;

    }

}

// ==============================
// Sidebar Navigation
// ==============================

document.querySelectorAll(".menu").forEach(button => {

    button.addEventListener("click", () => {

        // Ignore logout button
        if (button.id === "logoutBtn") return;

        document.querySelectorAll(".menu").forEach(menu => {
            menu.classList.remove("active");
        });

        button.classList.add("active");

        loadPage(button.dataset.page);

    });

});

// ==============================
// Logout
// ==============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await supabaseClient.auth.signOut();

            window.location.href = "index.html";

        } catch (error) {

            console.error(error);

            alert("Unable to logout.");

        }

    });

}

// ==============================
// Start Dashboard
// ==============================

window.addEventListener("DOMContentLoaded", () => {

    loadPage("dashboard");

});
