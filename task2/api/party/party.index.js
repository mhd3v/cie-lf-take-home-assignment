const router = require("express").Router();
const controller = require("./party.controller");
const { query } = require("express-validator");
const checkApiKey = require("../../middleware/check-api-key");

router.get(
  "/party_plan",
  checkApiKey,
  [
    query(
      "locations",
      "Location value(s) are required. For example: Treptower Park, Berlin"
    )
      .notEmpty()
      .toArray()
      .custom((value) => value.every((value) => value)),
    query("from", "From date must be a valid ISO 8601 date")
      .isISO8601()
      .toDate(),
    query("to", "To date must be a valid ISO 8601 date")
      .isISO8601()
      .toDate()
      .custom((value, { req }) => {
        if (value <= req.query.from) {
          throw new Error("To date must be greater than from date");
        }
        return true;
      }),
  ],
  controller.getPartyPlan
);

module.exports = router;
