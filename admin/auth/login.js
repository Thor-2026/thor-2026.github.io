// ======================================
// THOR DISPLAY CMS
// Login Controller
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadBranding();

    checkExistingSession();

    document
        .getElementById("loginButton")
        ?.addEventListener("click", login);

    document
        .getElementById("password")
        ?.addEventListener("keydown", e => {
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

    const logo = document.getElementById("loginLogo");

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

    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("loginError");

    errorBox.textContent = "";

    if (!username || !password) {
        errorBox.textContent = "Please enter username and password.";
        return;
    }

    const email = `${username}@thor.local`;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorBox.textContent = "Invalid username or password.";
        return;
    }

    // Set tab isolation token on successful login
    sessionStorage.setItem("tab_session_active", "true");

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
// Existing Session Verification
// ======================================

async function checkExistingSession() {

    const isTabInitialized = sessionStorage.getItem("tab_session_active");

    // If tab is new, purge session state so user has to enter credentials
    if (!isTabInitialized) {
        await supabaseClient.auth.signOut();
        sessionStorage.clear();
        return;
    }

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
        window.location.replace("dashboard.html");
    }

}
