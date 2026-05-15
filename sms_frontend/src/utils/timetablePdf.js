import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {Array} opts.timetable - slot rows from API
 */
export function downloadTimetablePdf({ title, subtitle, timetable }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(subtitle, 14, 23);
    doc.setTextColor(0);
  }

  const getSlot = (day, period) =>
    timetable.find(t => t.day_of_week === day && t.period_no === period);

  const head = [['Day / Period', ...PERIODS.map(p => `P${p}`)]];
  const body = DAYS.map(day => [
    day,
    ...PERIODS.map(p => {
      const slot = getSlot(day, p);
      if (!slot) return '—';
      const name = slot.course_name || slot.course_code || '';
      const faculty = slot.faculty_name ? `\n(${slot.faculty_name})` : '';
      return `${name}${faculty}`.trim() || '—';
    })
  ]);

  autoTable(doc, {
    startY: subtitle ? 28 : 22,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229] }
  });

  const safeName = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
  doc.save(`${safeName}_timetable.pdf`);
}
