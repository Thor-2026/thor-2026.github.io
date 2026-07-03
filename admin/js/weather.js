
// ======================================
// THOR DISPLAY CMS
// Weather Manager
// ======================================

async function initWeatherPage() {

    const city = document.getElementById("city");
    const latitude = document.getElementById("latitude");
    const longitude = document.getElementById("longitude");

    const saveButton = document.getElementById("saveWeather");

    if (!city) return;

    // -----------------------
    // Load Settings
    // -----------------------

    async function loadWeatherSettings() {

        const { data, error } = await supabaseClient
            .from("settings")
            .select("*")
            .eq("id", 1)
            .single();

        if (error) {
            console.error(error);
            return;
        }

        city.value = data.city || "";
        latitude.value = data.latitude || "";
        longitude.value = data.longitude || "";

    }

    // -----------------------
    // Save Settings
    // -----------------------

    saveButton.onclick = async () => {

        const { error } = await supabaseClient
            .from("settings")
            .update({

                city: city.value,

                latitude: parseFloat(latitude.value),

                longitude: parseFloat(longitude.value),

                updated_at: new Date().toISOString()

            })
            .eq("id", 1);

        if (error) {

            alert(error.message);
            return;

        }

        alert("Weather settings saved successfully.");

    };

    loadWeatherSettings();

}
