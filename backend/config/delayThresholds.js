/**
 * Delay thresholds (configurable here)
 * All values in HOURS
 */
const DELAY_THRESHOLDS = {
  AT_ORIGIN_AIRPORT: 4,          // cargo stuck at origin airport > 4h
  LOADED_ON_AIRCRAFT: 6,         // still loaded > 6h (not in transit)
  AT_DESTINATION_AIRPORT: 4,     // arrived at dest airport > 4h
  AT_DESTINATION_OFFICE: 24,     // sitting at dest office > 24h without delivery
};

module.exports = DELAY_THRESHOLDS;
