// ======================================
// THOR DISPLAY CMS & INVENTORY SYSTEM
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

    ticker: {
        file: "views/ticker.html",
        init: "initTickerPage"
    },

    branding: {
        file: "views/branding.html",
        init: "initBrandingPage"
    },

    weather: {
        file: "views/weather.html",
        init: "initWeatherPage"
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
    },

    labels: {
        file: "views/labels.html",
        init: "initLabelsPage"
    }

};

let currentUser = null;
let userPermissions = {};

// ======================================
// LOAD CURRENT USER
// ======================================

async function loadCurrentUser() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    // If no user is logged in, check if they are trying to view the public labels page
    if (!user) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'labels') {
            currentUser = null;
            return true; // Allow initializing in guest mode
        }
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

    // Guest Mode (No logged-in session)
    if (!currentUser) {
        userPermissions = {
            labels: { can_view: true, can_create: false, can_edit: false, can_delete: false }
        };
        return;
    }

    // Super Admin Role Bypass (role_id === 1)
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

    // Operator Role Limitations (role_id === 3: Only label access)
    if (currentUser?.profile?.role_id === 3) {
        userPermissions = {
            dashboard: { can_view: true },
            labels: { can_view: true, can_create: false, can_edit: true, can_delete: false }
        };
        return;
    }

    // Standard Staff / Supervisor Permissions Pull
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

    // Base default views for Staff
    userPermissions['dashboard'] = { can_view: true };
    userPermissions['labels'] = { can_view: true }; 

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

    // If completely logged out (Guest Mode looking at labels) hide everything except exit button
    if (!currentUser) {
        document.querySelectorAll(".menu[data-page]").forEach(button => {
            button.style.display = "none";
        });
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.innerHTML = "❌ Exit View";
        return;
    }

    // Hide or display options based on dynamic permissions map
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

    // If operator role is active, visually strip the menu down to bare bones
    if (currentUser?.profile?.role_id === 3) {
        document.querySelectorAll(".menu[data-page]:not([data-page='labels'])").forEach(button => {
            button.style.display = "none";
        });
    }

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
                    <p>You do not have permission to view this module.</p>
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

            if (!currentUser) {
                window.location.href = "../index.html";
                return;
            }

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

    // Check URL parameters for view commands
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view');

    if (initialView && modules[initialView] && hasPermission(initialView)) {
        document.querySelectorAll(".menu").forEach(item => item.classList.remove("active"));
        const targetedMenu = document.querySelector(`.menu[data-page='${initialView}']`);
        if (targetedMenu) targetedMenu.classList.add("active");
        
        loadPage(initialView);
    } else {
        // If logged in as operator, bypass generic dashboard, go to labels directly
        if (currentUser?.profile?.role_id === 3) {
            const labelMenu = document.querySelector(".menu[data-page='labels']");
            if (labelMenu) labelMenu.classList.add("active");
            loadPage("labels");
        } else {
            loadPage("dashboard");
        }
    }

});
