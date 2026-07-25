// ======================================
// THOR DISPLAY CMS
// Authentication Guard, Mobile Tab Fix & Inactivity Monitor
// ======================================

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes
const MOBILE_TAB_CLOSE_THRESHOLD_MS = 5000;  // 5 Seconds threshold for tab/browser close
let idleTimer = null;

(async () => {

    // 1. Check if the user closed the tab/browser previously (Mobile Tab Closure Fix)
    const lastActiveTime = window.sessionStorage.getItem("last_active_timestamp");
    const now = Date.now();

    if (lastActiveTime && (now - parseInt(lastActiveTime, 10)) > MOBILE_TAB_CLOSE_THRESHOLD_MS) {
        // Tab/Browser was closed or inactive beyond the threshold — force logout
        await handleLogout();
        return;
    }

    // 2. Fetch session from Supabase
    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    // If no session exists, boot them out immediately
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

    // Start active monitoring
    startInactivityTimer();

    // Keep updating active timestamp on user interaction & page unload
    setupTabLifecycleTracker();

    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            window.sessionStorage.clear();
            window.location.replace("login.html");
        }
    });

})();

// ======================================
// Tab Lifecycle & Heartbeat Tracker
// ======================================

function setupTabLifecycleTracker() {
    // Update timestamp immediately
    window.sessionStorage.setItem("last_active_timestamp", Date.now().toString());

    // Update timestamp periodically while actively viewing page
    setInterval(() => {
        if (document.visibilityState === "visible") {
            window.sessionStorage.setItem("last_active_timestamp", Date.now().toString());
        }
    }, 2000);

    // Track tab hide/close events on mobile browsers
    window.addEventListener("pagehide", () => {
        window.sessionStorage.setItem("last_active_timestamp", Date.now().toString());
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            window.sessionStorage.setItem("last_active_timestamp", Date.now().toString());
        }
    });
}

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
                }, 3000);
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
