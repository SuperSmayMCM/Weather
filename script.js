document.addEventListener('DOMContentLoaded', () => {

    let count = 0;

    const weatherWidget = document.getElementById('weather-widget');
    const weatherDisplay = document.getElementById('weather-display');

    // --- Hardcoded Location ---
    // Coordinates for Madison Children's Museum
    const lat = 43.0731;
    const lon = -89.4012;

    // Mapping from NWS icon urls to weather-icons class names
    const iconMapDay = {
        "skc": "wi-day-sunny",
        "few": "wi-day-sunny-overcast",
        "sct": "wi-day-cloudy",
        "bkn": "wi-cloudy",
        "ovc": "wi-cloudy",
        "wind_skc": "wi-day-windy",
        "wind_few": "wi-day-windy",
        "wind_sct": "wi-day-windy",
        "wind_bkn": "wi-day-windy",
        "wind_ovc": "wi-day-windy",
        "snow": "wi-snow",
        "rain_snow": "wi-rain-mix",
        "rain_sleet": "wi-rain-mix",
        "snow_sleet": "wi-snow",
        "fz_ra": "wi-rain-mix",
        "fz_sn": "wi-snow",
        "fz_rain_snow": "wi-rain-mix",
        "fz_rain_sleet": "wi-rain-mix",
        "fz_snow_sleet": "wi-snow",
        "rain": "wi-rain",
        "rain_showers": "wi-showers",
        "rain_showers_hi": "wi-showers",
        "tsra": "wi-thunderstorm",
        "tsra_sct": "wi-thunderstorm",
        "tsra_hi": "wi-thunderstorm",
        "tornado": "wi-tornado",
        "hurricane": "wi-hurricane",
        "tropical_storm": "wi-hurricane",
        "dust": "wi-dust",
        "smoke": "wi-smoke",
        "haze": "wi-day-haze",
        "fog": "wi-fog",
        "hot": "wi-hot",
        "cold": "wi-snowflake-cold",
        "blizzard": "wi-snow-wind"
    };

    const iconMapNight = {
        "skc": "wi-night-clear",
        "few": "wi-night-partly-cloudy",
        "sct": "wi-night-cloudy",
        "bkn": "wi-cloudy",
        "ovc": "wi-cloudy",
        "wind_skc": "wi-night-alt-cloudy-windy",
        "wind_few": "wi-night-alt-cloudy-windy",
        "wind_sct": "wi-night-alt-cloudy-windy",
        "wind_bkn": "wi-night-alt-cloudy-windy",
        "wind_ovc": "wi-night-alt-cloudy-windy",
        "snow": "wi-snow",
        "rain_snow": "wi-rain-mix",
        "rain_sleet": "wi-rain-mix",
        "snow_sleet": "wi-snow",
        "fz_ra": "wi-rain-mix",
        "fz_sn": "wi-snow",
        "fz_rain_snow": "wi-rain-mix",
        "fz_rain_sleet": "wi-rain-mix",
        "fz_snow_sleet": "wi-snow",
        "rain": "wi-rain",
        "rain_showers": "wi-showers",
        "rain_showers_hi": "wi-showers",
        "tsra": "wi-thunderstorm",
        "tsra_sct": "wi-thunderstorm",
        "tsra_hi": "wi-thunderstorm",
        "tornado": "wi-tornado",
        "hurricane": "wi-hurricane",
        "tropical_storm": "wi-hurricane",
        "dust": "wi-dust",
        "smoke": "wi-smoke",
        "haze": "wi-night-haze",
        "fog": "wi-fog",
        "hot": "wi-hot",
        "cold": "wi-snowflake-cold",
        "blizzard": "wi-snow-wind"
    };

    function showError(message) {
        weatherDisplay.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
    }

    async function fetchWeather() {

        count++;

        try {
            // 1. Get the forecast office and URL
            const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
            if (!pointsResponse.ok) {
                throw new Error(`HTTP error! Status: ${pointsResponse.status}`);
            }
            const pointsData = await pointsResponse.json();
            const forecastUrl = pointsData.properties.forecastHourly;

            // 2. Get the hourly forecast
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error(`HTTP error! Status: ${forecastResponse.status}`);
            }
            const forecastData = await forecastResponse.json();
            
            // Get the first period (current conditions)
            const current = forecastData.properties.periods[0];

            let iconClassname = null;
            try {
                let iconUrlData;
                iconUrlData = current.icon.split('/')[current.icon.split('/').length - 1].split('?')[0].split(',')[0];
                iconUrlTime = current.icon.split('/')[current.icon.split('/').length - 2];
                if (iconUrlTime === "night") {
                    iconClassname = iconMapNight[iconUrlData]
                } else {
                    iconClassname = iconMapDay[iconUrlData]
                }
            } catch (error) {
                console.error("Error extracting icon code:", error);
            }

            const conditionsDiv = document.createElement('div');
            conditionsDiv.classList.add('conditions');

            if (iconClassname) {
                const iconHTML = document.createElement('i');
                iconHTML.classList.add('wi', iconClassname, 'condition', 'weather-icon');
                conditionsDiv.appendChild(iconHTML);
            }
            const tempHTML = document.createElement('p');
            tempHTML.classList.add('temperature', 'condition');
            tempHTML.textContent = `${current.temperature}°${current.temperatureUnit}`;
            conditionsDiv.appendChild(tempHTML);

            const shortForecastHTML = document.createElement('p');
            shortForecastHTML.classList.add('description', );
            shortForecastHTML.textContent = current.shortForecast;

            const weatherHTML = document.createElement('div');
            weatherHTML.appendChild(conditionsDiv);
            weatherHTML.appendChild(shortForecastHTML);
            weatherDisplay.innerHTML = '';
            weatherDisplay.appendChild(weatherHTML);

            weatherWidget.style.visibility = "visible";

        } catch (err) {
            showError(`Could not fetch weather data. Please try again later. (${err.message})`);
            setTimeout(() => {
                weatherWidget.style.visibility = "hidden";
            }, 10000);
        }

        setTimeout(fetchWeather, 600000);
    }

    fetchWeather();
});