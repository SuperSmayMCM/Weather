document.addEventListener('DOMContentLoaded', () => {
    // Pull secrets that are loaded into window.secrets from secrets.js
    secrets = window.secrets;

    weatherWidget = document.getElementById('weather-widget');
    weatherDisplay = document.getElementById('weather-display');
    airQualityDisplay = document.getElementById('air-quality-display');

    fetchWeather();
    fetchAirQuality();

    setInterval(fetchWeather, 600000);  // Refresh weather every 10 minutes
    setInterval(fetchAirQuality, 600000);  // Refresh air quality every 10 minutes
});

// To be populated from secrets.js
// This is needed because BrightSign uses file:// instead of a real web server, which blocks fetch from other local files
        
let secrets;

let count = 0;

    // From https://www.svgrepo.com/svg/121755/warning-symbol
let alertIconHTML = `<svg class="alert-icon" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 466.705 466.705" xml:space="preserve">
            <path d="M459.925,358.907L269.505,61.503c-7.893-12.323-21.518-19.776-36.145-19.776c-14.628,0-28.254,7.453-36.146,19.776
            L6.78,358.907c-8.462,13.209-9.047,29.987-1.511,43.752c7.522,13.757,21.964,22.319,37.655,22.319h380.854
            c15.691,0,30.134-8.555,37.656-22.319C468.972,388.894,468.387,372.116,459.925,358.907z M209.453,162.607
            c0-13.078,10.605-23.675,23.675-23.675c13.072,0,23.676,10.597,23.676,23.675v101.584c0,13.078-10.604,23.675-23.676,23.675
            c-13.07,0-23.675-10.597-23.675-23.675V162.607z M232.682,373.613c-16.338,0-29.594-13.249-29.594-29.594
            c0-16.347,13.256-29.594,29.594-29.594c16.339,0,29.595,13.247,29.595,29.594C262.276,360.364,249.021,373.613,232.682,373.613z"/>
            </svg>`;

// Will be populated on DOMContentLoaded
let weatherWidget;
let weatherDisplay;
let airQualityDisplay;

// --- Hardcoded Location ---
// Coordinates for Madison Children's Museum
let lat = 43.0731;
let lon = -89.4012;

// Only show alerts *above* these levels
// AQI category cutoff (1=Good, 2=Moderate, 3=Unhealthy for Sensitive Groups, 4=Unhealthy, 5=Very Unhealthy, 6=Hazardous)
let aqiCategoryCutoff = 2;
// Alert severity cutoff ("", "Minor", "Moderate", "Severe", "Extreme")
let alertSeverityCutoff = "Moderate";

// Returns true if the given severity is above the cutoff
// Note: This is above, not equal to
function alertSeverityAboveCutoff(severity) {
    const severities = ["", "Minor", "Moderate", "Severe", "Extreme"];
    return severities.indexOf(severity) > severities.indexOf(alertSeverityCutoff);
}

function alertEffectiveNow(effectiveString) {
    const effectiveDate = new Date(effectiveString);
    const now = new Date();
    return now >= effectiveDate;
}

// Testing coordinates
// let lat = 35.86;
// let lon = -102.01;

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

function showWeatherError(message) {
    weatherDisplay.innerHTML = '';
    const errorHTML = document.createElement('p');
    errorHTML.innerText = `Error: ${message}`;
    errorHTML.style.color = "red";
    weatherDisplay.appendChild(errorHTML);
}

function showAirQualityError(message) {
    airQualityDisplay.innerHTML = '';
    const errorHTML = document.createElement('p');
    errorHTML.innerText = `Error: ${message}`;
    errorHTML.style.color = "red";
    airQualityDisplay.appendChild(errorHTML);
}

