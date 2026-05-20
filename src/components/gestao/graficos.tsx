"use client";

// Gráficos em SVG puro — sem dependência externa, no estilo Lumière.

// ─── Gráfico de barras ───────────────────────────────────────────────────────
export function GraficoBarras({
  dados,
}: {
  dados: { label: string; valor: number }[];
}) {
  const W = 600;
  const H = 210;
  const pad = 30;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const bw = (W - pad * 2) / Math.max(dados.length, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {dados.map((d, i) => {
        const bh = (d.valor / max) * (H - pad * 2);
        const w = bw * 0.5;
        const x = pad + i * bw + (bw - w) / 2;
        const y = H - pad - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={H - pad - Math.max(bh, 2)}
              width={w}
              height={Math.max(bh, 2)}
              rx={6}
              className="fill-primary"
            />
            {d.valor > 0 && (
              <text
                x={x + w / 2}
                y={y - 7}
                textAnchor="middle"
                className="fill-on-surface"
                fontSize="10"
                fontWeight="700"
              >
                {d.valor.toLocaleString("pt-BR")}
              </text>
            )}
            <text
              x={x + w / 2}
              y={H - pad + 17}
              textAnchor="middle"
              className="fill-on-surface-variant"
              fontSize="11"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gráfico de linhas ───────────────────────────────────────────────────────
export function GraficoLinhas({
  labels,
  series,
}: {
  labels: string[];
  series: { nome: string; cor: string; valores: number[] }[];
}) {
  const W = 600;
  const H = 210;
  const pad = 34;
  const max = Math.max(...series.flatMap((s) => s.valores), 1);
  const xStep = (W - pad * 2) / Math.max(labels.length - 1, 1);
  const pt = (v: number, i: number): [number, number] => [
    pad + i * xStep,
    H - pad - (v / max) * (H - pad * 2),
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={H - pad - g * (H - pad * 2)}
            y2={H - pad - g * (H - pad * 2)}
            className="stroke-outline-variant/25"
            strokeWidth={1}
          />
        ))}
        {series.map((s, si) => {
          const d = s.valores
            .map((v, i) => {
              const [x, y] = pt(v, i);
              return `${i ? "L" : "M"}${x},${y}`;
            })
            .join(" ");
          return (
            <g key={si}>
              <path
                d={d}
                fill="none"
                stroke={s.cor}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.valores.map((v, i) => {
                const [x, y] = pt(v, i);
                return <circle key={i} cx={x} cy={y} r={3} fill={s.cor} />;
              })}
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text
            key={i}
            x={pad + i * xStep}
            y={H - pad + 17}
            textAnchor="middle"
            className="fill-on-surface-variant"
            fontSize="11"
          >
            {l}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {series.map((s) => (
          <span
            key={s.nome}
            className="inline-flex items-center gap-1.5 text-[11px] font-body text-on-surface-variant"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: s.cor }}
            />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Gráfico de rosca ────────────────────────────────────────────────────────
export function GraficoRosca({
  fatias,
}: {
  fatias: { label: string; valor: number; cor: string }[];
}) {
  const cx = 90;
  const cy = 90;
  const r = 64;
  const sw = 26;
  const C = 2 * Math.PI * r;
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 180 180" className="w-40 h-40">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-surface-high"
          strokeWidth={sw}
        />
        {total > 0 &&
          fatias.map((f, i) => {
            const len = (f.valor / total) * C;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={f.cor}
                strokeWidth={sw}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += len;
            return el;
          })}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          className="fill-on-surface"
          fontSize="16"
          fontWeight="700"
        >
          {total > 0 ? fatias.length : "—"}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 w-full">
        {fatias.length === 0 && (
          <p className="text-xs text-on-surface-variant font-body text-center">
            Sem despesas no período.
          </p>
        )}
        {fatias.map((f) => {
          const pct = total > 0 ? Math.round((f.valor / total) * 100) : 0;
          return (
            <div
              key={f.label}
              className="flex items-center gap-2 text-xs font-body"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: f.cor }}
              />
              <span className="text-on-surface flex-1 truncate">{f.label}</span>
              <span className="text-on-surface-variant tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
