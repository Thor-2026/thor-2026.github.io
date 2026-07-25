// ======================================
// THOR DISPLAY CMS
// Tab Isolation Guard & Inactivity Monitor
// ======================================

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes (Adjust as needed)
let idleTimer = null;

(async () => {

    // 1. ISOLATE TAB SESSION
    // If opening a brand-new tab/browser window without active flag, force login
    const isTabInitialized = sessionStorage.getItem("tab_session_active");

    if (!isTabInitialized) {
        await handleLogout();
        return;
    }

    // 2. VERIFY SUPABASE SESSION
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // 3. VERIFY PROFILE & PASSWORD REQUIREMENTS
    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("must_change_password")
        .eq("id", session.user.id)
        .single();

    if (error) {
        console.error(error);
        await handleLogout();
        return;
    }

    const currentPage = window.location.pathname.split("/").pop();

    if (profile.must_change_password && currentPage !== "change-password.html") {
        window.location.replace("change-password.html");
        return;
    }

    if (!profile.must_change_password && currentPage === "change-password.html") {
        window.location.replace("dashboard.html");
        return;
    }

    // 4. START INACTIVITY MONITORING
    startInactivityTimer();

    // 5. LISTEN FOR LOGOUTS ACROSS APP
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            sessionStorage.clear();
            window.location.replace("login.html");
        }
    });

})();

// ======================================
// INACTIVITY TIMER LOGIC
// ======================================

function startInactivityTimer() {
    resetIdleTimer();

    // List of user interaction events to track activity
    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    let throttleTimeout = null;

    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
            // Throttle reset calls to prevent high CPU usage on mouse movement
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    resetIdleTimer();
                    throttleTimeout = null;
                }, 2000);
            }
        }, { passive: true });
    });
}

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(async () => {
        alert("Your session has expired due to inactivity.");
        await handleLogout();
    }, INACTIVITY_LIMIT_MS);
}

// ======================================
// LOGOUT HELPER
// ======================================

async function handleLogout() {
    await supabaseClient.auth.signOut();
    sessionStorage.clear();
    window.location.replace("login.html");
}
