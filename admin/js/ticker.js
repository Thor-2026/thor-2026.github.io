// ======================================
// THOR DISPLAY CMS
// Ticker Manager
// ======================================

async function initTickerPage() {

    const message = document.getElementById("tickerMessage");
    const enabled = document.getElementById("tickerEnabled");
    const save = document.getElementById("saveTicker");

    if (!message) return;

    // -------------------------
    // Load ticker
    // -------------------------

    async function loadTicker() {

        const { data, error } = await supabaseClient
            .from("ticker")
            .select("*")
            .eq("id", 1)
            .single();

        if (error) {

            console.error(error);
            return;

        }

        message.value = data.message || "";
        enabled.checked = data.enabled;

    }

    // -------------------------
    // Save ticker
    // -------------------------

    save.onclick = async () => {

        const { error } = await supabaseClient
            .from("ticker")
            .update({

                message: message.value,

                enabled: enabled.checked,

                updated_at: new Date().toISOString()

            })
            .eq("id", 1);

        if (error) {

            alert(error.message);
            return;

        }

        alert("Ticker updated successfully.");

    };

    loadTicker();

}