async function fetchWeather() {

    count++;

    try {
        // 1. Get the closest observation point
        const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
        if (!pointsResponse.ok) {
            throw new Error(`HTTP error! Status: ${pointsResponse.status}`);
        }
        const pointsData = await pointsResponse.json();
        const stationsUrl = pointsData.properties.observationStations;
        // const forecastUrl = pointsData.properties.forecastHourly;

        // 2. Get the list of nearby stations
        const stationsResponse = await fetch(stationsUrl, {
            method: 'GET',
            cache: 'no-store',
            
            headers: {
                'User-Agent': '(MadisonChildrensMuseumWelcomeWall, tech-help@madisonchildrensmuseum.org)',
            }
        });
        if (!stationsResponse.ok) {
            throw new Error(`HTTP error! Status: ${stationsResponse.status}`);
        }
        const stationsData = await stationsResponse.json();
        const closestStationId = stationsData.features[0].properties.stationIdentifier;

        // 3. Get the current observation from the closest station
        const observationResponse = await fetch(`https://api.weather.gov/stations/${closestStationId}/observations/latest`, {
            method: 'GET',
            cache: 'no-store',
            
            headers: {
                'User-Agent': '(MadisonChildrensMuseumWelcomeWall, tech-help@madisonchildrensmuseum.org)',
            }
        });
        if (!observationResponse.ok) {
            throw new Error(`HTTP error! Status: ${observationResponse.status}`);
        }
        const observationData = await observationResponse.json();

        // 4. Get the current alerts
        const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
            method: 'GET',
            cache: 'no-store',
            
            headers: {
                'User-Agent': '(MadisonChildrensMuseumWelcomeWall, tech-help@madisonchildrensmuseum.org)',
            }
        });
        if (!alertsResponse.ok) {
            throw new Error(`HTTP error! Status: ${alertsResponse.status}`);
        }
        const alertsData = await alertsResponse.json();


        // Construct current weather object
        // This is because the observation API and forecast API return different data structures, and this code was originally written for the forecast API
        // In case we need to revert to using the forecast API later, we keep the same structure.
        // See previous commits for heat index and wind chill code.
        let current = {
            temperature: observationData.properties.temperature.unitCode == "wmoUnit:degC" ? Math.round((observationData.properties.temperature.value * 9/5) + 32) : Math.round(observationData.properties.temperature.value), // Convert to Fahrenheit
            temperatureUnit: "F",
            relativeHumidity: {
                value: Math.round(observationData.properties.relativeHumidity.value)
            },
            windSpeed: observationData.properties.windSpeed.unitCode == "wmoUnit:km_h-1" ? Math.round(observationData.properties.windSpeed.value * 2.237) : Math.round(observationData.properties.windSpeed.value), // Convert to mph
            icon: observationData.properties.icon,
            shortForecast: observationData.properties.textDescription,

        };

        // Get Wind Chill and Heat Index from observation API
        if (observationData.properties.windChill.value !== null) {
            current.windChill = observationData.properties.windChill.value
            if (observationData.properties.windChill.unitCode == "wmoUnit:degC") {
                current.windChill = Math.round((observationData.properties.windChill.value * 9/5) + 32); // Convert to Fahrenheit
            }   
        } else {
            current.windChill = current.temperature;
        }

        if (observationData.properties.heatIndex.value !== null) {
            current.heatIndex = observationData.properties.heatIndex.value
            if (observationData.properties.heatIndex.unitCode == "wmoUnit:degC") {
                current.heatIndex = Math.round((observationData.properties.heatIndex.value * 9/5) + 32); // Convert to Fahrenheit
            }
        } else {
            current.heatIndex = current.temperature;
        }

        // Set apparent temperature to wind chill or heat index as appropriate
        if (current.windChill < current.temperature) {
            current.apparentTemperature = current.windChill;
        } else if (current.heatIndex > current.temperature) {
            current.apparentTemperature = current.heatIndex;
        } else {
            current.apparentTemperature = current.temperature;
        }


        let iconClassname = null;
        try {
            let iconUrlData = current.icon.split('/')[current.icon.split('/').length - 1].split('?')[0].split(',')[0];
            let iconUrlTime = current.icon.split('/')[current.icon.split('/').length - 2];
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

        const alertHTML = document.createElement('div');
        alertHTML.classList.add("info-container");

        // Find highest severity alert
        let highestSeverityFeature = null;
        if (alertsData.features.length > 0) {
            for (const feature of alertsData.features) {
                const currentSeverity = feature.properties.severity;
                if (!highestSeverityFeature) {
                    highestSeverityFeature = feature;
                } else if (highestSeverityFeature.properties.severity === "Minor" && (currentSeverity === "Moderate" || currentSeverity === "Severe" || currentSeverity === "Extreme")) {
                    highestSeverityFeature = feature;
                } else if (highestSeverityFeature.properties.severity === "Moderate" && (currentSeverity === "Severe" || currentSeverity === "Extreme")) {
                    highestSeverityFeature = feature;
                } else if (highestSeverityFeature.properties.severity === "Severe" && currentSeverity === "Extreme") {
                    highestSeverityFeature = feature;
                }
            }
        }

        // If we found an alert above minor, and it is currently in effect, display it
        if (highestSeverityFeature && alertSeverityAboveCutoff(highestSeverityFeature.properties.severity) && alertEffectiveNow(highestSeverityFeature.properties.effective)) {
            let showAlertIcon = false;

            // Pick color based on alert severity
            if (highestSeverityFeature.properties.severity === "Severe" || highestSeverityFeature.properties.severity === "Extreme") {
                alertHTML.classList.add("alert-severe");
            } else if (highestSeverityFeature.properties.severity === "Moderate") {
                alertHTML.classList.add("alert-moderate");
            } else if (highestSeverityFeature.properties.severity === "Minor" || highestSeverityFeature.properties.severity === "Unknown") {
                alertHTML.classList.add("alert-minor");
            }
            

            const alertText = document.createElement('p');
            if (showAlertIcon) {
                alertHTML.innerHTML = alertIconHTML;
            }
            alertHTML.appendChild(alertText);
            alertText.classList.add('info-text');

            const alertTextFromAPI = highestSeverityFeature.properties.event;
            if (alertTextFromAPI) {
                alertText.innerText = alertTextFromAPI;
            }

        } else {
            alertHTML.style.display = "none";
        }
    
        const weatherHTML = document.createElement('div');
        weatherHTML.appendChild(conditionsDiv);
        weatherHTML.appendChild(feelsLikeHTML);
        weatherHTML.appendChild(shortForecastHTML);
        weatherHTML.appendChild(alertHTML);
        weatherDisplay.innerHTML = '';
        weatherDisplay.appendChild(weatherHTML);

        weatherWidget.style.visibility = "visible";

    } catch (err) {
        showWeatherError(`Could not fetch weather data. Please try again later. (${err.message})`);
        setTimeout(() => {
            weatherWidget.style.visibility = "hidden";
        }, 10000);
    }

}

