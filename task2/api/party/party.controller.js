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
      var encodedAddress = encodeURIComponent(location);
      return axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.API_KEY}`
      );
    });

    const responses = await Promise.all(geocodeRequests);
    const predictionsRequests = responses.map((response) => {
      // When location not found
      if (response.data.status === "ZERO_RESULTS") {
        return null;
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

    // Filtering out predictions which don't match the temperature and wind speed criteria
    const filteredPredictionResponses = predictionResponses.map(
      (locationPredictions) => {
        return locationPredictions
          ? locationPredictions.filter(
              (prediction) =>
                prediction.temperature > 20 &&
                prediction.temperature < 30 &&
                prediction.wind_speed < 30
            )
          : null;
      }
    );

    // Get optimal prediction against each location
    const optimalPredictionsForLocations = filteredPredictionResponses.map(
      (locationPredictions) => {
        if (locationPredictions?.length) {
          let optimalPrediction = locationPredictions[0];
          locationPredictions.forEach((prediction) => {
            if (
              prediction.sunshine >= optimalPrediction.sunshine &&
              prediction.precipitation <= optimalPrediction.precipitation
            ) {
              optimalPrediction = prediction;
            }
          });
          return optimalPrediction;
        }
        return null;
      }
    );

    let optimalPrediction = null;
    optimalPredictionsForLocations.forEach((prediction, i) => {
      // Check if prediction object is valid (don't account for invalid locations)
      if (prediction) {
        const { timestamp, precipitation, sunshine } = prediction;
        const currentPrediction = {
          date: timestamp,
          location: locations[i],
          sunshine,
          precipitation,
        };

        // Optimal prediction object is null
        if (!optimalPrediction) {
          optimalPrediction = currentPrediction;
        } else if (
          sunshine >= optimalPrediction.sunshine &&
          precipitation <= optimalPrediction.precipitation
        ) {
          optimalPrediction = currentPrediction;
        }
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
