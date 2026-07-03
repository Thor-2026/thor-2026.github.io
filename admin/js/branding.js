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
    // Load Branding
    // -----------------------

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

        companyName.value = data.company_name || "";
        welcomeText.value = data.welcome_text || "";

        if (data.logo_url) {
            logoPreview.src = data.logo_url + "?t=" + Date.now();
            logoPreview.style.display = "block";
        }

        if (data.background_url) {
            backgroundPreview.src = data.background_url + "?t=" + Date.now();
            backgroundPreview.style.display = "block";
        }

    }

    // -----------------------
    // Save Text
    // -----------------------

    saveButton.onclick = async () => {

        const { error } = await supabaseClient
            .from("branding")
            .update({
                company_name: companyName.value,
                welcome_text: welcomeText.value,
                updated_at: new Date().toISOString()
            })
            .eq("id", 1);

        if (error) {
            alert(error.message);
            return;
        }

        alert("Branding saved successfully.");

    };

    // -----------------------
    // Logo Preview
    // -----------------------

    logoFile.onchange = () => {

        if (!logoFile.files.length) return;

        logoPreview.src = URL.createObjectURL(logoFile.files[0]);
        logoPreview.style.display = "block";

    };

    // -----------------------
    // Upload Logo
    // -----------------------

    uploadLogo.onclick = async () => {

        if (!logoFile.files.length) {
            alert("Please choose a logo.");
            return;
        }

        const file = logoFile.files[0];

        const { error: uploadError } = await supabaseClient.storage
            .from("display")
            .upload("logo/logo.png", file, {
                upsert: true
            });

        if (uploadError) {
            alert(uploadError.message);
            return;
        }

        const logoUrl = supabaseClient.storage
            .from("display")
            .getPublicUrl("logo/logo.png")
            .data.publicUrl;

        const { error: dbError } = await supabaseClient
            .from("branding")
            .update({
                logo_url: logoUrl,
                updated_at: new Date().toISOString()
            })
            .eq("id", 1);

        if (dbError) {
            alert(dbError.message);
            return;
        }

        await loadBranding();

        alert("Logo uploaded successfully.");

    };

    // -----------------------
    // Background Preview
    // -----------------------

    backgroundFile.onchange = () => {

        if (!backgroundFile.files.length) return;

        backgroundPreview.src =
            URL.createObjectURL(backgroundFile.files[0]);

        backgroundPreview.style.display = "block";

    };

    // -----------------------
    // Upload Background
    // -----------------------

    uploadBackground.onclick = async () => {

        if (!backgroundFile.files.length) {
            alert("Please choose a background.");
            return;
        }

        const file = backgroundFile.files[0];

        const { error: uploadError } = await supabaseClient.storage
            .from("display")
            .upload("background/background.jpg", file, {
                upsert: true
            });

        if (uploadError) {
            alert(uploadError.message);
            return;
        }

        const backgroundUrl = supabaseClient.storage
            .from("display")
            .getPublicUrl("background/background.jpg")
            .data.publicUrl;

        const { error: dbError } = await supabaseClient
            .from("branding")
            .update({
                background_url: backgroundUrl,
                updated_at: new Date().toISOString()
            })
            .eq("id", 1);

        if (dbError) {
            alert(dbError.message);
            return;
        }

        await loadBranding();

        alert("Background uploaded successfully.");

    };

    loadBranding();

}
