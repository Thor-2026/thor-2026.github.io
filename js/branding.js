// ======================================
// THOR DISPLAY CMS
// Branding Module
// ======================================

let brandingTimer = null;

async function loadBranding() {

    const { data, error } = await supabaseClient
        .from("branding")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {

        console.error("Branding:", error);

        return;

    }

    // -------------------------
    // Company Name
    // -------------------------

    const companyName = document.getElementById("companyName");

    if (companyName) {

        companyName.textContent =
            data.company_name || "THOR DISPLAY";

    }

    // -------------------------
    // Welcome Message
    // -------------------------

    const welcomeText = document.getElementById("welcomeText");

    if (welcomeText) {

        welcomeText.textContent =
            data.welcome_text || "";

    }

    // -------------------------
    // Display Title
    // -------------------------

    const displayTitle =
        document.getElementById("displayTitle");

    if (displayTitle && getSettings().display_title) {

        displayTitle.textContent =
            getSettings().display_title;

    }

    // -------------------------
    // Logo
    // -------------------------

    const logo =
        document.getElementById("logo");

    if (logo && data.logo_url) {

        logo.src =
            data.logo_url + "?t=" + Date.now();

    }

    // -------------------------
    // Background
    // -------------------------

    if (data.background_url) {

        document.body.style.backgroundImage =
            `url(${data.background_url}?t=${Date.now()})`;

        document.body.style.backgroundSize =
            "cover";

        document.body.style.backgroundPosition =
            "center";

        document.body.style.backgroundRepeat =
            "no-repeat";

    }

}

function startBranding() {

    if (brandingTimer) {

        clearInterval(brandingTimer);

    }

    loadBranding();

    brandingTimer = setInterval(

        loadBranding,

        60000

    );

}

function stopBranding() {

    if (brandingTimer) {

        clearInterval(brandingTimer);

        brandingTimer = null;

    }

}
