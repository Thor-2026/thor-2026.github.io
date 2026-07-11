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

    if (!session) {

        window.location.href = "login.html";

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

        window.location.href = "login.html";

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

        window.location.href =

            "change-password.html";

        return;

    }

    if (

        !profile.must_change_password &&

        currentPage === "change-password.html"

    ) {

        window.location.href =

            "dashboard.html";

        return;

    }

    supabaseClient.auth.onAuthStateChange((event) => {

        if (event === "SIGNED_OUT") {

            window.location.href = "login.html";

        }

    });

})();
