const axios = require("axios");
const { validationResult } = require("express-validator");

const getPartyPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, from, locations } = req.query;

    const geocodeRequests = locations.map((location) => {
      const encodedAddress = encodeURIComponent(location);
      return axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.API_KEY}`
      );
    });

    const geocodeResponses = await Promise.all(geocodeRequests);
    const predictionsRequests = geocodeResponses.map((response) => {
      // When location not found
      if (response.data.status === "ZERO_RESULTS") {
        return null;
      }
      // Cater for invalid API key or limit breaches
      else if (response.data.status === "REQUEST_DENIED") {
        throw new Error(response.data.error_message);
      }
      const { lat, lng } = response.data.results[0].geometry.location;
      return axios.get(
        `https://api.brightsky.dev/weather?date=${from.toISOString()}&last_date=${to.toISOString()}&lat=${lat}&lon=${lng}`
      );
    });

    const predictionResponses = await (
      await Promise.allSettled(predictionsRequests)
    ).map((predictionResponse) =>
      predictionResponse.value ? predictionResponse.value.data.weather : null
    );

    // Get optimal prediction
    let optimalPrediction = null;
    predictionResponses.forEach((locationPredictions, i) => {
      if (locationPredictions?.length) {
        locationPredictions.forEach((prediction) => {
          // Filtering out predictions which don't match the temperature and wind speed criteria
          if (
            prediction &&
            prediction.temperature > 20 &&
            prediction.temperature < 30 &&
            prediction.wind_speed < 30
          ) {
            const { timestamp, precipitation, sunshine } = prediction;
            const currentPrediction = {
              date: timestamp,
              location: locations[i],
              sunshine,
              precipitation,
            };

            // Optimal prediction object is null, so select the current prediction as optimal
            if (!optimalPrediction) {
              optimalPrediction = currentPrediction;
            }
            // Check if the current prediction is more optimal than the current optimal prediction
            else if (
              sunshine >= optimalPrediction.sunshine &&
              precipitation <= optimalPrediction.precipitation
            ) {
              optimalPrediction = currentPrediction;
            }
          }
        });
      }
    });

    res.json({
      date: optimalPrediction?.date || null,
      location: optimalPrediction?.location || null,
    });
  } catch (error) {
    console.log("An error occurred while getting the party plan", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = {
  getPartyPlan,
};