async function fetchAirQuality() {

    count++;

    try {
        
        const airnowAPIKey = secrets.airnowApiKey;

        // Get AQI data from AirNow API
        // We can't use AbortSignal.timeout because I guess BrightSign doesn't support it?
        const aqiResponse = await fetch(`https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${airnowAPIKey}`, { cache: 'no-cache' });
        if (!aqiResponse.ok) {
            console.log(aqiResponse);
            throw new Error(`HTTP error! Status: ${aqiResponse.status}`);
        }
        const aqiData = await aqiResponse.json()

        let maxPollutantType;

        // 2. Find the highest AQI value
        for (const pollutantType of aqiData) {
            if (maxPollutantType) {
                if (pollutantType.AQI > maxPollutantType.AQI) {
                    maxPollutantType = pollutantType;
                } 
            } else {
                maxPollutantType = pollutantType;
            }
        }

        // If we failed to get data:
        if (maxPollutantType == undefined) {
            throw new Error(`Failed to find max AQI pollutant. API returned ${aqiData}`)
        }

        // Override for testing
        //  maxPollutantType = {AQI: 200, Category:{Number:5,Name:"Good"}}

        // 3. Display HTML
        let airQualityCategory = ""
        let showIcon = false

        switch (maxPollutantType.Category.Number) {
            case 1:
                airQualityCategory = "good";
                break;
            case 2:
                airQualityCategory = "moderate";
                break;
            case 3:
                airQualityCategory = "unhealthy-sensitive";
                break;
            case 4:
                airQualityCategory = "unhealthy";
                showIcon = true;
                break;
            case 5:
                airQualityCategory = "very-unhealthy";
                showIcon = true;
                break;
            case 6:
                airQualityCategory = "hazardous";
                showIcon = true;
                break;
        }

        const aqiDiv = document.createElement('div');
        aqiDiv.classList.add('info-container');
        aqiDiv.classList.add(`aqi-${airQualityCategory}`)

        

        if (showIcon) {
            aqiDiv.innerHTML = alertIconHTML;
        }
        

        const aqiText = document.createElement('p');
        aqiText.classList.add('info-text');
        aqiText.textContent = `Outdoor AQI: ${maxPollutantType.AQI}`;
        aqiDiv.appendChild(aqiText);

        airQualityDisplay.innerHTML = '';
        airQualityDisplay.appendChild(aqiDiv);

        // Ignore low values
        if (maxPollutantType.Category.Number <= aqiCategoryCutoff) {
            airQualityDisplay.style.display = "none";
        } else {
            airQualityDisplay.style.display = "flex";
        }


    } catch (err) {
        showAirQualityError(`Could not fetch air quality data. Please try again later. (${err.message})`);
        setTimeout(() => {
            airQualityDisplay.style.display = "none";
        }, 10000);
    }

}