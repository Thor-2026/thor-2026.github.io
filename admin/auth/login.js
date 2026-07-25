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

    const username = document.getElementById("username")?.value.trim().toLowerCase();
    const password = document.getElementById("password")?.value;
    const errorBox = document.getElementById("loginError");

    if (errorBox) errorBox.textContent = "";

    if (!username || !password) {
        if (errorBox) errorBox.textContent = "Please enter username and password.";
        return;
    }

    const email = `${username}@thor.local`;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        if (errorBox) errorBox.textContent = "Invalid username or password.";
        return;
    }

    // Explicitly flag this browser tab as authenticated
    sessionStorage.setItem("tab_session_active", "true");

    const user = data.user;

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .single();

    if (profileError) {
        if (errorBox) errorBox.textContent = profileError.message;
        return;
    }

    if (profile.must_change_password) {
        window.location.replace("change-password.html");
        return;
    }

    window.location.replace("dashboard.html");

}

// ======================================
// Existing Session Check
// ======================================

async function checkExistingSession() {

    const isTabActive = sessionStorage.getItem("tab_session_active");

    // Only redirect if this tab was initialized by a successful login
    if (!isTabActive) {
        return; 
    }

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
        window.location.replace("dashboard.html");
    }

}
