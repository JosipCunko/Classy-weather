import { useState, useEffect, useRef } from "react";
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
// function convertToFlag(countryCode) {
//   const codePoints = countryCode
//     .toUpperCase()
//     .split("")
//     .map((char) => 127397 + char.charCodeAt());
//   return String.fromCodePoint(...codePoints);
// }

//
//
//

export default function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  let countryFlag = useRef("");
  const inputRef = useRef(null);

  useEffect(
    function () {
      async function getWeather(location) {
        if (location.length < 2) {
          return setWeather({});
        }
        const abortController = new AbortController();

        try {
          setIsLoading(true);
          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
            { signal: abortController.signal }
          );
          const geoData = await geoRes.json();
          if (!geoData.results) throw new Error("Location not found");

          const { latitude, longitude, timezone, name, country } =
            geoData.results.at(0);
          countryFlag.current = `${name}, ${country}`;

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );

          const weatherData = await weatherRes.json();
          setWeather(weatherData.daily);
          setError("");
        } catch (err) {
          console.error(err.message);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      getWeather(location);
    },
    [location]
  );

  function handleSubmit(e) {
    e.preventDefault();
    setLocation(inputRef.current.value);
  }

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input location={location} onSubmit={handleSubmit} reference={inputRef} />
      {isLoading ? (
        <p className="loader">Loading...</p>
      ) : error ? (
        <p className="loader">{error}</p>
      ) : (
        Object.keys(weather).length > 0 && (
          <Weather weather={weather} countryFlag={countryFlag} />
        )
      )}
    </div>
  );
}
function Input({ onSubmit, reference }) {
  return (
    <form action="" onSubmit={onSubmit}>
      <input
        ref={reference}
        type="text"
        placeholder="Search from location..."
      />
    </form>
  );
}
function Weather({ weather, countryFlag }) {
  return (
    <div>
      <h2>Weather for {countryFlag.current}</h2>
      <ul className="weather">
        {weather.time.map((date, i) => (
          <Day
            date={date}
            max={weather.temperature_2m_max.at(i)}
            min={weather.temperature_2m_min.at(i)}
            code={weather.weathercode.at(i)}
            key={i + 1}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}
function Day({ isToday, code, date, max, min }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
