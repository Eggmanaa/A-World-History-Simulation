/**
 * endgamePdf.ts
 *
 * Browser-native end-of-game PDF export.
 *
 * We deliberately avoid pulling in jsPDF / pdfmake: their bundles are large
 * and the sim is already a heavy WebGL app. Instead we generate a
 * print-friendly HTML document in a new tab and auto-invoke the browser's
 * print dialog, which gives users "Save as PDF" via the OS.
 *
 * What goes in the summary:
 *   - Header with student name + civ + date
 *   - Final score + per-track breakdown
 *   - Historical-outcome comparison (what really happened to this civ)
 *   - Turning-point decisions the student chose
 *   - Three reflection responses (surprised / would-change / comparison)
 *   - Full decision log (for teacher review)
 *
 * This is meant to be printable AND archivable. Teachers can collect these
 * as unit-assessment artifacts without needing any login or export tooling.
 */

import type { ReflectionResult } from './components/ReflectionTurn';
import { getCivHistoricalOutcome } from './civHistoricalOutcomes';

export interface EndgamePdfInput {
  studentName?: string;
  reflection: ReflectionResult;
  decisionLog: string[];
}

// Minimal HTML escape so untrusted student text doesn't break the template.
function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml({ studentName, reflection, decisionLog }: EndgamePdfInput): string {
  const outcome = getCivHistoricalOutcome(reflection.civId);
  const completedLocal = new Date(reflection.completedAt).toLocaleString();

  const trackRows = reflection.scoreBreakdown.map((t) => `
    <tr>
      <td>${esc(t.name)}</td>
      <td class="num">${t.score}</td>
      <td class="num">${t.benchmark}</td>
      <td class="num">${Math.min(100, Math.round((t.score / Math.max(1, t.benchmark)) * 100))}%</td>
    </tr>
  `).join('');

  const turningPointsList = reflection.turningPoints.length > 0
    ? `<ol>${reflection.turningPoints.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`
    : `<p class="muted">No turning points selected.</p>`;

  const decisionLogList = decisionLog.length > 0
    ? `<ol class="decision-log">${decisionLog.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>`
    : `<p class="muted">No decisions logged.</p>`;

  const outcomeBlock = outcome ? `
    <section class="block">
      <h2>The Real ${esc(outcome.realName)}</h2>
      <p><strong>Peak:</strong> ${esc(outcome.peakYear)}</p>
      <p><strong>How it ended:</strong> ${esc(outcome.endState)}</p>
      <p>${esc(outcome.narrative)}</p>
      <p><em>Primary legacy:</em> ${esc(outcome.primaryLegacy)}</p>
      <div class="compare-prompt"><strong>Comparison prompt:</strong> ${esc(outcome.comparisonPrompt)}</div>
    </section>
  ` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Ancient World Simulation &mdash; End-of-Game Summary &mdash; ${esc(reflection.civName)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      max-width: 780px;
      margin: 1.5rem auto;
      padding: 0 1rem;
      line-height: 1.45;
    }
    h1 { font-size: 1.5rem; margin: 0 0 0.2rem; color: #7a3a10; }
    h2 { font-size: 1.1rem; margin: 1.2rem 0 0.4rem; color: #7a3a10; border-bottom: 1px solid #d9c9a5; padding-bottom: 0.2rem; }
    h3 { font-size: 0.95rem; margin: 0.8rem 0 0.3rem; color: #3a3a3a; }
    .header {
      border-bottom: 2px solid #7a3a10;
      padding-bottom: 0.6rem;
      margin-bottom: 1rem;
    }
    .header-meta { font-size: 0.85rem; color: #555; }
    .score-box {
      background: #fbf6ea;
      border: 1px solid #c9b894;
      padding: 0.75rem 1rem;
      margin: 0.8rem 0;
    }
    .score-total { font-size: 1.6rem; color: #7a3a10; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid #e6ddc4; }
    th { background: #f4ecd5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .block { margin: 0.8rem 0; }
    .muted { color: #777; font-style: italic; }
    ol.decision-log { font-size: 0.85rem; }
    ol.decision-log li { margin: 0.15rem 0; }
    .response-box {
      background: #f9f9f4;
      border-left: 3px solid #a07040;
      padding: 0.5rem 0.8rem;
      margin: 0.4rem 0 0.8rem;
      white-space: pre-wrap;
      font-size: 0.95rem;
    }
    .compare-prompt {
      background: #fff4e0;
      border: 1px dashed #c49a5c;
      padding: 0.4rem 0.7rem;
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }
    .footer {
      margin-top: 2rem;
      border-top: 1px solid #ccc;
      padding-top: 0.5rem;
      font-size: 0.75rem;
      color: #888;
      text-align: center;
    }
    @media print {
      body { margin: 0.5in; max-width: none; }
      h2, h3 { page-break-after: avoid; }
      .response-box, .score-box { page-break-inside: avoid; }
    }
    .print-btn {
      background: #7a3a10; color: #fff; border: 0; padding: 0.5rem 1rem;
      font-size: 0.95rem; cursor: pointer; border-radius: 4px; margin: 0.3rem 0;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ancient World Simulation &mdash; End-of-Game Summary</h1>
    <div class="header-meta">
      <strong>${esc(studentName || 'Student')}</strong>
      &nbsp;&middot;&nbsp; ${esc(reflection.civName)}
      &nbsp;&middot;&nbsp; Completed ${esc(completedLocal)}
    </div>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="score-box">
    <div class="score-total">Final Score: ${reflection.finalScore}</div>
    <table>
      <thead>
        <tr><th>Track</th><th class="num">Score</th><th class="num">Benchmark</th><th class="num">%</th></tr>
      </thead>
      <tbody>
        ${trackRows}
      </tbody>
    </table>
  </div>

  ${outcomeBlock}

  <section class="block">
    <h2>Turning Points the Student Chose</h2>
    ${turningPointsList}
  </section>

  <section class="block">
    <h2>Reflection Responses</h2>

    <h3>What surprised you?</h3>
    <div class="response-box">${esc(reflection.responses.surprised) || '<span class="muted">No response</span>'}</div>

    <h3>What would you change?</h3>
    <div class="response-box">${esc(reflection.responses.wouldChange) || '<span class="muted">No response</span>'}</div>

    <h3>Your civilization vs. the real one</h3>
    <div class="response-box">${esc(reflection.responses.comparison) || '<span class="muted">No response</span>'}</div>
  </section>

  <section class="block">
    <h2>Full Decision Log</h2>
    ${decisionLogList}
  </section>

  <div class="footer">
    Generated by the Ancient World Simulation &mdash; classroom history simulator.
  </div>
</body>
</html>`;
}

/**
 * Opens a new browser tab with the print-ready summary and auto-invokes the
 * print dialog after a brief render delay. Users pick "Save as PDF" from the
 * OS print sheet.
 *
 * Returns true if a window was opened, false if the popup was blocked.
 */
export function exportEndgameSummaryPdf(input: EndgamePdfInput): boolean {
  const html = buildHtml(input);
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the new doc a moment to lay out before showing the print dialog.
  setTimeout(() => {
    try { win.focus(); win.print(); } catch { /* user can press print button */ }
  }, 300);
  return true;
}

// ============================================================
// CLASS REPORT (#48) - multi-student bundle
// ============================================================
// Same browser-print philosophy as the per-student summary, but lays out
// a class roster as a printable document. Cover page shows class summary
// stats (median / mean of final stats, top performers per category),
// followed by a row per student with their civ, traits, final stats,
// wonders, and any flags (missed turns, conquered, etc.).

export interface ClassReportStudent {
  studentName: string;
  civName: string;
  civColor?: string;
  traits?: string[];
  stats?: {
    martial?: number;
    faith?: number;
    industry?: number;
    science?: number;
    culture?: number;
    population?: number;
  };
  wondersBuilt?: { id: string; name: string }[];
  builtWonderId?: string | null;
  missedTurns?: number;
  totalAttacksInitiated?: number;
  finalScoreTotal?: number;
}

export interface ClassReportInput {
  periodName: string;
  teacherName?: string;
  currentYear?: number;
  students: ClassReportStudent[];
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function meanOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function buildClassHtml(input: ClassReportInput): string {
  const { periodName, teacherName, currentYear, students } = input;
  const completedLocal = new Date().toLocaleString();

  const martials = students.map((s) => s.stats?.martial ?? 0);
  const sciences = students.map((s) => s.stats?.science ?? 0);
  const cultures = students.map((s) => s.stats?.culture ?? 0);
  const faiths = students.map((s) => s.stats?.faith ?? 0);
  const pops = students.map((s) => s.stats?.population ?? 0);

  const champion = (key: 'martial' | 'science' | 'culture' | 'faith' | 'population') => {
    if (students.length === 0) return null;
    let best = students[0];
    for (const s of students) {
      if ((s.stats?.[key] ?? 0) > (best.stats?.[key] ?? 0)) best = s;
    }
    return { name: best.studentName, civ: best.civName, score: best.stats?.[key] ?? 0 };
  };

  const champions = {
    martial: champion('martial'),
    science: champion('science'),
    culture: champion('culture'),
    faith: champion('faith'),
    population: champion('population'),
  };

  const yearDisplay = typeof currentYear === 'number'
    ? (currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`)
    : '-';

  const champRow = (label: string, c: { name: string; civ: string; score: number } | null) => c
    ? `<tr><td>${esc(label)}</td><td>${esc(c.name)} (${esc(c.civ)})</td><td class="num">${c.score}</td></tr>`
    : '';

  const studentRows = students.map((s, idx) => {
    const traits = (s.traits || []).map(esc).join(', ') || '-';
    const wonders = (s.wondersBuilt || []).map((w) => esc(w.name || w.id)).join(', ') || '-';
    const flags: string[] = [];
    if (s.missedTurns && s.missedTurns > 0) flags.push(`${s.missedTurns} missed turn${s.missedTurns > 1 ? 's' : ''}`);
    if (s.totalAttacksInitiated && s.totalAttacksInitiated >= 3) flags.push(`Aggressor (${s.totalAttacksInitiated} attacks)`);
    return `
      <tr>
        <td class="num">${idx + 1}</td>
        <td>${esc(s.studentName)}</td>
        <td>${esc(s.civName)}</td>
        <td>${traits}</td>
        <td class="num">${s.stats?.martial ?? 0}</td>
        <td class="num">${s.stats?.science ?? 0}</td>
        <td class="num">${s.stats?.culture ?? 0}</td>
        <td class="num">${s.stats?.faith ?? 0}</td>
        <td class="num">${s.stats?.population ?? 0}</td>
        <td>${wonders}</td>
        <td class="muted">${flags.join('; ') || '-'}</td>
      </tr>
    `;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Class Report - ${esc(periodName)}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; }
  h1 { font-size: 22pt; margin: 0 0 0.2em 0; color: #1e293b; }
  h2 { font-size: 14pt; margin: 1.2em 0 0.4em; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .meta { color: #64748b; font-size: 10pt; margin-bottom: 1em; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 0.4em 0; }
  th { background: #f1f5f9; text-align: left; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: #94a3b8; font-style: italic; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin: 6px 4px; display: inline-block; min-width: 140px; }
  .summary-card .label { font-size: 8.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-card .value { font-size: 18pt; font-weight: 700; color: #0f172a; }
  .grid { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 -4px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>Class Report - ${esc(periodName)}</h1>
  <p class="meta">
    ${teacherName ? `Teacher: ${esc(teacherName)} | ` : ''}
    Year: ${esc(yearDisplay)} |
    ${students.length} student${students.length === 1 ? '' : 's'} |
    Generated ${esc(completedLocal)}
  </p>

  <h2>Class Summary</h2>
  <div class="grid">
    <div class="summary-card"><div class="label">Median Martial</div><div class="value">${median(martials).toFixed(1)}</div></div>
    <div class="summary-card"><div class="label">Median Science</div><div class="value">${median(sciences).toFixed(1)}</div></div>
    <div class="summary-card"><div class="label">Median Culture</div><div class="value">${median(cultures).toFixed(1)}</div></div>
    <div class="summary-card"><div class="label">Median Faith</div><div class="value">${median(faiths).toFixed(1)}</div></div>
    <div class="summary-card"><div class="label">Median Population</div><div class="value">${median(pops).toFixed(1)}</div></div>
  </div>
  <p class="meta">Mean Martial ${meanOf(martials).toFixed(1)} | Mean Science ${meanOf(sciences).toFixed(1)} | Mean Culture ${meanOf(cultures).toFixed(1)} | Mean Faith ${meanOf(faiths).toFixed(1)} | Mean Population ${meanOf(pops).toFixed(1)}</p>

  <h2>Track Champions</h2>
  <table>
    <thead><tr><th>Track</th><th>Student (Civ)</th><th>Score</th></tr></thead>
    <tbody>
      ${champRow('Martial Champion', champions.martial)}
      ${champRow('Science Champion', champions.science)}
      ${champRow('Culture Champion', champions.culture)}
      ${champRow('Faith Champion', champions.faith)}
      ${champRow('Population Champion', champions.population)}
    </tbody>
  </table>

  <h2>Civilization Roster</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student</th>
        <th>Civilization</th>
        <th>Traits</th>
        <th>Mar.</th>
        <th>Sci.</th>
        <th>Cul.</th>
        <th>Fai.</th>
        <th>Pop.</th>
        <th>Wonders</th>
        <th>Flags</th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Class report - opens in a new tab, auto-invokes print dialog. Teachers
 * pick "Save as PDF" from the OS print sheet.
 *
 * Returns true if a window was opened, false if the popup was blocked.
 */
export function exportClassReportPdf(input: ClassReportInput): boolean {
  const html = buildClassHtml(input);
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try { win.focus(); win.print(); } catch { /* user can press print button */ }
  }, 300);
  return true;
}
