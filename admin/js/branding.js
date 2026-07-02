// ======================================
// THOR DISPLAY CMS
// Branding Manager
// ======================================

async function initBrandingPage() {

    const companyName = document.getElementById("companyName");
    const welcomeText = document.getElementById("welcomeText");

    const saveButton = document.getElementById("saveBranding");

    const logoFile = document.getElementById("logoFile");
    const backgroundFile = document.getElementById("backgroundFile");

    const logoPreview = document.getElementById("logoPreview");
    const backgroundPreview = document.getElementById("backgroundPreview");

    const uploadLogo = document.getElementById("uploadLogo");
    const uploadBackground = document.getElementById("uploadBackground");

    if (!companyName) return;

    // -----------------------
    // Load branding
    // -----------------------

    async function loadBranding() {

        const { data, error } = await supabaseClient
            .from("branding")
            .select("*")
            .limit(1)
            .single();

        if (error) {

            console.error(error);
            return;

        }

        companyName.value = data.company_name || "";
        welcomeText.value = data.welcome_text || "";

        if (data.logo_url) {

            logoPreview.src =
                data.logo_url + "?t=" + Date.now();

            logoPreview.style.display = "block";

        }

        if (data.background_url) {

            backgroundPreview.src =
                data.background_url + "?t=" + Date.now();

            backgroundPreview.style.display = "block";

        }

    }

    // -----------------------
    // Save text
    // -----------------------

    saveButton.onclick = async () => {

        const { error } = await supabaseClient
            .from("branding")
            .update({

                company_name: companyName.value,

                welcome_text: welcomeText.value

            })
            .eq("id", 1);

        if (error) {

            alert(error.message);
            return;

        }

        alert("Branding saved.");

    };

    // -----------------------
    // Logo preview
    // -----------------------

    logoFile.onchange = () => {

        const file = logoFile.files[0];

        if (!file) return;

        logoPreview.src = URL.createObjectURL(file);

        logoPreview.style.display = "block";

    };

    // -----------------------
    // Upload logo
    // -----------------------

    uploadLogo.onclick = async () => {

        const file = logoFile.files[0];

        if (!file) {

            alert("Choose a logo first.");
            return;

        }

        const { error } = await supabaseClient.storage
            .from("display")
            .upload("logo/logo.png", file, {

                upsert: true

            });

        if (error) {

            alert(error.message);
            return;

        }

        const url = supabaseClient.storage
            .from("display")
            .getPublicUrl("logo/logo.png")
            .data.publicUrl;

        await supabaseClient
            .from("branding")
            .update({

                logo_url: url

            })
            .eq("id", 1);

        alert("Logo uploaded.");

        loadBranding();

    };

    // -----------------------
    // Background preview
    // -----------------------

    backgroundFile.onchange = () => {

        const file = backgroundFile.files[0];

        if (!file) return;

        backgroundPreview.src =
            URL.createObjectURL(file);

        backgroundPreview.style.display = "block";

    };

    // -----------------------
    // Upload background
    // -----------------------

    uploadBackground.onclick = async () => {

        const file = backgroundFile.files[0];

        if (!file) {

            alert("Choose a background first.");
            return;

        }

        const { error } = await supabaseClient.storage
            .from("display")
            .upload("background/background.jpg", file, {

                upsert: true

            });

        if (error) {

            alert(error.message);
            return;

        }

        const url = supabaseClient.storage
            .from("display")
            .getPublicUrl("background/background.jpg")
            .data.publicUrl;

        await supabaseClient
            .from("branding")
            .update({

                background_url: url

            })
            .eq("id", 1);

        alert("Background uploaded.");

        loadBranding();

    };

    loadBranding();

}
