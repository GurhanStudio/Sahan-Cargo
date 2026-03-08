const { Cargo, CargoCheckpoint, Office, User, ReportDownloadLog } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { createAuditLog } = require('../middleware/auditLogger');

// Helper: build date filter
function dateFilter(from, to) {
  if (from && to) {
    return { [Op.between]: [new Date(from), new Date(to + 'T23:59:59')] };
  }
  return undefined;
}

// Helper: log report download
async function logDownload(userId, reportType, format, filters, ip) {
  await ReportDownloadLog.create({
    admin_user_id: userId,
    report_type: reportType,
    file_format: format,
    filters_used: JSON.stringify(filters)
  });
  await createAuditLog({
    userId,
    actionType: 'REPORT_DOWNLOADED',
    actionDescription: `Admin downloaded ${reportType} report in ${format} format.`,
    ipAddress: ip
  });
}

// ═══════════════════════════════════════
// 1. Cargo Report
// ═══════════════════════════════════════
exports.cargoReport = async (req, res) => {
  try {
    const { from, to, status, origin_office, destination_office, format = 'json' } = req.query;
    const where = {};
    if (status) where.current_status = status;
    if (origin_office) where.origin_office_id = origin_office;
    if (destination_office) where.destination_office_id = destination_office;
    const dateRange = dateFilter(from, to);
    if (dateRange) where.created_at = dateRange;

    const data = await Cargo.findAll({
      where,
      include: [
        { model: Office, as: 'originOffice', attributes: ['office_name'] },
        { model: Office, as: 'destinationOffice', attributes: ['office_name'] }
      ],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true
    });

    const rows = data.map(d => ({
      'Tracking Number': d.tracking_number,
      'Sender Name': d.sender_name,
      'Receiver Name': d.receiver_name,
      'Origin Office': d.originOffice?.office_name,
      'Destination Office': d.destinationOffice?.office_name,
      'Description': d.description,
      'Weight': d.weight,
      'Priority': d.priority,
      'Status': d.current_status,
      'Created Date': d.created_at
    }));

    await logDownload(req.user.id, 'cargo', format.toUpperCase(), { from, to, status }, req.ip);
    return sendReport(res, rows, 'Cargo_Report', format);
  } catch (error) {
    console.error('Cargo report error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ═══════════════════════════════════════
// 2. Delivery Report
// ═══════════════════════════════════════
exports.deliveryReport = async (req, res) => {
  try {
    const { from, to, office, format = 'json' } = req.query;
    const where = { current_status: 'DELIVERED' };
    if (office) where.destination_office_id = office;
    const dateRange = dateFilter(from, to);
    if (dateRange) where.delivered_at = dateRange;

    const data = await Cargo.findAll({
      where,
      include: [
        { model: Office, as: 'destinationOffice', attributes: ['office_name'] }
      ],
      order: [['delivered_at', 'DESC']],
      raw: true,
      nest: true
    });

    const rows = data.map(d => ({
      'Tracking Number': d.tracking_number,
      'Receiver Name': d.receiver_name,
      'Destination Office': d.destinationOffice?.office_name,
      'Delivered Date': d.delivered_at,
      'Verified By OTP': 'Yes'
    }));

    await logDownload(req.user.id, 'delivery', format.toUpperCase(), { from, to, office }, req.ip);
    return sendReport(res, rows, 'Delivery_Report', format);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ═══════════════════════════════════════
// 3. High Value Cargo Report
// ═══════════════════════════════════════
exports.highValueReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const data = await Cargo.findAll({
      where: { priority: 'HIGH_VALUE' },
      include: [
        {
          model: CargoCheckpoint,
          as: 'checkpoints',
          order: [['checked_at', 'DESC']],
          limit: 1
        }
      ],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true
    });

    const rows = data.map(d => ({
      'Tracking Number': d.tracking_number,
      'Sender Name': d.sender_name,
      'Receiver Name': d.receiver_name,
      'Priority': d.priority,
      'Status': d.current_status,
      'Last Checkpoint': d.checkpoints?.checkpoint_name || 'N/A'
    }));

    await logDownload(req.user.id, 'high_value', format.toUpperCase(), {}, req.ip);
    return sendReport(res, rows, 'HighValue_Report', format);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ═══════════════════════════════════════
// 4. Damaged / Dispute Report
// ═══════════════════════════════════════
exports.damagedReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const data = await CargoCheckpoint.findAll({
      where: { condition_status: { [Op.in]: ['DAMAGED', 'DISPUTE'] } },
      include: [
        { model: Cargo, as: 'cargo', attributes: ['tracking_number'] },
        { model: User, as: 'checkedBy', attributes: ['name'] }
      ],
      order: [['checked_at', 'DESC']],
      raw: true,
      nest: true
    });

    const rows = data.map(d => ({
      'Tracking Number': d.cargo?.tracking_number,
      'Condition': d.condition_status,
      'Checkpoint': d.checkpoint_name,
      'Officer': d.checkedBy?.name,
      'Note': d.note,
      'Date': d.checked_at
    }));

    await logDownload(req.user.id, 'damaged', format.toUpperCase(), {}, req.ip);
    return sendReport(res, rows, 'Damaged_Dispute_Report', format);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ═══════════════════════════════════════
// 5. Cargo Activity Report
// ═══════════════════════════════════════
exports.activityReport = async (req, res) => {
  try {
    const { from, to, format = 'json' } = req.query;
    const where = {};
    const dateRange = dateFilter(from, to);
    if (dateRange) where.checked_at = dateRange;

    const data = await CargoCheckpoint.findAll({
      where,
      include: [
        { model: Cargo, as: 'cargo', attributes: ['tracking_number'] },
        {
          model: User, as: 'checkedBy', attributes: ['name'],
          include: [{ model: require('../models/Office'), as: 'office', attributes: ['office_name'] }]
        }
      ],
      order: [['checked_at', 'DESC']],
      raw: true,
      nest: true
    });

    const rows = data.map(d => ({
      'Tracking Number': d.cargo?.tracking_number,
      'Checkpoint': d.checkpoint_name,
      'Officer': d.checkedBy?.name,
      'Office': d.checkedBy?.office?.office_name || 'N/A',
      'Condition': d.condition_status,
      'Time': d.checked_at
    }));

    await logDownload(req.user.id, 'activity', format.toUpperCase(), { from, to }, req.ip);
    return sendReport(res, rows, 'Activity_Report', format);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ═══════════════════════════════════════
// Helper: Send report in requested format
// ═══════════════════════════════════════
async function sendReport(res, rows, reportName, format) {
  if (format === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${reportName}.csv"`);
    return res.send(csv);
  }

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportName);

    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({
        header: key,
        key,
        width: 20
      }));
      rows.forEach(row => sheet.addRow(row));

      // Style header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' }
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    }

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="${reportName}.xlsx"`);
    return workbook.xlsx.write(res).then(() => res.end());
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="${reportName}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(18).fillColor('#1E40AF').text(reportName.replace(/_/g, ' '), { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      // Header
      doc.fontSize(8).fillColor('#1E40AF');
      let x = 30;
      const colWidth = (doc.page.width - 60) / keys.length;
      keys.forEach(key => {
        doc.text(key, x, doc.y, { width: colWidth, continued: false });
        x += colWidth;
      });
      doc.moveDown();

      // Rows
      doc.fillColor('#333');
      rows.slice(0, 50).forEach(row => { // Limit to 50 rows for PDF
        x = 30;
        const y = doc.y;
        keys.forEach(key => {
          doc.text(String(row[key] || ''), x, y, { width: colWidth });
          x += colWidth;
        });
        doc.moveDown(0.5);
        if (doc.y > doc.page.height - 50) doc.addPage();
      });
    } else {
      doc.fontSize(12).text('No data found for the selected filters.');
    }

    doc.end();
    return;
  }

  // Default: JSON
  return res.json({ data: rows, total: rows.length });
}

// GET /api/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { AuditLog } = require('../models');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['name', 'role'] },
        { model: Cargo, as: 'cargo', attributes: ['tracking_number'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ logs: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
