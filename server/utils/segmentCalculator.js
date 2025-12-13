/**
 * Segment Calculator
 * Automatisk beräkning av segment baserat på fraktomsättning
 * 
 * Fraktomsättning = Bolagsomsättning × 5%
 * 
 * Segment-gränser:
 * - DM: 0 - 250,000 kr/år
 * - TS: 250,000 - 750,000 kr/år
 * - FS: 750,000 - 5,000,000 kr/år
 * - KAM: 5,000,000+ kr/år
 */

/**
 * Beräkna segment baserat på omsättning i TKR
 * @param {number} revenueTkr - Omsättning i tusen kronor
 * @returns {string} - Segment (DM, TS, FS, KAM)
 */
export function calculateSegment(revenueTkr) {
  if (!revenueTkr || revenueTkr <= 0) {
    return 'UNKNOWN';
  }

  // Konvertera TKR till KR och beräkna fraktomsättning (5%)
  const freightRevenue = (revenueTkr * 1000) * 0.05;

  if (freightRevenue < 250000) {
    return 'DM';
  } else if (freightRevenue < 750000) {
    return 'TS';
  } else if (freightRevenue < 5000000) {
    return 'FS';
  } else {
    return 'KAM';
  }
}

/**
 * Beräkna fraktomsättning från bolagsomsättning
 * @param {number} revenueTkr - Omsättning i tusen kronor
 * @returns {number} - Fraktomsättning i kronor
 */
export function calculateFreightRevenue(revenueTkr) {
  if (!revenueTkr || revenueTkr <= 0) {
    return 0;
  }
  return (revenueTkr * 1000) * 0.05;
}

/**
 * Få segment-info
 * @param {string} segment - Segment-kod
 * @returns {object} - Segment-information
 */
export function getSegmentInfo(segment) {
  const segments = {
    DM: {
      name: 'Direct Marketing',
      description: 'Minsta kunderna - Direktmarknadsföring',
      freightRevenue: '0 - 250,000 kr/år',
      companyRevenue: '~0 - 5 MSEK',
      channel: 'Email, direktutskick, digital marknadsföring'
    },
    TS: {
      name: 'Telesales',
      description: 'Små kunder - Telefonsäljare',
      freightRevenue: '250,000 - 750,000 kr/år',
      companyRevenue: '~5 - 15 MSEK',
      channel: 'Telefon'
    },
    FS: {
      name: 'Field Sales',
      description: 'Medelstora kunder - Säljare ute',
      freightRevenue: '750,000 - 5,000,000 kr/år',
      companyRevenue: '~15 - 100 MSEK',
      channel: 'Personliga möten'
    },
    KAM: {
      name: 'Key Account Manager',
      description: 'Stora kunder - Strategiska relationer',
      freightRevenue: '5,000,000+ kr/år',
      companyRevenue: '~100+ MSEK',
      channel: 'Dedikerad KAM'
    },
    UNKNOWN: {
      name: 'Oklassificerad',
      description: 'Behöver klassificeras',
      freightRevenue: 'N/A',
      companyRevenue: 'N/A',
      channel: 'N/A'
    }
  };

  return segments[segment] || segments.UNKNOWN;
}

/**
 * Validera segment
 * @param {string} segment - Segment att validera
 * @returns {boolean} - True om giltigt segment
 */
export function isValidSegment(segment) {
  const validSegments = ['DM', 'TS', 'FS', 'KAM', 'UNKNOWN'];
  return validSegments.includes(segment);
}

/**
 * Få alla segment
 * @returns {array} - Lista med alla segment
 */
export function getAllSegments() {
  return [
    { code: 'DM', ...getSegmentInfo('DM') },
    { code: 'TS', ...getSegmentInfo('TS') },
    { code: 'FS', ...getSegmentInfo('FS') },
    { code: 'KAM', ...getSegmentInfo('KAM') }
  ];
}

/**
 * Kontrollera om segment ska uppgraderas
 * @param {number} currentRevenueTkr - Nuvarande omsättning
 * @param {string} currentSegment - Nuvarande segment
 * @returns {object} - Uppgraderingsinfo
 */
export function checkSegmentUpgrade(currentRevenueTkr, currentSegment) {
  const calculatedSegment = calculateSegment(currentRevenueTkr);
  const freightRevenue = calculateFreightRevenue(currentRevenueTkr);

  const result = {
    shouldUpgrade: calculatedSegment !== currentSegment,
    currentSegment,
    suggestedSegment: calculatedSegment,
    freightRevenue,
    reason: ''
  };

  if (result.shouldUpgrade) {
    const segmentOrder = ['DM', 'TS', 'FS', 'KAM'];
    const currentIndex = segmentOrder.indexOf(currentSegment);
    const suggestedIndex = segmentOrder.indexOf(calculatedSegment);

    if (suggestedIndex > currentIndex) {
      result.reason = `Kunden har vuxit och bör uppgraderas från ${currentSegment} till ${calculatedSegment}`;
    } else {
      result.reason = `Kunden har minskat och bör nedgraderas från ${currentSegment} till ${calculatedSegment}`;
    }
  }

  return result;
}

/**
 * Få segment-gränser
 * @returns {object} - Segment-gränser
 */
export function getSegmentBoundaries() {
  return {
    DM: { min: 0, max: 250000 },
    TS: { min: 250000, max: 750000 },
    FS: { min: 750000, max: 5000000 },
    KAM: { min: 5000000, max: Infinity }
  };
}

/**
 * Beräkna avstånd till nästa segment
 * @param {number} revenueTkr - Omsättning i TKR
 * @returns {object} - Info om avstånd till nästa segment
 */
export function distanceToNextSegment(revenueTkr) {
  const currentSegment = calculateSegment(revenueTkr);
  const freightRevenue = calculateFreightRevenue(revenueTkr);
  const boundaries = getSegmentBoundaries();

  const segmentOrder = ['DM', 'TS', 'FS', 'KAM'];
  const currentIndex = segmentOrder.indexOf(currentSegment);

  if (currentIndex === segmentOrder.length - 1) {
    return {
      currentSegment,
      nextSegment: null,
      distanceKr: null,
      distanceTkr: null,
      percentageToNext: 100,
      message: 'Högsta segmentet (KAM)'
    };
  }

  const nextSegment = segmentOrder[currentIndex + 1];
  const nextBoundary = boundaries[nextSegment].min;
  const distanceKr = nextBoundary - freightRevenue;
  const distanceTkr = Math.ceil(distanceKr / 50); // Konvertera till TKR (dividera med 0.05 och 1000)

  const currentBoundary = boundaries[currentSegment];
  const range = currentBoundary.max - currentBoundary.min;
  const progress = freightRevenue - currentBoundary.min;
  const percentageToNext = Math.round((progress / range) * 100);

  return {
    currentSegment,
    nextSegment,
    distanceKr,
    distanceTkr,
    percentageToNext,
    message: `${distanceTkr.toLocaleString('sv-SE')} TKR till ${nextSegment}`
  };
}

export default {
  calculateSegment,
  calculateFreightRevenue,
  getSegmentInfo,
  isValidSegment,
  getAllSegments,
  checkSegmentUpgrade,
  getSegmentBoundaries,
  distanceToNextSegment
};
