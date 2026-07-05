// ======================================
// THOR DISPLAY CMS
// Ticker Module
// ======================================

let tickerTimer = null;

async function loadTicker() {

    const ticker = document.getElementById("tickerText");

    if (!ticker) return;

    const { data, error } = await supabaseClient
        .from("ticker")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {

        console.error("Ticker:", error);

        ticker.innerHTML =
            "📢 Welcome • Stay Safe";

        return;

    }

    if (!data.enabled) {

        ticker.innerHTML = "";

        return;

    }

    ticker.innerHTML = data.message;

}

function startTicker() {

    if (tickerTimer) {

        clearInterval(tickerTimer);

    }

    loadTicker();

    tickerTimer = setInterval(

        loadTicker,

        60000

    );

}

function stopTicker() {

    if (tickerTimer) {

        clearInterval(tickerTimer);

        tickerTimer = null;

    }

}
