// DOM declarations
const cityNameInput = document.querySelector("#city-name");
const searchForm = document.querySelector("#search-form");
const currentTemp = document.querySelector("#current-forecast #conditions");
const currentTempH3 = document.querySelector("#current-forecast h3");
const history = document.querySelector("#history");
const historyContainer = document.querySelector("#history .card-body");
const dailyCardContainer = document.querySelector("#daily-forecast");
const fiveDayHeader = document.querySelector("#five-day");

// Declares localCityArray in global variable
const localCityArray = [];

// Pulls in previous searches from localStorage
let oldSearch = JSON.parse(localStorage.getItem("searches"));

// Removes any null results stored in localStorage
if (oldSearch !== null) {
  for (let i = 0; i < oldSearch.length; i++) {
    if (oldSearch[i] === null) {
      oldSearch.splice(i, i + 1);
    } else {
      // Populates localCityArray to publish previous search buttons
      localCityArray.push(oldSearch[i]);
    }
  }
}

const updateSearchHistory = () => {
  // Pulls localStorage results of previous searches
  oldSearch = JSON.parse(localStorage.getItem("searches"));

  const existingButtons = document.querySelectorAll("#history button");

  if (oldSearch !== null) {
    existingButtons.forEach((button) => {
      for (let i = 0; i < oldSearch.length; i++)
        if (button.dataset.city.includes(oldSearch[i])) {
          oldSearch.splice(i, i + 1);
        }
    });
    for (let i = 0; i < oldSearch.length; i++) {
      const searchButton = document.createElement("button");
      searchButton.classList.add("m-2", "btn", "btn-light");
      searchButton.dataset.city = oldSearch[i];
      searchButton.textContent = oldSearch[i];
      searchButton.addEventListener("click", (event) => {
        // References data-city property to call API
        callOpenWeather(event.target.dataset.city);
      });
      historyContainer.appendChild(searchButton);
    }
  }
};

const updateLocalStorage = (city) => {
  // If a city has been searched, then it doesn't push it into the array
  if (localCityArray.includes(city)) {
    return;
  } else {
    localCityArray.push(city);

    // Stores for next user visit
    localStorage.setItem("searches", JSON.stringify(localCityArray));

    // Calls updateSearchHistory to add new search to previous search buttons
    updateSearchHistory();
  }
};

const callOpenWeather = (city) => {
  // Gets a city's lat & long
  const apiUrlCoords =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    city +
    "&units=imperial&appid=0656324568a33303c80afd015f0c27f8";

  // Initial fetch to retrieve lat & long
  fetch(apiUrlCoords).then(function (response) {
    // If city is not found
    if (!response.ok) {
      currentTemp.innerHTML = "";
      currentTempH3.textContent = "Try again!";
      const errorText = document.createElement("li");
      errorText.textContent = "City not found.";
      currentTemp.appendChild(errorText);
      dailyCardContainer.innerHTML = "";
      // Adds .hidden class in case previous search resulted in error
      fiveDayHeader.classList.add("hidden");
    } else {
      // Converts API response into json object
      response.json().then(function (data) {
        // Pulls city name into variable for later
        const cityName = data.name;

        // Creates URL for oneCall OpenWeather API from latitude and longitude of previous OpenWeather call
        const oneCallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${data.coord.lat}&lon=${data.coord.lon}&exclude=minutely,hourly,alerts&units=imperial&appid=0656324568a33303c80afd015f0c27f8`;

        // Fetch to retrive current and daily weather info
        fetch(oneCallUrl).then(function (response) {
          if (response.ok) {
            // Converts API response into json object
            response.json().then(function (data) {
              // Creates icon to display current weather status
              const icon =
                "<img src='https://openweathermap.org/img/w/" +
                data.current.weather[0].icon +
                ".png' alt='Weather icon'>";

              // Displays city name, weather icon, and current date pulled from moment.js
              currentTempH3.innerHTML =
                cityName + " (" + moment().format("MM/DD/YYYY") + ") " + icon;

              const liArray = [];

              // Clears any existing list items from previous searches
              currentTemp.innerHTML = "";

              // Creates four list items to hold current weather
              for (let i = 0; i < 4; i++) {
                const li = document.createElement("li");
                li.classList.add("mb-2");
                liArray.push(li);
              }

              // Populates contents of list items with properties of json object
              liArray[0].innerHTML =
                "Temperature: " + Math.floor(data.current.temp) + " &deg;F";
              liArray[1].textContent =
                "Humidity: " + data.current.humidity + "%";
              liArray[2].textContent =
                "Wind Speed: " + Math.floor(data.current.wind_speed) + " MPH";

              // Store in variable to condense logic statements and rounds down
              const uvi = Math.floor(data.current.uvi);

              if (uvi <= 2) {
                liArray[3].innerHTML = `UV Index: <button class="btn btn-info uv">${uvi}</button>`;
              } else if (uvi > 2 && uvi <= 5) {
                liArray[3].innerHTML = `UV Index: <button class="btn btn-success uv">${uvi}</button>`;
              } else if (uvi > 5 && uvi <= 8) {
                liArray[3].innerHTML = `UV Index: <button class="btn btn-warning uv">${uvi}</button>`;
              } else {
                liArray[3].innerHTML = `UV Index: <button class="btn btn-danger uv">${uvi}</button>`;
              }

              // Appends each updated list item to specified ul
              liArray.forEach((li) => {
                currentTemp.append(li);
              });

              let dailyArray = [];
              dailyCardContainer.innerHTML = "";

              // Loop to populate cards for next 5 days with information from daily openCall property
              for (let i = 0; i < 5; i++) {
                const dailyCard = document.createElement("div");
                // Populates forecast data for each card. Uses index number + 1 to advance moment.js call from current date by one day (pulls dates for next 5 days after today)
                dailyCard.innerHTML = `
                    <div class="p-2 m-2 card bg-info text-white">
                        <h5>${moment()
                          .add(i + 1, "days")
                          .format("MM/DD/YYYY")}</h5>
                        <ul id="conditions">
                            <li><img src='https://openweathermap.org/img/w/${
                              data.daily[i].weather[0].icon
                            }.png' alt="Weather icon" class="mx-auto"></li>
                            <li>Temp: ${Math.floor(
                              data.daily[i].temp.day
                            )} &deg;F</li>
                            <li>Humidity: ${data.daily[i].humidity}%</li>
                        </ul>
                    </div>`;

                // Pushes card into dailyArray to then be appended to container
                dailyArray.push(dailyCard);
              }

              // Removes .hidden class to now display in case previous search resulted in error
              fiveDayHeader.classList.remove("hidden");

              // Appends cards stored in dailyArray to container
              dailyArray.forEach((card) => {
                dailyCardContainer.appendChild(card);
              });
              updateLocalStorage(cityName);
            });
          }
        });
      });
    }
  });
};

// Adds event listener to search form
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Removes white space from both ends of search term
  let searchValue = cityNameInput.value.trim("");

  // Handler if user submits form with blank field
  if (searchValue === "") {
    currentTempH3.textContent = "Please enter a city!";
    currentTemp.innerHTML = "";
    dailyCardContainer.innerHTML = "";
    // Hides 5-day forecast if API won't be called
    fiveDayHeader.classList.add("hidden");
  } else {
    // Calls API to fetch provided value
    callOpenWeather(searchValue);
    // Clears text in input
    cityNameInput.value = "";
  }
});

// Called at run time to populate search buttons for previous searches in localStorage
updateSearchHistory();

// Default city to display at run time
callOpenWeather("Kitchener, On");
