/**
 * Delayed Cargo Notification Scheduler
 *
 * Runs on a configurable interval (default 30 000 ms).
 * Detects cargo stuck past delay thresholds and dispatches notifications to:
 *   - The office ACTUALLY responsible for the stuck stage
 *   - All admins (target_role = 'ADMIN')
 *
 * ── How office resolution works ────────────────────────────────────────────
 *
 * The Cargo model only stores origin_office_id (delivery / origin office) and
 * destination_office_id (delivery / destination office).  Airport offices
 * (AIRPORT_CARGO, DESTINATION_AIRPORT) are SEPARATE offices not referenced
 * directly on the cargo.
 *
 * Priority resolution for each stage:
 *
 *  Stage                         Primary lookup            Fallback
 *  ─────────────────────────────────────────────────────────────────
 *  RECEIVED_AT_ORIGIN_AIRPORT    checkpoint.user.office_id  origin_office_id
 *  LOADED_ON_AIRCRAFT            checkpoint.user.office_id  origin_office_id
 *  ARRIVED_AT_DESTINATION_AIRPORT checkpoint.user.office_id dest_office_id
 *  RECEIVED_AT_DESTINATION_OFFICE dest_office_id            dest_office_id
 *
 * For the airport stages we JOIN through:
 *   CargoCheckpoint → checked_by_user_id → User.office_id
 * This finds the exact airport office that scanned the cargo.
 *
 * ── Duplicate prevention ───────────────────────────────────────────────────
 *   Layer 1 — in-memory Set  key = "<cargoId>:<currentStatus>"   (fast)
 *   Layer 2 — DB query       before inserting (survives restarts)
 *
 * When cargo advances to the next stage the old key is evicted automatically
 * because the key includes current_status.
 */

const { Cargo, CargoCheckpoint, User, Notification } = require('../models');
const { Op } = require('sequelize');
const DELAYS = require('../config/delayThresholds');

// ─── In-memory dedup ────────────────────────────────────────────────────────
const notifiedKeys = new Set();

/**
 * For airport-side stages, look up the checkpoint performed for this stage
 * and return the office_id of the user who performed it.
 * Falls back to null so the caller can use a secondary strategy.
 */
async function getCheckpointOfficeId(cargoId, checkpointName) {
  const cp = await CargoCheckpoint.findOne({
    where: { cargo_id: cargoId, checkpoint_name: checkpointName },
    include: [{ model: User, as: 'checkedBy', attributes: ['office_id'] }],
  });
  return cp?.checkedBy?.office_id ?? null;
}

/**
 * Resolve which office should receive the delay notification.
 *
 * For origin-side airport and destination airport stages we look up the
 * actual checkpoint record so we notify the correct airport office.
 * For the destination delivery stage we use destination_office_id directly.
 */
async function getResponsibleOfficeId(cargo) {
  switch (cargo.current_status) {
    case 'RECEIVED_AT_ORIGIN_AIRPORT':
      // Airport cargo office scanned this — look up from checkpoint
      return (
        (await getCheckpointOfficeId(cargo.id, 'RECEIVED_AT_ORIGIN_AIRPORT')) ??
        cargo.origin_office_id
      );

    case 'LOADED_ON_AIRCRAFT':
      // Airport cargo office loaded — look up from the RECEIVED checkpoint
      // (LOADED checkpoint may not exist yet if still stuck pre-load)
      return (
        (await getCheckpointOfficeId(cargo.id, 'LOADED_ON_AIRCRAFT')) ??
        (await getCheckpointOfficeId(cargo.id, 'RECEIVED_AT_ORIGIN_AIRPORT')) ??
        cargo.origin_office_id
      );

    case 'ARRIVED_AT_DESTINATION_AIRPORT':
      // Destination airport scanned this — look up from checkpoint
      return (
        (await getCheckpointOfficeId(cargo.id, 'ARRIVED_AT_DESTINATION_AIRPORT')) ??
        cargo.destination_office_id
      );

    case 'RECEIVED_AT_DESTINATION_OFFICE':
      // Destination delivery office — use the stored field directly
      return cargo.destination_office_id;

    default:
      return null;
  }
}

/**
 * DB-level dedup check: returns true if we have already sent a delayed
 * notification for this cargo + status combination.
 */
async function alreadyNotifiedInDB(cargoId, status) {
  const existing = await Notification.findOne({
    where: {
      cargo_id: cargoId,
      title: { [Op.like]: '%Delayed%' },
      message: { [Op.like]: `%${status}%` },
    },
  });
  return !!existing;
}

/**
 * Core check: detect delayed cargo and fire notifications.
 */
async function checkAndNotify() {
  try {
    const now = new Date();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000);

    const delayedCargos = await Cargo.findAll({
      where: {
        current_status: { [Op.notIn]: ['DELIVERED', 'REGISTERED'] },
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

      // Layer 1 — in-memory fast guard
      if (notifiedKeys.has(key)) continue;

      // Layer 2 — DB guard (survives restarts)
      if (await alreadyNotifiedInDB(cargo.id, cargo.current_status)) {
        notifiedKeys.add(key);
        continue;
      }

      const hoursStuck = Math.round((now - new Date(cargo.updated_at)) / 3600000);
      const statusLabel = cargo.current_status.replace(/_/g, ' ');
      const officeId = await getResponsibleOfficeId(cargo);

      const title = '⚠️ Delayed Cargo';
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

      notifiedKeys.add(key);

      console.log(
        `🔔 Delayed notification — Cargo: ${cargo.tracking_number} | ` +
        `Stage: ${cargo.current_status} | Office: ${officeId ?? 'n/a'}`
      );
    }
  } catch (err) {
    console.error('❌ Delayed notification scheduler error:', err.message);
  }
}

/**
 * Start the scheduler.
 *
 * DELAY_CHECK_INTERVAL_MS  — interval in ms  (default 30 000)
 * DELAY_AT_ORIGIN_AIRPORT  — threshold hours (default from delayThresholds.js)
 * ...etc.
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

  checkAndNotify();
  setInterval(checkAndNotify, intervalMs);
}

module.exports = { startDelayedNotificationScheduler };
