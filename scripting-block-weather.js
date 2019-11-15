const URL = require('url').URL;
const request = require('request');

// message will be sent when weather can not be found in place user provided
const notFoundWeatherMessage = 'Sorry, the weather cannot be predicted';
// Button text to come back share locale block when it was clicked on
const sendLocationAgainMessage = "Send Location Again";

// share locale block id
const locationBlockId = 'sbb000aa3-1c4c-4d1f-8b04-77e7f144d445';

/**
 * Fetch forecast data from openweathermap service
 */
const getWeatherData = () => {
  // get the latest user response which is a city name
  // More details at https://docs.botstar.com/en/scripting.html#event
  const city = event.conversation.userResponses.latest_response;
  const weatherUrl = `http://api.openweathermap.org/data/2.5/forecast?appid=700768c90c6fa03a13bcdf672f51927a&q=${city}`;
  return new Promise(resolve => {
    request(weatherUrl, function (error, response, body) {
      const data = JSON.parse(body || response || {});
      resolve(data);
    });
  });
};

/**
 * Fetch weather status code for mapping with openweathermapp id
 */
const getWeathersStatusMapping = () => {
  const weatherUrl = 'https://raw.githubusercontent.com/botstar-hai/weather-data/master/weather-status.json';
  return new Promise(resolve => {
    request(weatherUrl, function (error, response, body) {
      const data = JSON.parse(body || response || {});
      resolve(data);
    });
  });
};

/**
 * Parse weather data into horizontal list message
 * More details at https://docs.botstar.com/en/json-formats.html#horizontal-list-block
 * @param {*} data forecast which is fetched from weather service
 */
const parseForecastMessages = async (data) => {
  const { name, country } = data.city;
  const weathers = await getWeathersStatusMapping();

	const cards = (data.list || []).map(forecast => {
    const { id } = forecast.weather[0];
    const { temp_max, temp_min, temp, humidity } = forecast.main;
    const weather = weathers[String(id)];
    const title = forecast.dt_txt;
    const desc =
`${name}, ${country} - ${temp}F
${temp_min}F - ${temp_max}F
${weather.desc}
Humidity ${humidity}%`;
    const message = {
      "title": title,
      "subtitle": desc,
      "image": weather.iconUrl
    };
    return message;
  }).slice(0, 10);

  return { cards };
  //*/
};

const getFallbackMessage = () => {
  const shareLocationButton = {
    title: sendLocationAgainMessage,
    value: sendLocationAgainMessage,
    payload: {
      goToBlock: locationBlockId
    }
  };
  return {
    text: notFoundWeatherMessage,
    buttons: [
      shareLocationButton
    ]
  };
}

// Main Process
(async function () {
  const weather = await getWeatherData();
  const message = String(weather.cod) === '200' ? await parseForecastMessages(weather) : getFallbackMessage();

  // More details at https://docs.botstar.com/en/scripting.html#done
  var response = {
    messages: [].concat(message)
  };
  done(response); // This is required.
})()
