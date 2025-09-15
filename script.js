document.addEventListener('DOMContentLoaded', () => {

    let count = 0;

    const weatherWidget = document.getElementById('weather-widget');
    const weatherDisplay = document.getElementById('weather-display');

    // --- Hardcoded Location ---
    // Coordinates for Madison Children's Museum
    const lat = 43.07699;
    const lon = -89.38465;

    // Mapping from NWS icon urls to weather-icons class names
    const iconMap = {
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
        "blizzard": "wi-snow-wind",
        "na": "wi-na"
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

            let iconUrlData = null;
            try {
                iconUrlData = current.icon.split('/')[current.icon.split('/').length - 1].split('?')[0];
            } catch (error) {
                console.error("Error extracting icon code:", error);
            }

            const conditionsDiv = document.createElement('div');
            conditionsDiv.classList.add('conditions');

            if (iconUrlData && iconMap[iconUrlData]) {
                const iconHTML = document.createElement('i');
                iconHTML.classList.add('wi', iconMap[iconUrlData], 'condition', 'weather-icon');
                conditionsDiv.appendChild(iconHTML);
            }
            const tempHTML = document.createElement('p');
            tempHTML.classList.add('temperature', 'condition');
            tempHTML.textContent = `${current.temperature}°${current.temperatureUnit}`;
            conditionsDiv.appendChild(tempHTML);

            const shortForecastHTML = document.createElement('p');
            shortForecastHTML.classList.add('description', 'condition');
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