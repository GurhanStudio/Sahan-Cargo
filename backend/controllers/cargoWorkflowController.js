const { Cargo, CargoCheckpoint, Office } = require('../models');
const { Op } = require('sequelize');
const DELAYS = require('../config/delayThresholds');

// GET /api/workflow/delayed — detect delayed cargo based on thresholds
exports.getDelayedCargo = async (req, res) => {
  try {
    const now = new Date();
    const hoursAgo = (h) => new Date(now - h * 60 * 60 * 1000);

    const delayedWhere = {
      current_status: { [Op.notIn]: ['DELIVERED', 'REGISTERED'] },
      [Op.or]: [
        {
          current_status: 'RECEIVED_AT_ORIGIN_AIRPORT',
          updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_ORIGIN_AIRPORT) }
        },
        {
          current_status: 'LOADED_ON_AIRCRAFT',
          updated_at: { [Op.lt]: hoursAgo(DELAYS.LOADED_ON_AIRCRAFT) }
        },
        {
          current_status: 'ARRIVED_AT_DESTINATION_AIRPORT',
          updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_DESTINATION_AIRPORT) }
        },
        {
          current_status: 'RECEIVED_AT_DESTINATION_OFFICE',
          updated_at: { [Op.lt]: hoursAgo(DELAYS.AT_DESTINATION_OFFICE) }
        }
      ]
    };

    const cargos = await Cargo.findAll({
      where: delayedWhere,
      include: [
        { model: Office, as: 'originOffice', attributes: ['office_name'] },
        { model: Office, as: 'destinationOffice', attributes: ['office_name'] }
      ],
      order: [['updated_at', 'ASC']]
    });

    const annotated = cargos.map(c => {
      const hoursStuck = Math.round((now - new Date(c.updated_at)) / (1000 * 60 * 60));
      const thresholdMap = {
        RECEIVED_AT_ORIGIN_AIRPORT: DELAYS.AT_ORIGIN_AIRPORT,
        LOADED_ON_AIRCRAFT: DELAYS.LOADED_ON_AIRCRAFT,
        ARRIVED_AT_DESTINATION_AIRPORT: DELAYS.AT_DESTINATION_AIRPORT,
        RECEIVED_AT_DESTINATION_OFFICE: DELAYS.AT_DESTINATION_OFFICE,
      };
      const threshold = thresholdMap[c.current_status] || 24;
      return {
        ...c.toJSON(),
        hours_stuck: hoursStuck,
        delay_threshold_hours: threshold,
        hours_overdue: hoursStuck - threshold
      };
    });

    res.json({ cargos: annotated, total: annotated.length });
  } catch (error) {
    console.error('Delayed cargo error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
