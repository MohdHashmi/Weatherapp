 

import React, { useState, useEffect } from 'react';

const OPEN_METEO_API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";

function App() {
  const [currentTab, setCurrentTab] = useState("userWeather");
  const [coordinates, setCoordinates] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [apiError, setApiError] = useState(null);
  const [searchedCity, setSearchedCity] = useState("");

  useEffect(() => {
    const storedCoordinates = sessionStorage.getItem("user-coordinates");
    if (storedCoordinates) {
      setCoordinates(JSON.parse(storedCoordinates));
    }
  }, []);

  useEffect(() => {
    if (coordinates && currentTab === "userWeather") {
      fetchWeatherData(coordinates.lat, coordinates.lon);
    }
  }, [coordinates, currentTab]);

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setError(null);
    setApiError(null);
    setWeatherData(null);
    setSearchedCity(""); // Clear city heading on tab switch

    if (tab === "userWeather") {
      setSearchInput("");
      if (coordinates) {
        fetchWeatherData(coordinates.lat, coordinates.lon);
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoordinates = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
          setCoordinates(userCoordinates);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError("You denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              setError("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              setError("The request to get user location timed out.");
              break;
            default:
              setError("An unknown error occurred.");
          }
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${OPEN_METEO_API_BASE}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
      );
      const data = await res.json();
      
      if (!data.current_weather) throw new Error("Failed to fetch weather data");

      setWeatherData({
        temperature: data.current_weather.temperature,
        windSpeed: data.current_weather.windspeed,
        humidity: data.hourly.relative_humidity_2m[0],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city) => {
    setLoading(true);
    setError(null);
    setApiError(null);
    try {
      const geocodeRes = await fetch(`${GEOCODE_API_BASE}?name=${city}`);
      const geocodeData = await geocodeRes.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error("City not found");
      }

      const { latitude, longitude } = geocodeData.results[0];
      setSearchedCity(city); // Set city name for heading
      fetchWeatherData(latitude, longitude);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white p-6">
      <div className="flex flex-col items-center w-full max-w-2xl bg-gray-700 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Weather App</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => switchTab("userWeather")}
            className={`px-4 py-2 rounded-lg ${currentTab === "userWeather" ? "bg-blue-600" : "bg-gray-600"}`}
          >
            Your Weather
          </button>
          <button
            onClick={() => switchTab("searchWeather")}
            className={`px-4 py-2 rounded-lg ${currentTab === "searchWeather" ? "bg-blue-600" : "bg-gray-600"}`}
          >
            Search Weather
          </button>
        </div>

        {currentTab === "userWeather" && !coordinates && (
          <div className="text-center">
            <p className="text-xl mb-4">Allow Access To Get Weather Information</p>
            <button onClick={getLocation} className="bg-blue-600 py-2 px-4 rounded-lg">Grant Access</button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {currentTab === "searchWeather" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput) fetchWeatherByCity(searchInput);
            }}
            className="flex space-x-2 mb-4"
          >
            <input
              type="text"
              placeholder="Search for city ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-4 py-2 rounded-lg w-full"
            />
            <button type="submit" className="bg-blue-600 py-2 px-4 rounded-lg">Search</button>
          </form>
        )}

        {loading && <p className="text-center text-xl">Loading...</p>}

        {weatherData && !loading && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">
              {currentTab === "userWeather" && !searchedCity ? "Current Weather Info" : `Weather Info for ${searchedCity}`}
            </h2>
            <p className="text-lg">Temperature: {weatherData.temperature}°C</p>
            <p className="text-lg">Wind Speed: {weatherData.windSpeed} m/s</p>
            <p className="text-lg">Humidity: {weatherData.humidity}%</p>
          </div>
        )}

        {apiError && <p className="text-center text-red-500 mt-4">{apiError}</p>}
      </div>
    </div>
  );
}

export default App;

