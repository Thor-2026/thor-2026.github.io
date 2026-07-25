// ======================================
// THOR DISPLAY CMS
// Login
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadBranding();

    checkExistingSession();

    document
        .getElementById("loginButton")
        .addEventListener("click", login);

    document
        .getElementById("password")
        .addEventListener("keydown", e => {

            if (e.key === "Enter") {

                login();

            }

        });

});

// ======================================
// Branding
// ======================================

async function loadBranding() {

    const { data, error } = await supabaseClient
        .from("branding")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {

        console.error(error);

        return;

    }

    const logo =
        document.getElementById("loginLogo");

    if (logo && data.logo_url) {

        logo.src = data.logo_url;

    }

    if (data.background_url) {

        document.body.style.backgroundImage =
            `linear-gradient(rgba(8,15,35,.75),rgba(8,15,35,.75)),url(${data.background_url})`;

        document.body.style.backgroundSize = "cover";

        document.body.style.backgroundPosition = "center";

    }

}

// ======================================
// Login
// ======================================

async function login() {

    const username =
        document
        .getElementById("username")
        .value
        .trim()
        .toLowerCase();

    const password =
        document
        .getElementById("password")
        .value;

    const errorBox =
        document.getElementById("loginError");

    errorBox.textContent = "";

    if (!username || !password) {

        errorBox.textContent =
            "Please enter username and password.";

        return;

    }

    const email =
        `${username}@thor.local`;

    const { error } =
        await supabaseClient.auth.signInWithPassword({

            email,

            password

        });

    if (error) {

        errorBox.textContent =
            "Invalid username or password.";

        return;

    }

    // Clear any residual session timestamps on fresh login
    window.sessionStorage.removeItem("last_active_timestamp");

    const {

        data: profile,

        error: profileError

    } = await supabaseClient

        .from("profiles")

        .select("must_change_password")

        .eq("id", (await supabaseClient.auth.getUser()).data.user.id)

        .single();

    if (profileError) {

        errorBox.textContent = profileError.message;

        return;

    }

    if (profile.must_change_password) {

        window.location.replace("change-password.html");

        return;

    }

    window.location.replace("dashboard.html");

}

// ======================================
// Existing Session
// ======================================

async function checkExistingSession() {

    // Check if tab/app was closed beyond the threshold
    const lastActiveTime = window.sessionStorage.getItem("last_active_timestamp");
    const now = Date.now();
    const MOBILE_TAB_CLOSE_THRESHOLD_MS = 5000;

    if (lastActiveTime && (now - parseInt(lastActiveTime, 10)) > MOBILE_TAB_CLOSE_THRESHOLD_MS) {
        // Tab was closed — purge auth session immediately
        await supabaseClient.auth.signOut();
        window.sessionStorage.clear();
        return;
    }

    const {

        data: { session }

    } = await supabaseClient.auth.getSession();

    if (session) {

        window.location.replace("dashboard.html");

    }

}
