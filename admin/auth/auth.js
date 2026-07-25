// ======================================
// THOR DISPLAY CMS
// Authentication Guard & Inactivity Monitor
// ======================================

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes
let idleTimer = null;

(async () => {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    // If no session exists, boot them out immediately and overwrite history state
    if (!session) {
        window.location.replace("login.html");
        return;
    }

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

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    if (
        profile.must_change_password &&
        currentPage !== "change-password.html"
    ) {
        window.location.replace("change-password.html");
        return;
    }

    if (
        !profile.must_change_password &&
        currentPage === "change-password.html"
    ) {
        window.location.replace("dashboard.html");
        return;
    }

    // Start Inactivity Timer for active sessions
    startInactivityTimer();

    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            window.sessionStorage.clear();
            window.location.replace("login.html");
        }
    });

})();

// ======================================
// Inactivity Monitor & Session Cleansing
// ======================================

function startInactivityTimer() {
    resetIdleTimer();

    let throttleTimeout = null;
    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];

    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    resetIdleTimer();
                    throttleTimeout = null;
                }, 3000); // Throttled to execute at most once every 3 seconds
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

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.sessionStorage.clear();
    window.location.replace("login.html");
}
