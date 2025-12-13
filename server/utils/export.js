import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

/**
 * Export Utilities
 * Hjälpfunktioner för att exportera data till Excel och CSV
 */

/**
 * Exportera leads till Excel
 * @param {array} leads - Array av leads
 * @param {string} filename - Filnamn (utan extension)
 * @returns {Buffer} - Excel-fil som buffer
 */
export async function exportLeadsToExcel(leads, filename = 'leads') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  // Metadata
  workbook.creator = 'DHL Lead Hunter';
  workbook.created = new Date();

  // Definiera kolumner
  worksheet.columns = [
    { header: 'Företagsnamn', key: 'companyName', width: 30 },
    { header: 'Org.nummer', key: 'orgNumber', width: 15 },
    { header: 'Segment', key: 'segment', width: 10 },
    { header: 'Adress', key: 'address', width: 30 },
    { header: 'Postnummer', key: 'postalCode', width: 12 },
    { header: 'Stad', key: 'city', width: 20 },
    { header: 'Telefon', key: 'phoneNumber', width: 15 },
    { header: 'Webbplats', key: 'websiteUrl', width: 30 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Omsättning (TKR)', key: 'revenueTkr', width: 15 },
    { header: 'Fraktbudget (TKR)', key: 'freightBudgetTkr', width: 18 },
    { header: 'Legal Status', key: 'legalStatus', width: 20 },
    { header: 'Kreditbetyg', key: 'creditRating', width: 15 },
    { header: 'E-handelsplattform', key: 'ecommercePlatform', width: 20 },
    { header: 'Analyserad', key: 'analysisDate', width: 15 },
    { header: 'Skapad', key: 'createdAt', width: 15 }
  ];

  // Stil för header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD40511' } // DHL Red
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Lägg till data
  leads.forEach(lead => {
    worksheet.addRow({
      companyName: lead.company_name || lead.companyName,
      orgNumber: lead.org_number || lead.orgNumber,
      segment: lead.segment,
      address: lead.address,
      postalCode: lead.postal_code || lead.postalCode,
      city: lead.city,
      phoneNumber: lead.phone_number || lead.phoneNumber,
      websiteUrl: lead.website_url || lead.websiteUrl,
      email: lead.email,
      revenueTkr: lead.revenue_tkr || lead.revenueTkr,
      freightBudgetTkr: lead.freight_budget_tkr || lead.freightBudgetTkr,
      legalStatus: lead.legal_status || lead.legalStatus,
      creditRating: lead.credit_rating || lead.creditRating,
      ecommercePlatform: lead.ecommerce_platform || lead.ecommercePlatform,
      analysisDate: lead.analysis_date || lead.analysisDate,
      createdAt: lead.created_at || lead.createdAt
    });
  });

  // Formatera datum-kolumner
  worksheet.getColumn('analysisDate').numFmt = 'yyyy-mm-dd';
  worksheet.getColumn('createdAt').numFmt = 'yyyy-mm-dd';

  // Formatera nummer-kolumner
  worksheet.getColumn('revenueTkr').numFmt = '#,##0';
  worksheet.getColumn('freightBudgetTkr').numFmt = '#,##0';

  // Färgkoda segment
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      const segment = row.getCell('segment').value;
      let color = 'FFFFFFFF';
      
      switch (segment) {
        case 'DM': color = 'FFE0E0E0'; break;
        case 'TS': color = 'FFD4EDDA'; break;
        case 'FS': color = 'FFD1ECF1'; break;
        case 'KAM': color = 'FFE7D4F0'; break;
      }
      
      row.getCell('segment').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
    }
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: `P1`
  };

  // Freeze header row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Generera buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Exportera leads till CSV
 * @param {array} leads - Array av leads
 * @returns {string} - CSV-data som string
 */
