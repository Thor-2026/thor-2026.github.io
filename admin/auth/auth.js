// ======================================
// THOR DISPLAY CMS
// Strict Tab Isolation & Auth Guard
// ======================================

(async () => {

    // 1. Isolate Tab Sessions: Check if this tab is brand new
    const isTabInitialized = sessionStorage.getItem("tab_session_active");

    if (!isTabInitialized) {
        // This is a newly opened tab — destroy any inherited session and force login
        await supabaseClient.auth.signOut();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // 2. Fetch active Supabase session
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // 3. Verify user profile and forced password changes
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
        await supabaseClient.auth.signOut();
        sessionStorage.clear();
        window.location.replace("login.html");
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

    // 4. Listen for logouts across the app
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            sessionStorage.clear();
            window.location.replace("login.html");
        }
    });

})();
