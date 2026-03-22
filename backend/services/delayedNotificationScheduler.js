/**
 * Delayed Cargo Notification Scheduler
 *
 * Runs on a configurable interval (default 30s for testing, longer in production).
 * Detects cargo that has been stuck at a workflow stage longer than the configured
 * delay threshold, then creates notifications for:
 *   - The office responsible for the stuck stage (target_office_id)
 *   - All admins (target_role = 'ADMIN')
 *
 * Duplicate prevention (two-layer):
 *   1. In-memory Set keyed by "cargoId:currentStatus" — fast runtime guard.
 *   2. DB check — queries the notifications table before inserting so that a
 *      server restart does not re-spam notifications that were already sent.
 *
 * When cargo advances to the next stage, the old key is evicted from the in-memory
 * set automatically because the key includes current_status.  A brand-new delay on
 * the NEW stage is therefore always eligible to produce a fresh notification.
 */

const { Cargo, Office, Notification } = require('../models');
const { Op } = require('sequelize');
const DELAYS = require('../config/delayThresholds');

/**
 * Resolve which office_id is "responsible" for the stuck stage.
 *
 * RECEIVED_AT_ORIGIN_AIRPORT  → origin office (AIRPORT_CARGO scans here, but
 *                               logistically it is the origin office group)
 * LOADED_ON_AIRCRAFT          → origin office (cargo is still in the origin side)
 * ARRIVED_AT_DESTINATION_AIRPORT → destination office group
 * RECEIVED_AT_DESTINATION_OFFICE → destination office
 */
function getResponsibleOfficeId(cargo) {
  switch (cargo.current_status) {
    case 'RECEIVED_AT_ORIGIN_AIRPORT':
    case 'LOADED_ON_AIRCRAFT':
      return cargo.origin_office_id;
    case 'ARRIVED_AT_DESTINATION_AIRPORT':
    case 'RECEIVED_AT_DESTINATION_OFFICE':
      return cargo.destination_office_id;
    default:
      return null;
  }
}

// In-memory dedup set — key format: "<cargoId>:<currentStatus>"
const notifiedKeys = new Set();

/**
 * Check whether a 'DELAYED_CARGO' notification already exists in the DB
 * for this exact cargo + status combination. Prevents duplicates after restarts.
 */
async function alreadyNotifiedInDB(cargoId, status) {
  const existing = await Notification.findOne({
    where: {
      cargo_id: cargoId,
      title: { [Op.like]: `%Delayed%` },
      message: { [Op.like]: `%${status}%` },
    },
  });
  return !!existing;
}

/**
 * Core check: query for delayed cargo and dispatch notifications.
 */
async function checkAndNotify() {
  try {
    const now = new Date();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000);

    // Same query as cargoWorkflowController.getDelayedCargo
    const delayedCargos = await Cargo.findAll({
      where: {
        current_status: {
          [Op.notIn]: ['DELIVERED', 'REGISTERED'],
        },
        [Op.or]: [
          {
            current_status: 'RECEIVED_AT_ORIGIN_AIRPORT',
            updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_ORIGIN_AIRPORT) },
          },
          {
            current_status: 'LOADED_ON_AIRCRAFT',
            updated_at: { [Op.lt]: hoursAgo(DELAYS.LOADED_ON_AIRCRAFT) },
          },
          {
            current_status: 'ARRIVED_AT_DESTINATION_AIRPORT',
            updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_DESTINATION_AIRPORT) },
          },
          {
            current_status: 'RECEIVED_AT_DESTINATION_OFFICE',
            updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_DESTINATION_OFFICE) },
          },
        ],
      },
      attributes: [
        'id', 'tracking_number', 'current_status',
        'origin_office_id', 'destination_office_id', 'updated_at',
      ],
      raw: true,
    });

    for (const cargo of delayedCargos) {
      const key = `${cargo.id}:${cargo.current_status}`;

      // Layer 1 — in-memory fast check
      if (notifiedKeys.has(key)) continue;

      // Layer 2 — DB check (handles server restarts)
      const dbExists = await alreadyNotifiedInDB(cargo.id, cargo.current_status);
      if (dbExists) {
        notifiedKeys.add(key); // prime memory so next tick is fast
        continue;
      }

      // Compute how long it has been stuck
      const hoursStuck = Math.round((now - new Date(cargo.updated_at)) / 3600000);
      const statusLabel = cargo.current_status.replace(/_/g, ' ');
      const officeId = getResponsibleOfficeId(cargo);

      const title = `⚠️ Delayed Cargo`;
      const message =
        `Cargo ${cargo.tracking_number} has been stuck at "${statusLabel}" ` +
        `for ${hoursStuck}h and may need attention.`;

      // Notification 1 — responsible office
      if (officeId) {
        await Notification.create({
          title,
          message,
          type: 'danger',
          cargo_id: cargo.id,
          user_id: null,
          target_role: null,
          target_office_id: officeId,
        });
      }

      // Notification 2 — admin broadcast
      await Notification.create({
        title,
        message,
        type: 'danger',
        cargo_id: cargo.id,
        user_id: null,
        target_role: 'ADMIN',
        target_office_id: null,
      });

      // Mark as notified in memory
      notifiedKeys.add(key);

      console.log(
        `🔔 Delayed notification sent — Cargo: ${cargo.tracking_number} | Stage: ${cargo.current_status}`
      );
    }
  } catch (err) {
    // Never crash the server because of the scheduler
    console.error('❌ Delayed notification scheduler error:', err.message);
  }
}

/**
 * Start the scheduler.
 *
 * Interval is controlled by:
 *   DELAY_CHECK_INTERVAL_MS env variable (milliseconds) — default 30 000 (30 s)
 *
 * Delay thresholds are controlled by:
 *   The values in config/delayThresholds.js (can be overridden per-environment).
 */
function startDelayedNotificationScheduler() {
  const intervalMs = parseInt(process.env.DELAY_CHECK_INTERVAL_MS) || 30_000;

  console.log(
    `✅ Delayed notification scheduler started (interval: ${intervalMs / 1000}s, ` +
    `thresholds: AT_ORIGIN=${DELAYS.AT_ORIGIN_AIRPORT}h, ` +
    `LOADED=${DELAYS.LOADED_ON_AIRCRAFT}h, ` +
    `AT_DEST_AIRPORT=${DELAYS.AT_DESTINATION_AIRPORT}h, ` +
    `AT_DEST_OFFICE=${DELAYS.AT_DESTINATION_OFFICE}h)`
  );

  // Run once immediately on startup, then on the interval
  checkAndNotify();
  setInterval(checkAndNotify, intervalMs);
}

module.exports = { startDelayedNotificationScheduler };
