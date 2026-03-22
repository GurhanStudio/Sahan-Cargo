/**
 * Delay thresholds — how long cargo may sit at each stage before it is
 * considered "delayed" and a notification is dispatched.
 *
 * All values are in HOURS.
 *
 * Each threshold can be overridden via environment variables so you can use
 * very short values for testing without touching this file:
 *
 *   DELAY_AT_ORIGIN_AIRPORT=0.00833      (≈ 30 seconds)
 *   DELAY_LOADED_ON_AIRCRAFT=0.00833
 *   DELAY_AT_DESTINATION_AIRPORT=0.00833
 *   DELAY_AT_DESTINATION_OFFICE=0.00833
 *
 * Production-recommended values:
 *   AT_ORIGIN_AIRPORT       4   h
 *   LOADED_ON_AIRCRAFT      6   h
 *   AT_DESTINATION_AIRPORT  4   h
 *   AT_DESTINATION_OFFICE  24   h
 *
 * Current defaults below are set to 0.1 h for testing.
 * Change back to production values before going live.
 */
const DELAY_THRESHOLDS = {
  AT_ORIGIN_AIRPORT: parseFloat(process.env.DELAY_AT_ORIGIN_AIRPORT) || 0.1,
  LOADED_ON_AIRCRAFT: parseFloat(process.env.DELAY_LOADED_ON_AIRCRAFT) || 0.1,
  AT_DESTINATION_AIRPORT: parseFloat(process.env.DELAY_AT_DESTINATION_AIRPORT) || 0.1,
  AT_DESTINATION_OFFICE: parseFloat(process.env.DELAY_AT_DESTINATION_OFFICE) || 0.1,
};

module.exports = DELAY_THRESHOLDS;