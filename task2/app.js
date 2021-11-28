require("dotenv").config();

const express = require("express");
const routes = require("./routes/routes");

const port = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {
  res.send("API server is running.");
});

app.use("/", routes);

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});

module.exports = { app };
