// ======================================
// THOR DISPLAY CMS
// Weather Module
// ======================================

let weatherTimer = null;

async function loadWeather() {

    const settings = getSettings();

    try {

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${settings.latitude}&longitude=${settings.longitude}&current=temperature_2m,weather_code`;

        const response = await fetch(url);

        const data = await response.json();

        let temp = data.current.temperature_2m;

        let unit = "°C";

        if (settings.temperature_unit === "F") {

            temp = (temp * 9 / 5) + 32;

            unit = "°F";

        }

        const temperature = document.getElementById("temperature");

        if (temperature) {

            temperature.textContent =
                Math.round(temp) + unit;

        }

        const city = document.getElementById("weatherCity");

        if (city) {

            city.textContent = "📍 " + settings.city;

        }

        const code = data.current.weather_code;

        let icon = "☀️";
        let text = "Clear";

        if (code >= 1 && code <= 3) {

            icon = "⛅";
            text = "Partly Cloudy";

        }
        else if (code >= 45 && code <= 48) {

            icon = "🌫️";
            text = "Fog";

        }
        else if (code >= 51 && code <= 67) {

            icon = "🌧️";
            text = "Rain";

        }
        else if (code >= 71 && code <= 86) {

            icon = "❄️";
            text = "Snow";

        }
        else if (code >= 95) {

            icon = "⛈️";
            text = "Thunderstorm";

        }

        const weatherIcon = document.getElementById("weatherIcon");

        if (weatherIcon) {

            weatherIcon.textContent = icon;

        }

        const weatherText = document.getElementById("weatherText");

        if (weatherText) {

            weatherText.textContent = text;

        }

        const updated = document.getElementById("weatherUpdated");

        if (updated) {

            updated.textContent =
                "Updated: " +
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });

        }

    }

    catch (err) {

        console.error(err);

        const weatherText = document.getElementById("weatherText");

        if (weatherText) {

            weatherText.textContent = "Offline";

        }

    }

}

function startWeather() {

    const settings = getSettings();

    if (weatherTimer) {

        clearInterval(weatherTimer);

    }

    loadWeather();

    weatherTimer = setInterval(

        loadWeather,

        settings.weather_minutes * 60 * 1000

    );

}

function stopWeather() {

    if (weatherTimer) {

        clearInterval(weatherTimer);

        weatherTimer = null;

    }

}