export function exportLeadsToCSV(leads) {
  const fields = [
    { label: 'Företagsnamn', value: 'companyName' },
    { label: 'Org.nummer', value: 'orgNumber' },
    { label: 'Segment', value: 'segment' },
    { label: 'Adress', value: 'address' },
    { label: 'Postnummer', value: 'postalCode' },
    { label: 'Stad', value: 'city' },
    { label: 'Telefon', value: 'phoneNumber' },
    { label: 'Webbplats', value: 'websiteUrl' },
    { label: 'Email', value: 'email' },
    { label: 'Omsättning (TKR)', value: 'revenueTkr' },
    { label: 'Fraktbudget (TKR)', value: 'freightBudgetTkr' },
    { label: 'Legal Status', value: 'legalStatus' },
    { label: 'Kreditbetyg', value: 'creditRating' },
    { label: 'E-handelsplattform', value: 'ecommercePlatform' },
    { label: 'Analyserad', value: 'analysisDate' },
    { label: 'Skapad', value: 'createdAt' }
  ];

  // Normalisera data (hantera både snake_case och camelCase)
  const normalizedLeads = leads.map(lead => ({
    companyName: lead.company_name || lead.companyName,
    orgNumber: lead.org_number || lead.orgNumber,
    segment: lead.segment,
    address: lead.address,
    postalCode: lead.postal_code || lead.postalCode,
    city: lead.city,
    phoneNumber: lead.phone_number || lead.phoneNumber,
    websiteUrl: lead.website_url || lead.websiteUrl,
    email: lead.email,
    revenueTkr: lead.revenue_tkr || lead.revenueTkr,
    freightBudgetTkr: lead.freight_budget_tkr || lead.freightBudgetTkr,
    legalStatus: lead.legal_status || lead.legalStatus,
    creditRating: lead.credit_rating || lead.creditRating,
    ecommercePlatform: lead.ecommerce_platform || lead.ecommercePlatform,
    analysisDate: lead.analysis_date || lead.analysisDate,
    createdAt: lead.created_at || lead.createdAt
  }));

  const parser = new Parser({ fields });
  const csv = parser.parse(normalizedLeads);
  
  return csv;
}

/**
 * Exportera decision makers till Excel
 * @param {array} decisionMakers - Array av decision makers
 * @returns {Buffer} - Excel-fil som buffer
 */
export async function exportDecisionMakersToExcel(decisionMakers) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Beslutsfattare');

  worksheet.columns = [
    { header: 'Företag', key: 'companyName', width: 30 },
    { header: 'Namn', key: 'name', width: 25 },
    { header: 'Titel', key: 'title', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Telefon', key: 'directPhone', width: 15 },
    { header: 'LinkedIn', key: 'linkedin', width: 40 }
  ];

  // Stil för header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD40511' }
  };

  // Lägg till data
  decisionMakers.forEach(dm => {
    worksheet.addRow({
      companyName: dm.company_name || dm.companyName,
      name: dm.name,
      title: dm.title,
      email: dm.email,
      directPhone: dm.direct_phone || dm.directPhone,
      linkedin: dm.linkedin_url || dm.linkedin
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Exportera statistik till Excel
 * @param {object} stats - Statistik-objekt
 * @returns {Buffer} - Excel-fil som buffer
 */
export async function exportStatsToExcel(stats) {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Översikt
  const overviewSheet = workbook.addWorksheet('Översikt');
  overviewSheet.columns = [
    { header: 'Metrik', key: 'metric', width: 30 },
    { header: 'Värde', key: 'value', width: 20 }
  ];
  
  overviewSheet.addRow({ metric: 'Totalt antal leads', value: stats.total_leads });
  overviewSheet.addRow({ metric: 'Total omsättning (TKR)', value: stats.total_revenue_tkr });
  overviewSheet.addRow({ metric: 'Snitt omsättning per lead', value: stats.avg_revenue_per_lead });

  // Sheet 2: Segment-fördelning
  const segmentSheet = workbook.addWorksheet('Segment');
  segmentSheet.columns = [
    { header: 'Segment', key: 'segment', width: 15 },
    { header: 'Antal', key: 'count', width: 15 },
    { header: 'Procent', key: 'percentage', width: 15 }
  ];

  if (stats.segment_distribution) {
    Object.entries(stats.segment_distribution).forEach(([segment, count]) => {
      segmentSheet.addRow({
        segment,
        count,
        percentage: ((count / stats.total_leads) * 100).toFixed(1) + '%'
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export default {
  exportLeadsToExcel,
  exportLeadsToCSV,
  exportDecisionMakersToExcel,
  exportStatsToExcel
};
