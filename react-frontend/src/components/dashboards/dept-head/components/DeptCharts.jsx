import React, { useState } from 'react';

/**
 * Lightweight SVG charts reproducing the Chart.js visuals from department_head.html
 * (doughnut, line trend, horizontal bar) without adding a chart dependency.
 */

const Legend = ({ items }) => (
  <div className="dh-chart-legend">
    {items.map((it) => (
      <span key={it.label} className="dh-chart-legend-item">
        <span className="dh-chart-legend-dot" style={{ background: it.color }} />
        {it.label}
      </span>
    ))}
  </div>
);

// ---------- Doughnut ----------
export function DoughnutChart({ labels, data, colors, size = 200 }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((a, b) => a + b, 0);
  const r = 80;
  const stroke = 28; // ~65% cutout
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="0 0 200 200" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {total > 0 &&
            data.map((v, i) => {
              if (!v) return null;
              const len = (v / total) * c;
              const seg = (
                <circle
                  key={labels[i]}
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke={colors[i]}
                  strokeWidth={hover === i ? stroke + 6 : stroke}
                  strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
                  strokeDashoffset={-offset}
                  style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="dh-doughnut-center">
          {hover !== null ? (
            <>
              <div className="dh-doughnut-value">{data[hover]}</div>
              <div className="dh-doughnut-label">{labels[hover]}</div>
            </>
          ) : (
            <>
              <div className="dh-doughnut-value">{total}</div>
              <div className="dh-doughnut-label">Total</div>
            </>
          )}
        </div>
      </div>
      <Legend items={labels.map((l, i) => ({ label: l, color: colors[i] }))} />
    </div>
  );
}

// ---------- Line ----------
export function LineChart({ labels, data, color = '#3b82f6', label = 'Requests', height = 210 }) {
  const [hover, setHover] = useState(null);
  const W = 520;
  const H = height;
  const pad = { l: 36, r: 30, t: 14, b: 28 };
  const rawMax = Math.max(...data, 0);
  const step = rawMax <= 5 ? 1 : Math.ceil(rawMax / 4 / 5) * 5;
  const max = Math.max(step * 4, 4);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (labels.length <= 1 ? iw / 2 : (i * iw) / (labels.length - 1));
  const y = (v) => pad.t + ih - (v / max) * ih;

  // Smooth path (Catmull-Rom → bezier, like Chart.js tension 0.4)
  const pts = data.map((v, i) => [x(i), y(v)]);
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) {
      d += `M${p[0]},${p[1]}`;
      return;
    }
    const p0 = pts[i - 2] || pts[i - 1];
    const p1 = pts[i - 1];
    const p3 = pts[i + 1] || p;
    const t = 0.2;
    // clamp control points to the plot area so the curve never dips below 0
    const clampY = (v) => Math.min(pad.t + ih, Math.max(pad.t, v));
    const c1 = [p1[0] + (p[0] - p0[0]) * t, clampY(p1[1] + (p[1] - p0[1]) * t)];
    const c2 = [p[0] - (p3[0] - p1[0]) * t, clampY(p[1] - (p3[1] - p1[1]) * t)];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
  });
  const area = pts.length ? `${d} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z` : '';
  const ticks = [0, 1, 2, 3, 4].map((k) => k * (max / 4));

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#f1f5f9" strokeDasharray="5 5" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{Math.round(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{l}</text>
        ))}
        <path d={area} fill="rgba(59, 130, 246, 0.1)" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
            <circle cx={p[0]} cy={p[1]} r="12" fill="transparent" />
            <circle cx={p[0]} cy={p[1]} r={hover === i ? 6 : 4} fill="#fff" stroke={color} strokeWidth="2" />
            {hover === i && (
              <g>
                <rect x={p[0] - 32} y={p[1] - 34} width="64" height="22" rx="4" fill="#0f172a" />
                <text x={p[0]} y={p[1] - 19} textAnchor="middle" fontSize="11" fill="#fff">{`${labels[i]}: ${data[i]}`}</text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <Legend items={[{ label, color }]} />
    </div>
  );
}

// ---------- Horizontal Bar ----------
export function HBarChart({ labels, data, color = '#3b82f6', label = 'Usage %', max = 100 }) {
  if (!labels.length) {
    return <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>No resource usage data yet.</div>;
  }
  return (
    <div style={{ width: '100%' }}>
      <div className="dh-hbar-list">
        {labels.map((l, i) => (
          <div key={l} className="dh-hbar-row" title={`${l}: ${data[i]}%`}>
            <div className="dh-hbar-label">{l}</div>
            <div className="dh-hbar-track">
              <div className="dh-hbar-fill" style={{ width: `${Math.min(100, (data[i] / max) * 100)}%`, background: color }} />
            </div>
            <div className="dh-hbar-value">{data[i]}%</div>
          </div>
        ))}
      </div>
      <Legend items={[{ label, color }]} />
    </div>
  );
}
