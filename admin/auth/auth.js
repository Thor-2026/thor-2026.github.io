// ======================================
// THOR DISPLAY CMS
// Authentication Guard
// ======================================

(async () => {

    const {

        data: { session }

    } = await supabaseClient.auth.getSession();

    // Not logged in

    if (!session) {

        window.location.href = "login.html";

        return;

    }

    // Keep session alive

    supabaseClient.auth.onAuthStateChange((event) => {

        if (event === "SIGNED_OUT") {

            window.location.href = "login.html";

        }

    });

})();
