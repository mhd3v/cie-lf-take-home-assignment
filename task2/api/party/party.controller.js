const { validationResult } = require("express-validator");

const getPartyPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, from } = req.query;

    const locations = req.query.locations
      .split(",")
      .filter((location) => location)
      .map((location) => location.trim());

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
      let lat = response.data.results[0].geometry.location.lat;
      let lng = response.data.results[0].geometry.location.lng;
      return axios.get(
        `https://api.brightsky.dev/weather?date=${from.toISOString()}&last_date=${to.toISOString()}&lat=${lat}&lon=${lng}`
      );
    });
    res.json({
      msg: "Dummy party plan!",
    });
  } catch (error) {
    console.log("An error occurred while getting the party plan", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = {
  getPartyPlan,
};
