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
