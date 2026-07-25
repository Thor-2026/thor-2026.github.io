// ======================================
// THOR DISPLAY CMS
// Tab Isolation Guard & Inactivity Monitor
// ======================================

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes
let idleTimer = null;

(async () => {

    // 1. Fetch current active Supabase session
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    // 2. Check tab initialization state
    const isTabActive = sessionStorage.getItem("tab_session_active");

    // If no active session OR opened in an unverified new tab -> Redirect to Login
    if (!session || !isTabActive) {
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // 3. Verify User Profile & Password Change State
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

    // 4. Start Inactivity Monitoring
    startInactivityTimer();

    // 5. Auth Listener
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            sessionStorage.clear();
            window.location.replace("login.html");
        }
    });

})();

// ======================================
// Inactivity Monitor Logic
// ======================================

function startInactivityTimer() {
    resetIdleTimer();

    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    let throttleTimeout = null;

    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
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
// Logout Helper
// ======================================

async function handleLogout() {
    await supabaseClient.auth.signOut();
    sessionStorage.clear();
    window.location.replace("login.html");
}
