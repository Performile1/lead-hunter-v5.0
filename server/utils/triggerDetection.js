/**
 * Trigger Detection Utilities
 * Detektera ändringar och triggers i lead-data
 */

/**
 * Detektera alla triggers för en bevakning
 * @param {object} watch - Bevakning med triggers
 * @param {object} oldLead - Gammal lead-data
 * @param {object} newLead - Ny lead-data
 * @returns {array} - Array av triggade händelser
 */
export function detectTriggers(watch, oldLead, newLead) {
  const triggeredEvents = [];

  // 1. Ökad omsättning
  if (watch.trigger_revenue_increase) {
    const event = detectRevenueIncrease(oldLead, newLead, watch.revenue_change_threshold_percent);
    if (event) triggeredEvents.push(event);
  }

  // 2. Minskad omsättning
  if (watch.trigger_revenue_decrease) {
    const event = detectRevenueDecrease(oldLead, newLead, watch.revenue_change_threshold_percent);
    if (event) triggeredEvents.push(event);
  }

  // 3. Konkurs
  if (watch.trigger_bankruptcy) {
    const event = detectBankruptcy(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  // 4. Likvidation
  if (watch.trigger_liquidation) {
    const event = detectLiquidation(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  // 5. Betalningsanmärkning
  if (watch.trigger_payment_remarks) {
    const event = detectPaymentRemarks(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  // 6. Lagerflytt
  if (watch.trigger_warehouse_move) {
    const event = detectWarehouseMove(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  // 7. Nyheter
  if (watch.trigger_news) {
    const event = detectNews(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  // 8. Segmentändring
  if (watch.trigger_segment_change) {
    const event = detectSegmentChange(oldLead, newLead);
    if (event) triggeredEvents.push(event);
  }

  return triggeredEvents;
}

/**
 * Detektera ökad omsättning
 */
function detectRevenueIncrease(oldLead, newLead, threshold) {
  if (!oldLead.revenue_tkr || !newLead.revenue_tkr) return null;

  const changePercent = ((newLead.revenue_tkr - oldLead.revenue_tkr) / oldLead.revenue_tkr) * 100;

  if (changePercent >= threshold) {
    return {
      type: 'revenue_increase',
      severity: changePercent >= 50 ? 'high' : changePercent >= 25 ? 'medium' : 'low',
      old_value: oldLead.revenue_tkr,
      new_value: newLead.revenue_tkr,
      change_percentage: changePercent.toFixed(2),
      message: `Omsättningen har ökat med ${changePercent.toFixed(1)}% (${oldLead.revenue_tkr} → ${newLead.revenue_tkr} TKR)`
    };
  }

  return null;
}

/**
 * Detektera minskad omsättning
 */
function detectRevenueDecrease(oldLead, newLead, threshold) {
  if (!oldLead.revenue_tkr || !newLead.revenue_tkr) return null;

  const changePercent = ((oldLead.revenue_tkr - newLead.revenue_tkr) / oldLead.revenue_tkr) * 100;

  if (changePercent >= threshold) {
    return {
      type: 'revenue_decrease',
      severity: changePercent >= 50 ? 'high' : changePercent >= 25 ? 'medium' : 'low',
      old_value: oldLead.revenue_tkr,
      new_value: newLead.revenue_tkr,
      change_percentage: changePercent.toFixed(2),
      message: `Omsättningen har minskat med ${changePercent.toFixed(1)}% (${oldLead.revenue_tkr} → ${newLead.revenue_tkr} TKR)`
    };
  }

  return null;
}

/**
 * Detektera konkurs
 */
function detectBankruptcy(oldLead, newLead) {
  const oldStatus = (oldLead.legal_status || '').toLowerCase();
  const newStatus = (newLead.legal_status || '').toLowerCase();
  const oldKrono = (oldLead.kronofogden_check || '').toLowerCase();
  const newKrono = (newLead.kronofogden_check || '').toLowerCase();

  const bankruptcyKeywords = ['konkurs', 'bankruptcy', 'insolvent'];

  const hadBankruptcy = bankruptcyKeywords.some(kw => oldStatus.includes(kw) || oldKrono.includes(kw));
  const hasBankruptcy = bankruptcyKeywords.some(kw => newStatus.includes(kw) || newKrono.includes(kw));

  if (!hadBankruptcy && hasBankruptcy) {
    return {
      type: 'bankruptcy',
      severity: 'critical',
      old_value: oldStatus || oldKrono,
      new_value: newStatus || newKrono,
      message: `⚠️ KONKURS UPPTÄCKT: ${newStatus || newKrono}`
    };
  }

  return null;
}

/**
 * Detektera likvidation
 */
function detectLiquidation(oldLead, newLead) {
  const oldStatus = (oldLead.legal_status || '').toLowerCase();
  const newStatus = (newLead.legal_status || '').toLowerCase();

  const liquidationKeywords = ['likvidation', 'liquidation', 'avveckling'];

  const hadLiquidation = liquidationKeywords.some(kw => oldStatus.includes(kw));
  const hasLiquidation = liquidationKeywords.some(kw => newStatus.includes(kw));

  if (!hadLiquidation && hasLiquidation) {
    return {
      type: 'liquidation',
      severity: 'critical',
      old_value: oldStatus,
      new_value: newStatus,
      message: `🔴 LIKVIDATION UPPTÄCKT: ${newStatus}`
    };
  }

  return null;
}

/**
 * Detektera betalningsanmärkning
 */
function detectPaymentRemarks(oldLead, newLead) {
  const oldKrono = (oldLead.kronofogden_check || '').toLowerCase();
  const newKrono = (newLead.kronofogden_check || '').toLowerCase();
  const oldCredit = (oldLead.credit_rating || '').toLowerCase();
  const newCredit = (newLead.credit_rating || '').toLowerCase();

  const remarkKeywords = ['betalningsanmärkning', 'payment remark', 'anmärkning', 'skuld'];

  const hadRemarks = remarkKeywords.some(kw => oldKrono.includes(kw) || oldCredit.includes(kw));
  const hasRemarks = remarkKeywords.some(kw => newKrono.includes(kw) || newCredit.includes(kw));

  if (!hadRemarks && hasRemarks) {
    return {
      type: 'payment_remarks',
      severity: 'high',
      old_value: oldKrono || oldCredit,
      new_value: newKrono || newCredit,
      message: `💳 BETALNINGSANMÄRKNING: ${newKrono || newCredit}`
    };
  }

  return null;
}

/**
 * Detektera lagerflytt
 */
function detectWarehouseMove(oldLead, newLead) {
  const oldAddress = (oldLead.warehouse_address || oldLead.address || '').toLowerCase();
  const newAddress = (newLead.warehouse_address || newLead.address || '').toLowerCase();

  if (oldAddress && newAddress && oldAddress !== newAddress) {
    return {
      type: 'warehouse_move',
      severity: 'medium',
      old_value: oldAddress,
      new_value: newAddress,
      message: `📦 LAGERFLYTT: ${oldAddress} → ${newAddress}`
    };
  }

  return null;
}

/**
 * Detektera nya nyheter
 */
function detectNews(oldLead, newLead) {
  const oldNews = oldLead.latest_news || '';
  const newNews = newLead.latest_news || '';

  if (newNews && newNews !== oldNews) {
    return {
      type: 'news',
      severity: 'low',
      old_value: oldNews.substring(0, 100),
      new_value: newNews.substring(0, 100),
      message: `📰 NYA NYHETER: ${newNews.substring(0, 150)}...`
    };
  }

  return null;
}

/**
 * Detektera segmentändring
 */
function detectSegmentChange(oldLead, newLead) {
  const oldSegment = oldLead.segment;
  const newSegment = newLead.segment;

  if (oldSegment && newSegment && oldSegment !== newSegment) {
    const segmentOrder = ['DM', 'TS', 'FS', 'KAM'];
    const oldIndex = segmentOrder.indexOf(oldSegment);
    const newIndex = segmentOrder.indexOf(newSegment);

    const isUpgrade = newIndex > oldIndex;
    const severity = isUpgrade ? 'medium' : 'low';

    return {
      type: 'segment_change',
      severity,
      old_value: oldSegment,
      new_value: newSegment,
      message: `🔄 SEGMENTÄNDRING: ${oldSegment} → ${newSegment} ${isUpgrade ? '(UPPGRADERING)' : '(NEDGRADERING)'}`
    };
  }

  return null;
}

/**
 * Formatera triggers för email
 */
export function formatTriggersForEmail(triggers) {
  if (!triggers || triggers.length === 0) {
    return '<p>Inga ändringar upptäckta</p>';
  }

  let html = '<ul style="list-style: none; padding: 0;">';

  triggers.forEach(trigger => {
    const severityColors = {
      critical: '#D40511',
      high: '#FF6600',
      medium: '#FFCC00',
      low: '#0066CC'
    };

    const color = severityColors[trigger.severity] || '#666666';

    html += `
      <li style="padding: 12px; margin: 8px 0; background-color: #f8f9fa; border-left: 4px solid ${color};">
        <strong style="color: ${color}; text-transform: uppercase;">${trigger.type.replace(/_/g, ' ')}</strong>
        <p style="margin: 4px 0;">${trigger.message}</p>
        ${trigger.change_percentage ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Förändring: ${trigger.change_percentage}%</p>` : ''}
      </li>
    `;
  });

  html += '</ul>';

  return html;
}

/**
 * Få severity-nivå för notifikation
 */
export function getHighestSeverity(triggers) {
  if (!triggers || triggers.length === 0) return 'low';

  const severityOrder = ['critical', 'high', 'medium', 'low'];

  for (const severity of severityOrder) {
    if (triggers.some(t => t.severity === severity)) {
      return severity;
    }
  }

  return 'low';
}

export default {
  detectTriggers,
  formatTriggersForEmail,
  getHighestSeverity
};
