// ======================================
// THOR DISPLAY CMS
// Authentication Guard
// ======================================

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
        await supabaseClient.auth.signOut();
        window.location.replace("login.html");
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

    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            // Overwrite browser history upon signing out
            window.location.replace("login.html");
        }
    });

})();
