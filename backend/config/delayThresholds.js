/**
 * Delay thresholds (configurable here)
 * All values in HOURS
 */
const DELAY_THRESHOLDS = {
  AT_ORIGIN_AIRPORT: 0.1,          // cargo stuck at origin airport > 4h
  LOADED_ON_AIRCRAFT: 0.1,         // still loaded > 6h (not in transit)
  AT_DESTINATION_AIRPORT: 0.1,     // arrived at dest airport > 4h
  AT_DESTINATION_OFFICE: 2,     // sitting at dest office > 24h without delivery
};

module.exports = DELAY_THRESHOLDS;
