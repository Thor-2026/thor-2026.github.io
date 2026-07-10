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
    },

    permissions: {
        file: "views/permissions.html",
        init: "initPermissions"
    },

    activity: {
        file: "views/activity.html",
        init: "initActivity"
    }

};

let currentUser = null;
let userPermissions = {};

// ======================================
// LOAD CURRENT USER
// ======================================

async function loadCurrentUser() {

    const {

        data: {

            user

        }

    } = await supabaseClient.auth.getUser();

    if (!user) {

        window.location.href = "login.html";

        return false;

    }

    const {

        data: profile,

        error

    } = await supabaseClient

        .from("profiles")

        .select("*")

        .eq("id", user.id)

        .single();

    if (error) {

        console.error(error);

        return false;

    }

    currentUser = {

        ...user,

        profile

    };

    return true;

}

// ======================================
// LOAD PERMISSIONS
// ======================================

async function loadPermissions() {

    if (currentUser?.profile?.role_id === 1) {

        userPermissions = {};

        Object.keys(modules).forEach(module => {

            userPermissions[module] = {

                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true

            };

        });

        return;

    }

    const {

        data,

        error

    } = await supabaseClient

        .from("permissions")

        .select("*")

        .eq("user_id", currentUser.id);

    if (error) {

        console.error(error);

        return;

    }

    userPermissions = {};

    (data || []).forEach(permission => {

        userPermissions[permission.module] = permission;

    });

}

// ======================================
// CHECK ACCESS
// ======================================

function hasPermission(module) {

    if (currentUser?.profile?.role_id === 1) {

        return true;

    }

    if (module === "dashboard") {

        return true;

    }

    const permission = userPermissions[module];

    return permission?.can_view === true;

}

// ======================================
// UPDATE SIDEBAR
// ======================================

function updateSidebarPermissions() {

    document

        .querySelectorAll(".menu[data-page]")

        .forEach(button => {

            const module = button.dataset.page;

            if (hasPermission(module)) {

                button.style.display = "";

            }

            else {

                button.style.display = "none";

            }

        });

}

// ======================================
// Load HTML
// ======================================

async function loadPage(page) {

    try {

        if (!hasPermission(page)) {

            document.getElementById("pageContent").innerHTML = `

                <div class="card">

                    <h2>🚫 Access Denied</h2>

                    <p>

                        You do not have permission to view this module.

                    </p>

                </div>

            `;

            return;

        }

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

        if (

            module.init &&
            typeof window[module.init] === "function"

        ) {

            setTimeout(() => {

                window[module.init]();

            }, 50);

        }

    }

    catch (err) {

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
// Sidebar
// ======================================

function bindSidebar() {

    document
        .querySelectorAll(".menu")
        .forEach(button => {

            if (button.id === "logoutBtn") return;

            button.addEventListener("click", () => {

                const page = button.dataset.page;

                if (!hasPermission(page)) {

                    return;

                }

                document
                    .querySelectorAll(".menu")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                loadPage(page);

            });

        });

}

// ======================================
// Logout
// ======================================

function bindLogout() {

    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", async () => {

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";

        });

}

// ======================================
// Dashboard Start
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    const ok = await loadCurrentUser();

    if (!ok) return;

    await loadPermissions();

    updateSidebarPermissions();

    bindSidebar();

    bindLogout();

    loadPage("dashboard");

});
