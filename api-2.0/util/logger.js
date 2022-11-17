// Log hierarchy:
// logger.trace("Entering cheese testing");
// logger.debug("Got cheese.");
// logger.info("Cheese is Comté.");
// logger.warn("Cheese is quite smelly.");
// logger.error("Cheese is too ripe!");
// logger.fatal("Cheese was breeding ground for listeria.");

const log4js = require("log4js");

const logger = log4js.getLogger();
logger.level = "debug";

module.exports = logger;
