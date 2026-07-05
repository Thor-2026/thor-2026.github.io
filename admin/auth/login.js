// ======================================
// THOR DISPLAY CMS
// Login Page
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadBranding();

});

// --------------------------------------
// Load Branding
// --------------------------------------

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

    // Logo

    const logo = document.getElementById("loginLogo");

    if (logo && data.logo_url) {

        logo.src = data.logo_url;

    }

    // Background

    if (data.background_url) {

        document.body.style.backgroundImage =
            `linear-gradient(rgba(8,15,35,.75),rgba(8,15,35,.75)), url(${data.background_url})`;

        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";

    }

}
