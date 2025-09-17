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

            // Calculate wind chill https://www.weather.gov/safety/cold-wind-chill-chart
            let windChill = Math.round(35.74 + 0.6215 * current.temperature - 35.75 * Math.pow(current.windSpeed, 0.16) + 0.4275 * current.temperature * Math.pow(current.windSpeed, 0.16));
            // Only apply wind chill if temperature is 50°F or below and wind speed is above 3 mph
            if (current.temperature > 50 || parseInt(current.windSpeed) <= 3) {
                windChill = current.temperature;
            }

            // Calculate heat index https://www.weather.gov/ama/heatindex
            let heatIndex = Math.round(-42.379 + (2.04901523 * current.temperature) + (10.14333127 * current.relativeHumidity.value) - (0.22475541 * current.temperature * current.relativeHumidity.value) - (0.00683783 * Math.pow(current.temperature, 2)) - (0.05481717 * Math.pow(current.relativeHumidity.value, 2)) + (0.00122874 * Math.pow(current.temperature, 2) * current.relativeHumidity.value) + (0.00085282 * current.temperature * Math.pow(current.relativeHumidity.value, 2)) - (0.00000199 * Math.pow(current.temperature, 2) * Math.pow(current.relativeHumidity.value, 2)));
            // Only apply heat index if temperature is 80°F or above and relative humidity is 40% or above
            if (current.temperature < 80 || current.relativeHumidity.value < 40) {
                heatIndex = current.temperature;
            }

            // Use wind chill if applicable, otherwise use heat index
            if (windChill < current.temperature) {
                current.apparentTemperature = windChill;
            } else if (heatIndex > current.temperature) {
                current.apparentTemperature = heatIndex;
            } else {
                current.apparentTemperature = current.temperature;
            }

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

            const feelsLikeHTML = document.createElement('p');
            feelsLikeHTML.classList.add('feels-like', 'condition');
            feelsLikeHTML.textContent = `Feels like:`;
            const feelsLikeTempHTML = document.createElement('span');
            feelsLikeTempHTML.classList.add('feels-like-temp');
            feelsLikeTempHTML.textContent = ` ${current.apparentTemperature}°${current.temperatureUnit}`;
            feelsLikeHTML.appendChild(feelsLikeTempHTML);

            const weatherHTML = document.createElement('div');
            weatherHTML.appendChild(conditionsDiv);
            weatherHTML.appendChild(feelsLikeHTML);
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