module.exports = function (req, res, next) {
  if (!process.env.API_KEY) {
    console.error(
      '[error]: The "API_KEY" environment variable is required. Please set it the environment before proceeding.'
    );
    process.exit(1);
  }
  next();
};
