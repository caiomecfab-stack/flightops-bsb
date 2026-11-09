import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, Database, PlusCircle, UserCheck, Plane, Printer, Users, ChevronLeft,
  Menu, LogOut, Filter, PieChart, Pencil, Trash2, CalendarDays, Zap,
  ShieldCheck, KeyRound, UserPlus, RotateCcw, FileText, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { supabase, supabaseConfigurado } from './supabase.js';

/* ================================================================
   ESTILOS REUTILIZÁVEIS
   ================================================================ */
const C = {
  painel: 'rounded-2xl border border-slate-800 bg-[#0c1424]/90',
  caixa: 'rounded-xl border border-slate-800 bg-[#050a16]',
  input:
    'w-full rounded-xl border border-slate-800 bg-[#050a16] px-3 py-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 [color-scheme:dark]',
  label: 'block mb-1.5 text-[11px] uppercase tracking-wide text-slate-400',
  botao:
    'rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wide px-4 py-3 transition',
  botaoSec:
    'rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800 transition',
  titulo: 'flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-400'
};

const TEMAS = {
  sky: { texto: 'text-sky-400', barra: 'from-sky-300 to-sky-600' },
  emerald: { texto: 'text-emerald-400', barra: 'from-emerald-300 to-emerald-600' },
  cyan: { texto: 'text-cyan-400', barra: 'from-cyan-300 to-cyan-600' },
  indigo: { texto: 'text-indigo-400', barra: 'from-indigo-300 to-indigo-600' },
  amber: { texto: 'text-amber-400', barra: 'from-amber-300 to-amber-600' },
  rose: { texto: 'text-rose-400', barra: 'from-amber-300 to-rose-500' }
};

/* ================================================================
   FUNÇÕES AUXILIARES
   ================================================================ */
const lerLocal = (k, padrao) => {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : padrao;
  } catch {
    return padrao;
  }
};
const gravarLocal = (k, v) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignora */
  }
};

const p2 = (n) => String(n).padStart(2, '0');
const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fmtData = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const fmtTs = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} às ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const DIAS = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
const diaSemana = (iso) => (iso ? DIAS[new Date(iso + 'T12:00:00').getDay()] : '');

// Aceita 1330, 13:30, 930...
const normHora = (v) => {
  const d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  const p = d.padStart(4, '0').slice(-4);
  return `${p2(Math.min(Number(p.slice(0, 2)), 23))}:${p2(Math.min(Number(p.slice(2)), 59))}`;
};
const minutos = (h) => {
  if (!/^\d{2}:\d{2}$/.test(h || '')) return null;
  const [a, b] = h.split(':').map(Number);
  return a * 60 + b;
};
const intervalo = (ini, fim) => {
  const a = minutos(ini);
  const b = minutos(fim);
  if (a === null || b === null) return null;
  let d = b - a;
  if (d < 0) d += 1440; // passou da meia-noite
  return d;
};

/* ---------------------------------------------------------------
   ÍNDICE DE EFETIVIDADE
   = (tempo entre CHAMADA e DECOLAGEM prevista)
     ÷ (tempo entre CHAMADA e HORA REAL de atendimento) × 100
   Para trocar a fórmula, altere somente esta função.
   --------------------------------------------------------------- */
const calcEfetividade = (chamada, decolagem, real) => {
  const previsto = intervalo(chamada, decolagem);
  const executado = intervalo(chamada, real);
  if (previsto === null || executado === null || executado === 0) return null;
  return Math.round((previsto / executado) * 1000) / 10;
};
const fmtEf = (ef) => (ef === null || ef === undefined ? 'N/A' : `${String(ef).replace('.', ',')}%`);

const hashSenha = async (nome, senha) => {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${nome.trim().toUpperCase()}:${senha}`)
  );
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

/* ---------------------------------------------------------------
   CRUZAMENTO DE LISTAS (ignora patentes)
   --------------------------------------------------------------- */
const PATENTES = new Set([
  'SD', 'CB', '3S', '2S', '1S', 'SO', 'SGT', 'ST', 'ASP', 'AP', '2T', '1T', 'TEN', 'CAP', 'MAJ',
  'TC', 'CEL', 'BRIG', 'MBRIG', 'TBRIG', 'MAREC', 'GEN', 'CMG', 'CF', 'CC', 'CT', 'MN', 'SUB',
  'S1', 'S2', 'S3', '1SGT', '2SGT', '3SGT', '1TEN', '2TEN', 'DR', 'DRA', 'SR', 'SRA'
]);
const limparNome = (linha) => {
  const t = linha
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\s*\d+\s*[.)\-–:]\s+/, '')
    .replace(/[.,;()\-–]/g, ' ');
  const partes = t.split(/\s+/).filter(Boolean);
  while (partes.length > 1 && PATENTES.has(partes[0])) partes.shift();
  return partes.join(' ');
};
const cruzar = (txtPrevisto, txtReal) => {
  const lista = (t) => [...new Set((t || '').split('\n').map(limparNome).filter(Boolean))];
  const prev = lista(txtPrevisto);
  const real = lista(txtReal);
  const sr = new Set(real);
  const sp = new Set(prev);
  const embarcados = prev.filter((n) => sr.has(n)).length;
  return {
    total_previsto: prev.length,
    embarcados,
    faltas: prev.length - embarcados,
    extras: real.filter((n) => !sp.has(n)).length
  };
};

/* ---------------------------------------------------------------
   FILTROS (valem para voos e para desembarques)
   --------------------------------------------------------------- */
const FILTRO_VAZIO = { aeronave: '', inicial: '', final: '', data: '', mes: '', local: '' };
const codigosRota = (rota) => (rota || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);

const filtrarVoos = (lista, f) =>
  lista.filter((v) => {
    if (f.aeronave && v.aeronave !== f.aeronave) return false;
    if (f.inicial && v.data_voo < f.inicial) return false;
    if (f.final && v.data_voo > f.final) return false;
    if (f.data && v.data_voo !== f.data) return false;
    if (f.mes && !v.data_voo.startsWith(f.mes)) return false;
    if (f.local && !codigosRota(v.rota).includes(f.local)) return false;
    return true;
  });

const somar = (lista, campo) => lista.reduce((s, v) => s + (Number(v[campo]) || 0), 0);

// Os filtros só passam a valer quando o botão "Gerar filtros" é clicado
function useFiltro() {
  const [rascunho, setRascunho] = useState(FILTRO_VAZIO);
  const [aplicado, setAplicado] = useState(FILTRO_VAZIO);
  const pendente = JSON.stringify(rascunho) !== JSON.stringify(aplicado);
  const gerar = () => setAplicado(rascunho);
  const limpar = () => {
    setRascunho(FILTRO_VAZIO);
    setAplicado(FILTRO_VAZIO);
  };
  return { rascunho, setRascunho, aplicado, gerar, limpar, pendente };
}

/* ================================================================
   FUNDO ANIMADO COM AERONAVES DA FAB
   Desenhos estilizados em SVG. Para usar fotos reais, coloque os
   arquivos na pasta public/avioes do projeto e preencha o campo
   "foto" de cada aeronave, por exemplo: foto: '/avioes/kc390.png'
   ================================================================ */
const FUNDO = '#050a16';
const traco = { stroke: FUNDO, strokeWidth: 1.6, strokeLinejoin: 'round' };

const AVIOES = [
  {
    id: 'kc390',
    nome: 'KC-390 Millennium',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M84 26 L134 26 L110 3 L97 3 Z" />
        <path d="M8 34 L28 25 L168 23 Q198 25 214 37 Q198 47 168 47 L30 47 Z" />
        <path d="M12 34 L6 6 L26 6 L42 25 Z" />
        <rect x="0" y="5" width="36" height="4" rx="1.5" />
        <ellipse cx="110" cy="31" rx="14" ry="5.5" />
      </g>
    )
  },
  {
    id: 'kc30',
    nome: 'KC-30',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M88 42 L142 42 L114 64 L100 64 Z" />
        <path d="M4 36 L24 28 L178 26 Q208 28 218 38 Q204 47 178 47 L24 47 Z" />
        <path d="M10 36 L4 4 L28 4 L46 28 Z" />
        <path d="M20 41 L58 41 L34 53 L10 53 Z" />
        <ellipse cx="118" cy="54" rx="15" ry="6" />
        <rect x="0" y="45" width="26" height="3" />
      </g>
    )
  },
  {
    id: 'c98',
    nome: 'C-98',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M78 25 L150 25 L140 10 L88 10 Z" />
        <path d="M40 36 Q40 26 56 25 L150 25 Q172 26 182 36 Q170 45 150 45 L56 45 Q40 44 40 36 Z" />
        <path d="M44 34 L38 12 L56 12 L66 26 Z" />
        <path d="M104 25 L128 45" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="187" cy="37" rx="2.5" ry="14" />
        <circle cx="150" cy="53" r="4" />
        <circle cx="70" cy="50" r="3.5" />
      </g>
    )
  },
  {
    id: 'c99',
    nome: 'C-99',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M92 40 L140 40 L112 56 L100 56 Z" />
        <path d="M20 34 L36 28 L170 26 Q204 28 214 36 Q204 44 170 44 L40 44 Z" />
        <path d="M24 34 L18 8 L38 8 L50 28 Z" />
        <rect x="8" y="7" width="40" height="4" rx="1.5" />
        <ellipse cx="52" cy="34" rx="16" ry="5" />
      </g>
    )
  },
  {
    id: 'c105',
    nome: 'C-105 Amazonas',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M82 25 L146 25 L128 6 L98 6 Z" />
        <path d="M10 33 L28 25 L160 24 Q184 26 194 36 Q182 46 160 46 L30 46 Z" />
        <path d="M12 33 L8 8 L28 8 L40 25 Z" />
        <rect x="2" y="7" width="38" height="4" rx="1.5" />
        <ellipse cx="116" cy="32" rx="16" ry="6" />
        <ellipse cx="134" cy="32" rx="2.5" ry="15" />
      </g>
    )
  },
  {
    id: 'c97',
    nome: 'C-97 Brasília',
    foto: '',
    desenho: (
      <g {...traco}>
        <path d="M84 40 L136 40 L112 54 L96 54 Z" />
        <path d="M14 34 L30 29 L164 28 Q196 30 206 36 Q196 42 164 42 L32 42 Z" />
        <path d="M16 34 L10 8 L30 8 L42 29 Z" />
        <rect x="4" y="7" width="38" height="4" rx="1.5" />
        <ellipse cx="112" cy="48" rx="15" ry="5" />
        <ellipse cx="130" cy="48" rx="2.5" ry="13" />
      </g>
    )
  }
];

function FundoAeronaves() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % AVIOES.length), 22000);
    return () => clearInterval(t);
  }, []);
  const a = AVIOES[i];
  const altura = [12, 62, 28, 72, 20, 48][i % 6];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050a16]" aria-hidden="true">
      <style>{`
        @keyframes fundo-cruzar {
          from { transform: translateX(-520px); }
          to { transform: translateX(calc(100vw + 520px)); }
        }
        .fundo-aviao { left: 0; animation: fundo-cruzar 22s linear forwards; }
        @media (prefers-reduced-motion: reduce) {
          .fundo-aviao { animation: none; left: 35%; }
        }
      `}</style>
      <div key={a.id} className="fundo-aviao absolute" style={{ top: `${altura}%` }}>
        <div className="flex items-center">
          <div className="h-[2px] w-40 bg-gradient-to-r from-transparent to-sky-400/25" />
          <div className="w-[300px] text-sky-300">
            {a.foto ? (
              <img src={a.foto} alt={a.nome} className="w-full opacity-25" />
            ) : (
              <svg viewBox="0 0 220 70" className="w-full opacity-[0.16]" fill="currentColor">
                {a.desenho}
              </svg>
            )}
            <div className="mt-1 text-center font-mono text-[10px] uppercase tracking-widest text-sky-300/40">{a.nome}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   COMPONENTES PEQUENOS
   ================================================================ */
function Campo({ rotulo, children, className = '' }) {
  return (
    <div className={className}>
      <label className={C.label}>{rotulo}</label>
      {children}
    </div>
  );
}

function CamposFiltro({ f, setF, aeronaves, comMes = true, rotulos = {} }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <Campo rotulo="Aeronave FAB">
        <select className={C.input} value={f.aeronave} onChange={set('aeronave')}>
          <option value="">TODAS AS AERONAVES</option>
          {aeronaves.map((a) => (
            <option key={a.id} value={a.modelo}>{a.modelo}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo={rotulos.inicial || 'Data inicial'}>
        <input type="date" className={C.input} value={f.inicial} onChange={set('inicial')} />
      </Campo>
      <Campo rotulo={rotulos.final || 'Data final'}>
        <input type="date" className={C.input} value={f.final} onChange={set('final')} />
      </Campo>
      <Campo rotulo={rotulos.data || 'Data específica'}>
        <input type="date" className={C.input} value={f.data} onChange={set('data')} />
      </Campo>
      {comMes && (
        <Campo rotulo="Mês / Ano">
          <input type="month" className={C.input} value={f.mes} onChange={set('mes')} />
        </Campo>
      )}
    </>
  );
}

function BotoesFiltro({ filtro }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
      <button type="button" onClick={filtro.gerar} className={`${C.botao} flex items-center gap-2`}>
        <Filter size={14} /> Gerar filtros
      </button>
      <button type="button" onClick={filtro.limpar} className={C.botaoSec}>
        Limpar
      </button>
      {filtro.pendente && (
        <span className="text-[11px] font-bold uppercase text-amber-400">
          Alterações ainda não aplicadas — clique em Gerar filtros
        </span>
      )}
    </div>
  );
}

const PALETA = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#22d3ee', '#f472b6', '#a3e635'];

function CartaoMetrica({ titulo, total, unidade, tema, dados, destaque, onSelecionar }) {
  const [modo, setModo] = useState('barras');
  const [hover, setHover] = useState('');
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPronto(true), 50);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...dados.map((d) => d.valor), 1);
  const soma = dados.reduce((s, d) => s + d.valor, 0);
  const pct = (v) => (soma ? ((v / soma) * 100).toFixed(1).replace('.', ',') : '0,0');
  const foco = hover || destaque || '';
  const itemFoco = dados.find((d) => d.nome === foco);
  const apagado = (d) => foco && d.nome !== foco;
  const sufixo = unidade ? ` ${unidade}` : '';

  const eventos = (d) => ({
    onMouseEnter: () => setHover(d.nome),
    onMouseLeave: () => setHover(''),
    onClick: () => onSelecionar && onSelecionar(d.nome)
  });

  const R = 42;
  const CIRC = 2 * Math.PI * R;
  let acumulado = 0;
  const fatias = dados.map((d, i) => {
    const len = soma ? (d.valor / soma) * CIRC : 0;
    const fatia = { d, i, len, off: acumulado };
    acumulado += len;
    return fatia;
  });

  return (
    <div className={`${C.painel} p-5`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-300">{titulo}</span>
        <span className={`font-mono text-xl font-extrabold ${tema.texto}`}>
          {total}
          {unidade && <small className="ml-1 text-base">{unidade}</small>}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {[
          ['barras', 'Barras', BarChart3],
          ['rosca', 'Rosca', PieChart]
        ].map(([id, rot, Ic]) => (
          <button
            key={id}
            type="button"
            onClick={() => setModo(id)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase transition ${
              modo === id ? 'border-sky-500 bg-sky-950/50 text-sky-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Ic size={11} /> {rot}
          </button>
        ))}
      </div>

      {modo === 'barras' ? (
        <div className={`${C.caixa} mt-3 flex h-40 items-end justify-center gap-4 overflow-x-auto px-4 pt-3`}>
          {dados.length === 0 ? (
            <span className="self-center text-[11px] uppercase text-slate-600">Sem dados</span>
          ) : (
            dados.map((d) => (
              <button
                key={d.nome}
                type="button"
                {...eventos(d)}
                className={`flex h-full min-w-[48px] flex-col items-center justify-end pb-1 transition-opacity duration-200 ${
                  apagado(d) ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div
                  className={`flex w-12 items-start justify-center overflow-hidden rounded-t-lg bg-gradient-to-b ${tema.barra} pt-0.5 font-mono text-[10px] font-bold text-slate-900 transition-all duration-700 ease-out hover:brightness-125 ${
                    d.nome === destaque ? 'ring-2 ring-white' : ''
                  }`}
                  style={{ height: pronto ? `${Math.max((d.valor / max) * 78, 14)}%` : '0%' }}
                >
                  {d.valor}
                </div>
                <span className="max-w-[60px] truncate pt-1 text-[9px] uppercase text-slate-500">{d.rotulo}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className={`${C.caixa} mt-3 flex h-40 items-center justify-center gap-5 px-4`}>
          {soma === 0 ? (
            <span className="text-[11px] uppercase text-slate-600">Sem dados</span>
          ) : (
            <>
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r={R} fill="none" stroke="#1e293b" strokeWidth="16" />
                  {fatias.map(({ d, i, len, off }) => (
                    <circle
                      key={d.nome}
                      cx="60"
                      cy="60"
                      r={R}
                      fill="none"
                      stroke={PALETA[i % PALETA.length]}
                      strokeWidth={d.nome === foco ? 20 : 16}
                      strokeDasharray={`${pronto ? len : 0} ${CIRC}`}
                      strokeDashoffset={-off}
                      className="cursor-pointer transition-all duration-700"
                      style={{ opacity: apagado(d) ? 0.3 : 1 }}
                      {...eventos(d)}
                    />
                  ))}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-sm font-extrabold text-white">{itemFoco ? itemFoco.valor : total}</span>
                  <span className="text-[9px] uppercase text-slate-500">{itemFoco ? `${pct(itemFoco.valor)}%` : 'total'}</span>
                </div>
              </div>
              <div className="flex max-h-32 min-w-0 flex-col gap-1 overflow-y-auto">
                {fatias.map(({ d, i }) => (
                  <button
                    key={d.nome}
                    type="button"
                    {...eventos(d)}
                    className={`flex items-center gap-2 text-left text-[10px] uppercase transition-opacity ${
                      apagado(d) ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETA[i % PALETA.length] }} />
                    <span className="truncate text-slate-300">{d.nome}</span>
                    <span className="font-mono text-slate-500">{pct(d.valor)}%</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex min-h-[20px] items-center justify-between gap-2 text-[11px] uppercase">
        {itemFoco ? (
          <>
            <span className="truncate font-bold text-white">{itemFoco.nome}</span>
            <span className={`shrink-0 font-mono font-bold ${tema.texto}`}>
              {itemFoco.valor}
              {sufixo} · {pct(itemFoco.valor)}%
            </span>
          </>
        ) : (
          <span className="text-slate-600">Passe o mouse ou toque para ver detalhes · clique para destacar</span>
        )}
      </div>
    </div>
  );
}

function Caixa({ rotulo, valor, destaque }) {
  return (
    <div className={`${C.caixa} px-2 py-2 text-center`}>
      <div className="text-[10px] uppercase text-slate-500">{rotulo}</div>
      <div className={`font-mono text-xs font-bold ${destaque ? 'text-sky-400' : 'text-white'}`}>{valor}</div>
    </div>
  );
}

function CartaoVoo({ v, onEditar, onApagar }) {
  const ef = calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real);
  const corEf =
    ef === null
      ? 'border-slate-700 text-slate-400'
      : ef >= 100
      ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400'
      : 'border-amber-700 bg-amber-950/40 text-amber-400';
  return (
    <div className={`${C.painel} space-y-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase text-sky-400">{v.aeronave}</h3>
          <p className="mt-1 text-[11px] uppercase text-slate-400">
            Matrícula: <b className="font-mono text-white">{v.matricula || 'N/D'}</b>
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-md bg-slate-800/80 px-2 py-1 font-mono text-[11px] font-bold text-sky-300">
            {v.rota || '—'}
          </span>
          <p className="mt-1 font-mono text-[10px] text-slate-500">{v.data_voo}</p>
        </div>
      </div>

      <div className={`${C.caixa} grid grid-cols-3 py-3 text-center`}>
        {[
          ['Chamada', v.hora_chamada],
          ['Decolagem', v.hora_decolagem],
          ['Hora real', v.hora_real]
        ].map(([r, h]) => (
          <div key={r}>
            <div className="text-[10px] uppercase text-slate-500">{r}</div>
            <div className="font-mono text-xs font-bold text-white">{h || '--:--'}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Caixa rotulo="Pax" valor={v.pax} />
        <Caixa rotulo="Peso pax" valor={`${v.peso_pax} KG`} />
        <Caixa rotulo="Bagagem" valor={`${v.peso_bagagem} KG`} />
        <Caixa rotulo="Total" valor={`${v.total_peso} KG`} destaque />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-3 text-[11px] uppercase text-slate-400">
        <span>
          Qtd bagagens: <b className="font-mono text-white">{v.qtd_bagagens}</b>
        </span>
        <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-bold ${corEf}`}>
          <Zap size={12} /> Efetividade: {fmtEf(ef)}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-sky-900/60 bg-sky-950/30 px-3 py-2 text-[11px] uppercase text-sky-400">
        <CalendarDays size={14} /> Dia: <b className="font-mono text-white">{diaSemana(v.data_voo)}</b>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <span className="rounded-lg border border-slate-800 bg-[#050a16] px-2.5 py-1.5 text-[10px] uppercase text-slate-400">
          Última alt. por: <b className="font-mono text-white">{v.ultima_alt_por || '—'}</b>{' '}
          <span className="font-mono text-sky-300">({fmtTs(v.ultima_alt_em)})</span>
        </span>
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase">
          <button onClick={() => onEditar(v)} className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
            <Pencil size={13} /> Editar
          </button>
          <button onClick={() => onApagar(v)} className="flex items-center gap-1 text-rose-400 hover:text-rose-300">
            <Trash2 size={13} /> Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ dados, onCancelar, onConfirmar }) {
  const [ocupado, setOcupado] = useState(false);
  if (!dados) return null;
  const confirmar = async () => {
    setOcupado(true);
    await onConfirmar();
    setOcupado(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`${C.painel} w-full max-w-md space-y-4 p-6`}>
        <div className="flex items-center gap-3 text-rose-400">
          <AlertTriangle size={22} />
          <h3 className="text-sm font-bold uppercase">{dados.titulo}</h3>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{dados.texto}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-700 py-3 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={ocupado}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {dados.botao || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TELAS
   ================================================================ */
function TelaConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050a16] p-6 text-slate-200">
      <div className={`${C.painel} max-w-lg space-y-3 p-8`}>
        <h1 className="text-sm font-bold uppercase text-amber-400">Banco de dados não configurado</h1>
        <p className="text-xs leading-relaxed text-slate-300">
          Faltam as variáveis <b className="font-mono">VITE_SUPABASE_URL</b> e{' '}
          <b className="font-mono">VITE_SUPABASE_ANON_KEY</b>. Cadastre as duas em Environment no Render e faça um novo
          deploy.
        </p>
      </div>
    </div>
  );
}

function TelaLogin({ onEntrar, online }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [ver, setVer] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    const r = await onEntrar(nome, senha);
    if (r) {
      setErro(r);
      setOcupado(false);
    }
  };

  return (
    <>
      <FundoAeronaves />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 text-slate-200">
        <form onSubmit={enviar} className={`${C.painel} w-full max-w-sm space-y-5 p-8`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-600 p-2.5 text-white">
              <Plane size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold uppercase">
                FlightOps <span className="text-sky-400">BSB</span>
              </h1>
              <p className="text-[10px] uppercase text-slate-400">Posto CAN BR — Base Aérea de Brasília</p>
            </div>
          </div>
          <Campo rotulo="Utilizador">
            <input className={C.input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="EX: CAIO" autoCapitalize="characters" required />
          </Campo>
          <Campo rotulo="Senha">
            <div className="relative">
              <input
                type={ver ? 'text' : 'password'}
                className={`${C.input} pr-11`}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setVer((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-sky-400"
                aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Campo>
          {erro && <p className="text-xs font-bold text-rose-400">{erro}</p>}
          {!online && <p className="text-xs text-amber-400">A ligar ao servidor… se demorar, verifique a internet.</p>}
          <button type="submit" disabled={ocupado} className={`${C.botao} w-full`}>
            {ocupado ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
      </div>
    </>
  );
}

function TelaDashboard({ voos, desembarques, aeronaves }) {
  const filtro = useFiltro();
  const f = filtro.aplicado;
  const [mostrarEstat, setMostrarEstat] = useState(false);
  const [destaque, setDestaque] = useState('');
  const filtrados = useMemo(() => filtrarVoos(voos, f), [voos, f]);
  const filtDesemb = useMemo(() => filtrarVoos(desembarques, f), [desembarques, f]);

  const localidades = useMemo(
    () => [...new Set([...voos, ...desembarques].flatMap((v) => codigosRota(v.rota)))].filter((c) => c !== 'SBBR').sort(),
    [voos, desembarques]
  );

  const grupos = useMemo(() => {
    const nomes = [...new Set([...filtrados.map((v) => v.aeronave), ...filtDesemb.map((d) => d.aeronave)])];
    return nomes.map((nome) => {
      const lv = filtrados.filter((v) => v.aeronave === nome);
      const ld = filtDesemb.filter((d) => d.aeronave === nome);
      const efs = lv
        .map((v) => calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real))
        .filter((e) => e !== null);
      return {
        aeronave: nome,
        voos: lv.length,
        pax: somar(lv, 'pax'),
        desemb: somar(ld, 'desembarcados'),
        pesoPax: somar(lv, 'peso_pax'),
        bagagem: somar(lv, 'peso_bagagem'),
        total: somar(lv, 'total_peso'),
        ef: efs.length ? Math.round((efs.reduce((a, b) => a + b, 0) / efs.length) * 10) / 10 : null
      };
    });
  }, [filtrados, filtDesemb]);

  const gd = grupos.find((g) => g.aeronave === destaque);
  const alternar = (nome) => setDestaque((d) => (d === nome ? '' : nome));
  const dados = (campo) =>
    grupos.map((g) => ({ rotulo: g.aeronave.split(' ')[0], nome: g.aeronave, valor: g[campo] }));
  const setLocal = (e) => filtro.setRascunho({ ...filtro.rascunho, local: e.target.value });

  const cartoes = [
    ['Total de voos', filtrados.length, '', TEMAS.sky, 'voos'],
    ['Total de passageiros (PAX)', somar(filtrados, 'pax'), '', TEMAS.emerald, 'pax'],
    ['Total desembarcados', somar(filtDesemb, 'desembarcados'), '', TEMAS.cyan, 'desemb'],
    ['Peso total pax', somar(filtrados, 'peso_pax'), 'KG', TEMAS.indigo, 'pesoPax'],
    ['Peso total de bagagem', somar(filtrados, 'peso_bagagem'), 'KG', TEMAS.amber, 'bagagem'],
    ['Peso total transp.', somar(filtrados, 'total_peso'), 'KG', TEMAS.rose, 'total']
  ];

  return (
    <div className="space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Filter size={14} /> Filtros operacionais — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={filtro.rascunho} setF={filtro.setRascunho} aeronaves={aeronaves} />
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 lg:grid-cols-2">
          <Campo rotulo="Filtrar pax por localidade / destino">
            <select className={C.input} value={filtro.rascunho.local} onChange={setLocal}>
              <option value="">TODAS AS LOCALIDADES (GERAL)</option>
              {localidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>
        </div>
        <BotoesFiltro filtro={filtro} />
      </div>

      <div className={`${C.painel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-600 p-2.5 text-white"><PieChart size={18} /></div>
          <div>
            <h3 className="text-xs font-extrabold uppercase text-white">Perfil estatística operacional</h3>
            <p className="text-[11px] text-slate-400">Gere a visão consolidada por tipo de aeronave aplicando os filtros acima.</p>
          </div>
        </div>
        <button onClick={() => setMostrarEstat((x) => !x)} className={`${C.botao} flex items-center gap-2 rounded-full`}>
          <PieChart size={14} /> {mostrarEstat ? 'Ocultar estatística' : 'Gerar estatística'}
        </button>
      </div>

      {mostrarEstat && (
        <div className={`${C.painel} overflow-x-auto p-5`}>
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                {['Aeronave', 'Voos', 'Pax', 'Desemb.', 'Peso pax', 'Bagagem', 'Total', 'Efetividade média'].map((h) => (
                  <th key={h} className="px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {grupos.length === 0 && (
                <tr><td colSpan="8" className="px-2 py-4 text-center text-slate-500">Sem voos para os filtros atuais.</td></tr>
              )}
              {grupos.map((g) => (
                <tr key={g.aeronave} className="border-b border-slate-800/60">
                  <td className="px-2 py-2 font-bold text-sky-400">{g.aeronave}</td>
                  <td className="px-2 py-2">{g.voos}</td>
                  <td className="px-2 py-2">{g.pax}</td>
                  <td className="px-2 py-2">{g.desemb}</td>
                  <td className="px-2 py-2">{g.pesoPax} kg</td>
                  <td className="px-2 py-2">{g.bagagem} kg</td>
                  <td className="px-2 py-2">{g.total} kg</td>
                  <td className="px-2 py-2 text-emerald-400">{fmtEf(g.ef)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {gd && (
        <div className={`${C.painel} flex flex-wrap items-center gap-4 p-5`}>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Aeronave em destaque</div>
            <div className="text-sm font-extrabold uppercase text-sky-400">{gd.aeronave}</div>
          </div>
          <div className="grid min-w-[280px] flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <Caixa rotulo="Voos" valor={gd.voos} />
            <Caixa rotulo="Pax" valor={gd.pax} />
            <Caixa rotulo="Desemb." valor={gd.desemb} />
            <Caixa rotulo="Peso pax" valor={`${gd.pesoPax} KG`} />
            <Caixa rotulo="Bagagem" valor={`${gd.bagagem} KG`} />
            <Caixa rotulo="Total" valor={`${gd.total} KG`} destaque />
            <Caixa rotulo="Efetividade" valor={fmtEf(gd.ef)} destaque />
          </div>
          <button onClick={() => setDestaque('')} className="text-[11px] font-bold uppercase text-rose-400 underline">
            Limpar destaque
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cartoes.map(([titulo, total, unidade, tema, campo]) => (
          <CartaoMetrica
            key={titulo}
            titulo={titulo}
            total={total}
            unidade={unidade}
            tema={tema}
            dados={dados(campo)}
            destaque={destaque}
            onSelecionar={alternar}
          />
        ))}
      </div>
    </div>
  );
}

function TelaPainel({ voos, aeronaves, onEditar, onApagar }) {
  const filtro = useFiltro();
  const lista = useMemo(() => filtrarVoos(voos, filtro.aplicado), [voos, filtro.aplicado]);
  return (
    <div className="space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Filter size={14} /> Filtros operacionais — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={filtro.rascunho} setF={filtro.setRascunho} aeronaves={aeronaves} />
        </div>
        <BotoesFiltro filtro={filtro} />
      </div>
      <div className={`${C.painel} flex items-center justify-between px-5 py-4`}>
        <h3 className="text-xs font-bold uppercase text-white">Painel de registo de voos — Posto CAN BR</h3>
        <span className="font-mono text-[11px] uppercase text-slate-400">{lista.length} registos</span>
      </div>
      {lista.length === 0 ? (
        <p className="py-10 text-center text-xs uppercase text-slate-500">Nenhum voo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {lista.map((v) => (
            <CartaoVoo key={v.id} v={v} onEditar={onEditar} onApagar={onApagar} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormVoo({ aeronaves, voo, onSalvar, onCancelar, avisar }) {
  const [f, setF] = useState(() =>
    voo
      ? {
          aeronave: voo.aeronave,
          matricula: voo.matricula || '',
          rota: voo.rota || '',
          data_voo: voo.data_voo,
          hora_chamada: voo.hora_chamada || '',
          hora_decolagem: voo.hora_decolagem || '',
          hora_real: voo.hora_real || '',
          pax: String(voo.pax ?? ''),
          peso_pax: String(voo.peso_pax ?? ''),
          peso_bagagem: String(voo.peso_bagagem ?? ''),
          qtd_bagagens: String(voo.qtd_bagagens ?? '')
        }
      : {
          aeronave: '', matricula: '', rota: '', data_voo: hoje(),
          hora_chamada: '', hora_decolagem: '', hora_real: '',
          pax: '', peso_pax: '', peso_bagagem: '', qtd_bagagens: ''
        }
  );
  const [prev, setPrev] = useState('');
  const [real, setReal] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setHora = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(/[^\d:]/g, '').slice(0, 5) }));
  const fecharHora = (k) => () => setF((s) => ({ ...s, [k]: normHora(s[k]) }));

  const totalPeso = (Number(f.peso_pax) || 0) + (Number(f.peso_bagagem) || 0);
  const temListas = Boolean(prev.trim() || real.trim());
  const cruz = useMemo(
    () =>
      temListas
        ? cruzar(prev, real)
        : {
            total_previsto: voo?.total_previsto || 0,
            embarcados: voo?.embarcados || 0,
            faltas: voo?.faltas || 0,
            extras: voo?.extras || 0
          },
    [prev, real, voo, temListas]
  );
  const pctFaltas = cruz.total_previsto ? ((cruz.faltas / cruz.total_previsto) * 100).toFixed(1) : '0.0';

  const enviar = async (e) => {
    e.preventDefault();
    const aeronave = f.aeronave || aeronaves[0]?.modelo;
    if (!aeronave) return avisar('Cadastre uma aeronave antes de adicionar voos.', 'erro');
    setSalvando(true);
    await onSalvar(
      {
        aeronave,
        matricula: f.matricula.trim().toUpperCase(),
        rota: f.rota.trim().toUpperCase(),
        data_voo: f.data_voo,
        hora_chamada: normHora(f.hora_chamada),
        hora_decolagem: normHora(f.hora_decolagem),
        hora_real: normHora(f.hora_real),
        pax: Number(f.pax) || 0,
        peso_pax: Number(f.peso_pax) || 0,
        peso_bagagem: Number(f.peso_bagagem) || 0,
        total_peso: totalPeso,
        qtd_bagagens: Number(f.qtd_bagagens) || 0,
        ...cruz
      },
      voo?.id
    );
    setSalvando(false);
  };

  const num = (k) => ({ type: 'number', min: '0', inputMode: 'numeric', className: C.input, value: f[k], onChange: set(k), placeholder: '0' });
  const hora = (k, ph) => ({ className: C.input, value: f[k], onChange: setHora(k), onBlur: fecharHora(k), placeholder: ph, inputMode: 'numeric' });

  return (
    <form onSubmit={enviar} className={`${C.painel} mx-auto max-w-4xl space-y-6 p-6`}>
      <div className="flex items-center justify-between">
        <div className={C.titulo}>
          <PlusCircle size={15} /> {voo ? 'Editar voo' : 'Adicionar voo'} — Posto CAN BR
        </div>
        {voo && (
          <button type="button" onClick={onCancelar} className="text-[11px] font-bold uppercase text-rose-400 underline">
            Cancelar edição
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo rotulo="Tipo de aeronave FAB">
          <select className={C.input} value={f.aeronave || aeronaves[0]?.modelo || ''} onChange={set('aeronave')}>
            {aeronaves.map((a) => (
              <option key={a.id} value={a.modelo}>{a.modelo}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Matrícula (não obrigatória)">
          <input className={C.input} value={f.matricula} onChange={set('matricula')} placeholder="EX: FAB 2310" />
        </Campo>
        <Campo rotulo="Rota (ex: SBBR-SBGR-SBGL)">
          <input className={C.input} value={f.rota} onChange={set('rota')} placeholder="SBBR-SBGR-SBGL" />
        </Campo>

        <Campo rotulo="Data do voo">
          <input type="date" required className={C.input} value={f.data_voo} onChange={set('data_voo')} />
        </Campo>
        <Campo rotulo="Hora de chamada">
          <input {...hora('hora_chamada', '1330')} />
        </Campo>
        <Campo rotulo="Hora de decolagem (prevista)">
          <input {...hora('hora_decolagem', '1530')} />
        </Campo>

        <Campo rotulo="Hora real (atendimento)">
          <input {...hora('hora_real', '1430')} />
        </Campo>
        <Campo rotulo="Total de passageiros (PAX)"><input {...num('pax')} /></Campo>
        <Campo rotulo="Peso de PAX (kg)"><input {...num('peso_pax')} /></Campo>

        <Campo rotulo="Peso de bagagem (kg)"><input {...num('peso_bagagem')} /></Campo>
        <Campo rotulo="Total de peso (auto)">
          <div className={`${C.input} font-bold text-sky-400`}>{totalPeso} KG</div>
        </Campo>
        <Campo rotulo="Quantidade de bagagens"><input {...num('qtd_bagagens')} /></Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-sky-400">
            <FileText size={13} /> 1. Copiar & colar relação principal
          </div>
          <p className="mb-2 text-[10px] text-slate-500">Patentes (2S, SGT, CEL) são ignoradas no cruzamento de nomes</p>
          <textarea rows="5" className={C.input} value={prev} onChange={(e) => setPrev(e.target.value)} placeholder={'2S JOAO DA SILVA\nSGT MARIA OLIVEIRA\nCEL CARLOS SOUZA'} />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-400">
            <Users size={13} /> 2. Copiar & colar efetivamente embarcados
          </div>
          <p className="mb-2 text-[10px] text-slate-500">O nome limpo coincidirá mesmo se omitir a patente nesta lista</p>
          <textarea rows="5" className={C.input} value={real} onChange={(e) => setReal(e.target.value)} placeholder={'JOAO DA SILVA\nMARIA OLIVEIRA\nNOVO PASSAGEIRO'} />
        </div>
      </div>

      <div className={`${C.caixa} grid grid-cols-2 gap-4 p-4 text-center sm:grid-cols-5`}>
        {[
          ['Total previsto', cruz.total_previsto, 'text-white'],
          ['Embarcados', cruz.embarcados, 'text-sky-400'],
          ['Faltas', cruz.faltas, 'text-amber-400'],
          ['Extras (+)', cruz.extras, 'text-emerald-400'],
          ['% Faltas', `${pctFaltas}%`, 'text-rose-400']
        ].map(([r, v, cor]) => (
          <div key={r}>
            <div className="text-[10px] uppercase text-slate-500">{r}</div>
            <div className={`font-mono text-lg font-bold ${cor}`}>{v}</div>
          </div>
        ))}
      </div>
      {voo && !temListas && (
        <p className="text-[10px] text-slate-500">Os números acima são os já guardados. Cole as listas novamente apenas se quiser recalcular.</p>
      )}

      <button type="submit" disabled={salvando} className={`${C.botao} w-full py-4`}>
        {salvando ? 'A guardar…' : voo ? 'Salvar alterações do voo' : 'Salvar voo e gerar relatório do Posto CAN BR'}
      </button>
    </form>
  );
}

const NOVO_DESEMB = () => ({ aeronave: '', matricula: '', rota: '', data_voo: hoje(), desembarcados: '' });

function TelaDesembarque({ desembarques, aeronaves, onSalvar, onApagar, avisar }) {
  const filtro = useFiltro();
  const [f, setF] = useState(NOVO_DESEMB);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef(null);

  const lista = useMemo(() => filtrarVoos(desembarques, filtro.aplicado), [desembarques, filtro.aplicado]);
  const total = somar(lista, 'desembarcados');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const editar = (d) => {
    setEditando(d);
    setF({
      aeronave: d.aeronave,
      matricula: d.matricula || '',
      rota: d.rota || '',
      data_voo: d.data_voo,
      desembarcados: String(d.desembarcados ?? '')
    });
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const cancelar = () => {
    setEditando(null);
    setF(NOVO_DESEMB());
  };

  const enviar = async (e) => {
    e.preventDefault();
    const aeronave = f.aeronave || aeronaves[0]?.modelo;
    if (!aeronave) return avisar('Cadastre uma aeronave antes de incluir voos.', 'erro');
    const qtd = Number(f.desembarcados);
    if (f.desembarcados === '' || !Number.isFinite(qtd) || qtd < 0) {
      return avisar('Informe a quantidade de desembarcados.', 'erro');
    }
    setSalvando(true);
    const ok = await onSalvar(
      {
        aeronave,
        matricula: f.matricula.trim().toUpperCase(),
        rota: f.rota.trim().toUpperCase(),
        data_voo: f.data_voo,
        desembarcados: Math.floor(qtd)
      },
      editando?.id
    );
    setSalvando(false);
    if (ok) cancelar();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <form ref={formRef} onSubmit={enviar} className={`${C.painel} space-y-4 p-5`}>
        <div className="flex items-center justify-between">
          <div className={C.titulo}>
            <UserCheck size={15} /> {editando ? 'Editar voo de desembarque' : 'Incluir voo de desembarque'}
          </div>
          {editando && (
            <button type="button" onClick={cancelar} className="text-[11px] font-bold uppercase text-rose-400 underline">
              Cancelar edição
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          Registe o voo e informe quantos passageiros desembarcaram nele. Este registo é independente dos voos adicionados
          no Painel de Voos.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo rotulo="Tipo de aeronave FAB">
            <select className={C.input} value={f.aeronave || aeronaves[0]?.modelo || ''} onChange={set('aeronave')}>
              {aeronaves.map((a) => (
                <option key={a.id} value={a.modelo}>{a.modelo}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Data do voo">
            <input type="date" required className={C.input} value={f.data_voo} onChange={set('data_voo')} />
          </Campo>
          <Campo rotulo="Matrícula (opcional)">
            <input className={C.input} value={f.matricula} onChange={set('matricula')} placeholder="EX: FAB 2310" />
          </Campo>
          <Campo rotulo="Rota / origem (opcional)">
            <input className={C.input} value={f.rota} onChange={set('rota')} placeholder="SBGR-SBBR" />
          </Campo>
          <Campo rotulo="Qtd desembarcados">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              required
              className={C.input}
              value={f.desembarcados}
              onChange={set('desembarcados')}
              placeholder="0"
            />
          </Campo>
        </div>
        <button type="submit" disabled={salvando} className={`${C.botao} w-full py-4`}>
          {salvando ? 'A guardar…' : editando ? 'Salvar alterações do desembarque' : 'Incluir voo de desembarque'}
        </button>
      </form>

      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Filter size={14} /> Filtros de desembarque
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={filtro.rascunho} setF={filtro.setRascunho} aeronaves={aeronaves} />
        </div>
        <BotoesFiltro filtro={filtro} />
      </div>

      <div className={`${C.painel} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
        <h3 className="text-xs font-bold uppercase text-white">Voos de desembarque registados</h3>
        <div className="flex items-center gap-4 font-mono text-[11px] uppercase text-slate-400">
          <span>{lista.length} voos</span>
          <span className="text-sky-300">
            Total desembarcados: <b className="text-white">{total}</b>
          </span>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-xs uppercase text-slate-500">Nenhum desembarque encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lista.map((d) => (
            <div key={d.id} className={`${C.painel} space-y-3 p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold uppercase text-sky-400">{d.aeronave}</h3>
                  <p className="mt-1 text-[11px] uppercase text-slate-400">
                    Matrícula: <b className="font-mono text-white">{d.matricula || 'N/D'}</b>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-slate-800/80 px-2 py-1 font-mono text-[11px] font-bold text-sky-300">
                    {d.rota || '—'}
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{d.data_voo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Caixa rotulo="Desembarcados" valor={d.desembarcados} destaque />
                <Caixa rotulo="Dia" valor={diaSemana(d.data_voo)} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                <span className="rounded-lg border border-slate-800 bg-[#050a16] px-2.5 py-1.5 text-[10px] uppercase text-slate-400">
                  Última alt. por: <b className="font-mono text-white">{d.ultima_alt_por || '—'}</b>{' '}
                  <span className="font-mono text-sky-300">({fmtTs(d.ultima_alt_em)})</span>
                </span>
                <div className="flex items-center gap-4 text-[11px] font-bold uppercase">
                  <button onClick={() => editar(d)} className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => onApagar(d)} className="flex items-center gap-1 text-rose-400 hover:text-rose-300">
                    <Trash2 size={13} /> Apagar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TelaAeronaves({ aeronaves, onAdicionar, onRemover }) {
  const [modelo, setModelo] = useState('');
  const enviar = async (e) => {
    e.preventDefault();
    if (!modelo.trim()) return;
    const ok = await onAdicionar(modelo.trim().toUpperCase());
    if (ok) setModelo('');
  };
  return (
    <div className={`${C.painel} mx-auto max-w-xl space-y-5 p-6`}>
      <div className={C.titulo}>
        <Plane size={15} /> Registar e gerir aeronaves FAB
      </div>
      <form onSubmit={enviar} className="space-y-4">
        <Campo rotulo="Modelo da aeronave">
          <input className={C.input} value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="EX: C-130 HÉRCULES" required />
        </Campo>
        <button type="submit" className={`${C.botao} w-full`}>Adicionar aeronave</button>
      </form>
      <div className="space-y-2 border-t border-slate-800 pt-5">
        <h3 className="text-xs font-bold uppercase text-white">Aeronaves registradas:</h3>
        {aeronaves.map((a) => (
          <div key={a.id} className={`${C.caixa} flex items-center justify-between px-3 py-3`}>
            <span className="font-mono text-xs font-bold uppercase text-sky-300">{a.modelo}</span>
            <div className="flex items-center gap-3">
              <ShieldCheck size={15} className="text-emerald-400" />
              <button onClick={() => onRemover(a)} className="text-rose-400 hover:text-rose-300" title="Remover">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelaRelatorio({ voos, desembarques, aeronaves }) {
  const filtro = useFiltro();
  const lista = useMemo(() => filtrarVoos(voos, filtro.aplicado), [voos, filtro.aplicado]);
  const listaDesemb = useMemo(() => filtrarVoos(desembarques, filtro.aplicado), [desembarques, filtro.aplicado]);

  const relatorio = (
    <div className="rounded-2xl bg-white p-8 text-slate-900 print:rounded-none print:p-0">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold uppercase">Comando da Aeronáutica</h2>
          <p className="text-sm font-bold uppercase">Base Aérea de Brasília — Posto CAN BR</p>
          <p className="text-xs uppercase text-slate-500">Relatório operacional de voos</p>
        </div>
        <div className="text-right font-mono text-[11px] uppercase text-slate-500">
          <div>Emitido em: {fmtData(hoje())}</div>
          <div>Voos: {lista.length}</div>
          <div>Voos de desembarque: {listaDesemb.length}</div>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="bg-[#0c1424] text-[10px] uppercase text-white">
              {['Data / Dia', 'Aeronave / Matr.', 'Rota', 'Pax', 'Peso total', 'Efetividade'].map((h) => (
                <th key={h} className="px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.id} className="border-b border-slate-200">
                <td className="px-3 py-3 font-mono">
                  {v.data_voo}
                  <div className="text-[9px] uppercase text-slate-500">{diaSemana(v.data_voo)}</div>
                </td>
                <td className="px-3 py-3 font-bold uppercase">
                  {v.aeronave}{v.matricula ? ` (${v.matricula})` : ''}
                </td>
                <td className="px-3 py-3 font-mono">{v.rota}</td>
                <td className="px-3 py-3 font-mono font-bold">{v.pax}</td>
                <td className="px-3 py-3 font-mono font-bold">{v.total_peso} KG</td>
                <td className="px-3 py-3 font-mono font-bold text-emerald-700">
                  {fmtEf(calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real))}
                </td>
              </tr>
            ))}
            {lista.length > 0 && (
              <tr className="bg-slate-100 font-bold">
                <td className="px-3 py-3 uppercase" colSpan="3">Total</td>
                <td className="px-3 py-3 font-mono">{somar(lista, 'pax')}</td>
                <td className="px-3 py-3 font-mono">{somar(lista, 'total_peso')} KG</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {listaDesemb.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="mb-2 text-xs font-extrabold uppercase">Desembarques registados</h3>
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="bg-[#0c1424] text-[10px] uppercase text-white">
                {['Data / Dia', 'Aeronave / Matr.', 'Rota', 'Desembarcados'].map((h) => (
                  <th key={h} className="px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaDesemb.map((d) => (
                <tr key={d.id} className="border-b border-slate-200">
                  <td className="px-3 py-3 font-mono">
                    {d.data_voo}
                    <div className="text-[9px] uppercase text-slate-500">{diaSemana(d.data_voo)}</div>
                  </td>
                  <td className="px-3 py-3 font-bold uppercase">
                    {d.aeronave}{d.matricula ? ` (${d.matricula})` : ''}
                  </td>
                  <td className="px-3 py-3 font-mono">{d.rota}</td>
                  <td className="px-3 py-3 font-mono font-bold">{d.desembarcados}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="px-3 py-3 uppercase" colSpan="3">Total desembarcados</td>
                <td className="px-3 py-3 font-mono">{somar(listaDesemb, 'desembarcados')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-16 flex items-end justify-between border-t border-slate-300 pt-4 text-[11px] uppercase">
        <div>
          <div className="mb-1 w-64 border-b border-slate-900" />
          <b>Chefe do Posto CAN BR (SBBR)</b>
        </div>
        <span className="text-slate-500">Sistema FlightOps BSB — Controlo operacional</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className={C.titulo}>
            <Printer size={15} /> Gerador e impressão de relatório — Posto CAN BR
          </div>
          <button onClick={() => window.print()} className={`${C.botao} flex items-center gap-2`}>
            <Printer size={14} /> Imprimir / Exportar PDF
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CamposFiltro
            f={filtro.rascunho}
            setF={filtro.setRascunho}
            aeronaves={aeronaves}
            comMes={false}
            rotulos={{ inicial: 'Data inicial (período)', final: 'Data final (período)', data: 'Data específica (dia comum)' }}
          />
        </div>
        <BotoesFiltro filtro={filtro} />
      </div>
      {relatorio}
      {createPortal(<div className="print-only">{relatorio}</div>, document.body)}
    </div>
  );
}

function TelaUsuarios({ usuario, usuarios, onSenha, onCriar, onRemover }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('operador');

  const trocar = async () => {
    if (await onSenha(novaSenha)) setNovaSenha('');
  };
  const criar = async (e) => {
    e.preventDefault();
    if (await onCriar(nome, senha, perfil)) {
      setNome('');
      setSenha('');
      setPerfil('operador');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className={`${C.painel} space-y-4 p-6`}>
        <div className={C.titulo}>
          <KeyRound size={15} /> Segurança e senha do administrador {usuario.nome}
        </div>
        <Campo rotulo={`Nova senha para o administrador ${usuario.nome}`}>
          <input type="password" className={C.input} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="DIGITE A NOVA SENHA" />
        </Campo>
        <button onClick={trocar} className={`${C.botao} w-full`}>Atualizar senha do administrador</button>
      </div>

      <form onSubmit={criar} className={`${C.painel} space-y-4 p-6`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
          <UserPlus size={15} /> Cadastrar novo utilizador / operador
        </div>
        <Campo rotulo="Nome do utilizador">
          <input className={C.input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="EX: 2S OLIVEIRA" required />
        </Campo>
        <Campo rotulo="Senha de acesso">
          <input type="password" className={C.input} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="MÍNIMO 6 CARACTERES" required />
        </Campo>
        <Campo rotulo="Perfil (operador ou administrador)">
          <select className={C.input} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="operador">OPERADOR</option>
            <option value="admin">ADMINISTRADOR</option>
          </select>
        </Campo>
        <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase text-white hover:bg-emerald-500">
          Cadastrar utilizador
        </button>
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold uppercase text-white">Utilizadores cadastrados:</h3>
          {usuarios.map((u) => (
            <div key={u.id} className={`${C.caixa} flex items-center justify-between px-3 py-3`}>
              <span className="font-mono text-xs font-bold uppercase text-sky-300">{u.nome}</span>
              <div className="flex items-center gap-3">
                <span className="rounded border border-sky-800 bg-sky-950/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-sky-300">
                  {u.perfil === 'admin' ? 'Admin' : 'Operador'}
                </span>
                {u.id !== usuario.id && (
                  <button type="button" onClick={() => onRemover(u)} className="text-rose-400 hover:text-rose-300" title="Remover">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}

function TelaLixeira({ voos, onRestaurar, onExcluirDef }) {
  return (
    <div className="space-y-6">
      <div className={`${C.painel} flex items-center justify-between px-5 py-4`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-rose-400">
          <Trash2 size={15} /> Lixeira — voos excluídos
        </div>
        <span className="font-mono text-[11px] uppercase text-slate-400">{voos.length} registos</span>
      </div>
      {voos.length === 0 ? (
        <p className="py-10 text-center text-xs uppercase text-slate-500">A lixeira está vazia.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {voos.map((v) => (
            <div key={v.id} className={`${C.painel} space-y-4 p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase text-sky-400">{v.aeronave}</h3>
                  <p className="mt-1 text-[11px] uppercase text-slate-400">
                    Matrícula: <b className="font-mono text-white">{v.matricula || 'N/D'}</b>
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-md bg-slate-800/80 px-2 py-1 font-mono text-[11px] font-bold text-sky-300">{v.rota || '—'}</span>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{v.data_voo}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Caixa rotulo="Pax" valor={v.pax} />
                <Caixa rotulo="Bagagem" valor={`${v.peso_bagagem} KG`} />
                <Caixa rotulo="Total" valor={`${v.total_peso} KG`} destaque />
              </div>
              <div className="rounded-lg border border-rose-900/60 bg-rose-950/20 px-3 py-2 text-[11px] uppercase text-rose-300">
                Excluído por <b className="font-mono text-white">{v.excluido_por || '—'}</b>{' '}
                <span className="font-mono">({fmtTs(v.excluido_em)})</span>
              </div>
              <div className="flex items-center justify-end gap-5 border-t border-slate-800 pt-3 text-[11px] font-bold uppercase">
                <button onClick={() => onRestaurar(v)} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                  <RotateCcw size={13} /> Restaurar
                </button>
                <button onClick={() => onExcluirDef(v)} className="flex items-center gap-1 text-rose-400 hover:text-rose-300">
                  <Trash2 size={13} /> Excluir definitivamente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   APLICATIVO PRINCIPAL
   ================================================================ */
const MENU = [
  { id: 'dashboard', rotulo: 'Dashboard', Icone: BarChart3 },
  { id: 'voos', rotulo: 'Painel de Voos', Icone: Database },
  { id: 'adicionar', rotulo: 'Adicionar Voo', Icone: PlusCircle },
  { id: 'desembarque', rotulo: 'Desembarque', Icone: UserCheck },
  { id: 'aeronaves', rotulo: 'Adicionar Aeronave', Icone: Plane },
  { id: 'relatorio', rotulo: 'Imprimir Relatório', Icone: Printer },
  { id: 'usuarios', rotulo: 'Utilizadores', Icone: Users, admin: true },
  { id: 'lixeira', rotulo: 'Lixeira', Icone: Trash2, admin: true }
];

export default function App() {
  const [usuario, setUsuario] = useState(() => lerLocal('flightops_sessao', null));
  const [aba, setAba] = useState('dashboard');
  const [menuAberto, setMenuAberto] = useState(() => window.innerWidth >= 1024);
  const [voos, setVoos] = useState([]);
  const [desembarques, setDesembarques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(false);
  const [vooEditando, setVooEditando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const timerAviso = useRef(null);
  const bootstrapFeito = useRef(false);

  const avisar = useCallback((texto, tipo = 'ok') => {
    setAviso({ texto, tipo });
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 4000);
  }, []);

  /* ---------- carregar dados + sincronização em tempo real ---------- */
  const carregarTudo = useCallback(async () => {
    if (!supabase) return;
    try {
      const [v, d, a, u] = await Promise.all([
        supabase.from('voos').select('*').order('data_voo', { ascending: false }).order('criado_em', { ascending: false }),
        supabase.from('desembarques').select('*').order('data_voo', { ascending: false }).order('criado_em', { ascending: false }),
        supabase.from('aeronaves').select('*').order('modelo'),
        supabase.from('usuarios').select('id,nome,perfil,criado_em').order('nome')
      ]);
      if (v.error || d.error || a.error || u.error) {
        setOnline(false);
        return;
      }
      setVoos(v.data);
      setDesembarques(d.data);
      setAeronaves(a.data);
      setUsuarios(u.data);
      setOnline(true);
      setCarregando(false);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    carregarTudo();
    const canal = supabase
      .channel('flightops-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voos' }, carregarTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desembarques' }, carregarTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aeronaves' }, carregarTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, carregarTudo)
      .subscribe();
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') carregarTudo();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('online', carregarTudo);
    const timer = setInterval(carregarTudo, 30000); // rede de segurança
    return () => {
      supabase.removeChannel(canal);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('online', carregarTudo);
      clearInterval(timer);
    };
  }, [carregarTudo]);

  /* ---------- cria o administrador CAIO no primeiro uso ---------- */
  useEffect(() => {
    if (!supabase || carregando || usuarios.length > 0 || bootstrapFeito.current) return;
    bootstrapFeito.current = true;
    (async () => {
      const senha_hash = await hashSenha('CAIO', 'admin123');
      await supabase.from('usuarios').insert({ nome: 'CAIO', senha_hash, perfil: 'admin' });
      carregarTudo();
    })();
  }, [carregando, usuarios.length, carregarTudo]);

  const sair = useCallback(() => {
    setUsuario(null);
    gravarLocal('flightops_sessao', null);
    setAba('dashboard');
  }, []);

  // Se o utilizador logado foi removido, encerra a sessão
  useEffect(() => {
    if (usuario && !carregando && usuarios.length > 0 && !usuarios.some((u) => u.id === usuario.id)) sair();
  }, [usuario, usuarios, carregando, sair]);

  const ativos = useMemo(() => voos.filter((v) => !v.excluido), [voos]);
  const lixeira = useMemo(() => voos.filter((v) => v.excluido), [voos]);
  const ehAdmin = usuario?.perfil === 'admin';

  /* ---------- ações ---------- */
  const gravar = async (consulta, msgOk) => {
    const { error } = await consulta;
    if (error) {
      avisar(error.code === '23505' ? 'Já existe um registo com esse nome.' : `Erro: ${error.message}`, 'erro');
      return false;
    }
    if (msgOk) avisar(msgOk);
    await carregarTudo();
    return true;
  };
  const carimbo = () => ({ ultima_alt_por: usuario.nome, ultima_alt_em: new Date().toISOString() });

  const entrar = async (nome, senha) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,perfil,senha_hash')
      .eq('nome', nome.trim().toUpperCase())
      .maybeSingle();
    if (error) return 'Falha de ligação ao servidor. Tente novamente.';
    if (!data) return 'Utilizador ou senha inválidos.';
    if ((await hashSenha(nome, senha)) !== data.senha_hash) return 'Utilizador ou senha inválidos.';
    const sessao = { id: data.id, nome: data.nome, perfil: data.perfil };
    setUsuario(sessao);
    gravarLocal('flightops_sessao', sessao);
    return null;
  };

  const salvarVoo = async (dados, id) => {
    const payload = { ...dados, ...carimbo() };
    const ok = await gravar(
      id ? supabase.from('voos').update(payload).eq('id', id) : supabase.from('voos').insert(payload),
      id ? 'Voo atualizado.' : 'Voo guardado.'
    );
    if (ok) {
      setVooEditando(null);
      setAba('voos');
    }
  };

  const pedirExclusao = (v) =>
    setConfirmacao({
      titulo: 'Excluir voo?',
      texto: `Deseja realmente excluir o voo ${v.aeronave} de ${fmtData(v.data_voo)}? Ele será movido para a Lixeira e poderá ser restaurado por um administrador.`,
      botao: 'Sim, excluir',
      aoConfirmar: () =>
        gravar(
          supabase.from('voos').update({ excluido: true, excluido_em: new Date().toISOString(), excluido_por: usuario.nome }).eq('id', v.id),
          'Voo movido para a Lixeira.'
        )
    });

  const restaurarVoo = (v) =>
    gravar(
      supabase.from('voos').update({ excluido: false, excluido_em: null, excluido_por: null, ...carimbo() }).eq('id', v.id),
      'Voo restaurado.'
    );

  const pedirExclusaoDefinitiva = (v) =>
    setConfirmacao({
      titulo: 'Excluir definitivamente?',
      texto: `O voo ${v.aeronave} de ${fmtData(v.data_voo)} será apagado para sempre. Esta ação não pode ser desfeita.`,
      botao: 'Excluir definitivamente',
      aoConfirmar: () => gravar(supabase.from('voos').delete().eq('id', v.id), 'Voo excluído definitivamente.')
    });

  const salvarDesemb = (dados, id) => {
    const payload = { ...dados, ...carimbo() };
    return gravar(
      id ? supabase.from('desembarques').update(payload).eq('id', id) : supabase.from('desembarques').insert(payload),
      id ? 'Desembarque atualizado.' : 'Voo de desembarque incluído.'
    );
  };

  const pedirExclusaoDesemb = (d) =>
    setConfirmacao({
      titulo: 'Excluir desembarque?',
      texto: `Excluir o registo de ${d.desembarcados} desembarcados do voo ${d.aeronave} de ${fmtData(d.data_voo)}? Esta ação não pode ser desfeita.`,
      botao: 'Sim, excluir',
      aoConfirmar: () => gravar(supabase.from('desembarques').delete().eq('id', d.id), 'Registo excluído.')
    });

  const adicionarAeronave = (modelo) => gravar(supabase.from('aeronaves').insert({ modelo }), 'Aeronave adicionada.');
  const pedirRemoverAeronave = (a) =>
    setConfirmacao({
      titulo: 'Remover aeronave?',
      texto: `Remover ${a.modelo} da lista? Os voos já registados com este modelo não são alterados.`,
      botao: 'Sim, remover',
      aoConfirmar: () => gravar(supabase.from('aeronaves').delete().eq('id', a.id), 'Aeronave removida.')
    });

  const trocarSenha = async (nova) => {
    if (nova.length < 6) {
      avisar('A senha deve ter no mínimo 6 caracteres.', 'erro');
      return false;
    }
    const senha_hash = await hashSenha(usuario.nome, nova);
    return gravar(supabase.from('usuarios').update({ senha_hash }).eq('id', usuario.id), 'Senha atualizada.');
  };
  const criarUsuario = async (nome, senha, perfil) => {
    if (senha.length < 6) {
      avisar('A senha deve ter no mínimo 6 caracteres.', 'erro');
      return false;
    }
    const senha_hash = await hashSenha(nome, senha);
    return gravar(
      supabase.from('usuarios').insert({ nome: nome.trim().toUpperCase(), senha_hash, perfil }),
      'Utilizador cadastrado.'
    );
  };
  const pedirRemoverUsuario = (u) =>
    setConfirmacao({
      titulo: 'Remover utilizador?',
      texto: `${u.nome} deixará de conseguir entrar no sistema.`,
      botao: 'Sim, remover',
      aoConfirmar: () => gravar(supabase.from('usuarios').delete().eq('id', u.id), 'Utilizador removido.')
    });

  const ir = (id) => {
    if (id === 'adicionar') setVooEditando(null);
    setAba(id);
    if (window.innerWidth < 1024) setMenuAberto(false);
  };
  const editar = (v) => {
    setVooEditando(v);
    setAba('adicionar');
  };

  /* ---------- renderização ---------- */
  if (!supabaseConfigurado) return <TelaConfig />;
  if (!usuario) return <TelaLogin onEntrar={entrar} online={online} />;

  const abaAtual = MENU.find((m) => m.id === aba && (!m.admin || ehAdmin)) ? aba : 'dashboard';

  return (
    <>
      <FundoAeronaves />
      <div id="app-shell" className="relative z-10 flex h-screen flex-col font-sans text-slate-200">
        <style>{`
          .print-only{display:none}
          @media print{
            @page{margin:12mm}
            #root{display:none!important}
            body{background:#fff!important}
            .print-only{display:block!important;color:#000}
            .print-only *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
          }
        `}</style>

        {/* CABEÇALHO */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-[#0a1120] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAberto((m) => !m)}
              className="rounded-xl border border-slate-700 p-2 text-slate-200 hover:bg-slate-800"
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
            <div className="rounded-xl bg-sky-600 p-2 text-white shadow-lg shadow-sky-600/30">
              <Plane size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold uppercase leading-tight tracking-wide text-white">
                FlightOps <span className="text-sky-400">BSB</span>
              </h1>
              <p className="hidden text-[10px] uppercase text-slate-400 sm:block">Posto CAN BR — Base Aérea de Brasília (SBBR)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase sm:flex ${
                online ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' : 'border-amber-800 bg-amber-950/40 text-amber-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'}`} />
              {online ? 'Posto CAN BR operacional' : 'Sem ligação — a tentar…'}
            </span>
            <button
              onClick={sair}
              className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-sky-300 hover:bg-slate-800"
              title="Sair"
            >
              {usuario.nome} ({usuario.perfil === 'admin' ? 'Admin' : 'Operador'}) <LogOut size={14} className="text-rose-400" />
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {menuAberto && <div className="absolute inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setMenuAberto(false)} />}

          {/* MENU LATERAL */}
          {menuAberto && (
            <aside className="absolute left-0 top-0 z-30 flex h-full w-60 shrink-0 flex-col justify-between border-r border-slate-800 bg-[#0a1120] p-3 lg:static">
              <nav className="space-y-1">
                {MENU.filter((m) => !m.admin || ehAdmin).map(({ id, rotulo, Icone }) => (
                  <button
                    key={id}
                    onClick={() => ir(id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                      abaAtual === id ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icone size={16} />
                    <span className="flex-1">{rotulo}</span>
                    {id === 'lixeira' && lixeira.length > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">{lixeira.length}</span>
                    )}
                  </button>
                ))}
              </nav>
              <button
                onClick={() => setMenuAberto(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-800/70 py-2.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft size={14} /> Ocultar Menu
              </button>
            </aside>
          )}

          {/* CONTEÚDO */}
          <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-8">
            {carregando ? (
              <p className="py-20 text-center text-xs uppercase text-slate-500">A carregar dados…</p>
            ) : (
              <>
                {abaAtual === 'dashboard' && <TelaDashboard voos={ativos} desembarques={desembarques} aeronaves={aeronaves} />}
                {abaAtual === 'voos' && <TelaPainel voos={ativos} aeronaves={aeronaves} onEditar={editar} onApagar={pedirExclusao} />}
                {abaAtual === 'adicionar' && (
                  <FormVoo
                    key={vooEditando?.id || 'novo'}
                    aeronaves={aeronaves}
                    voo={vooEditando}
                    onSalvar={salvarVoo}
                    onCancelar={() => {
                      setVooEditando(null);
                      setAba('voos');
                    }}
                    avisar={avisar}
                  />
                )}
                {abaAtual === 'desembarque' && (
                  <TelaDesembarque
                    desembarques={desembarques}
                    aeronaves={aeronaves}
                    onSalvar={salvarDesemb}
                    onApagar={pedirExclusaoDesemb}
                    avisar={avisar}
                  />
                )}
                {abaAtual === 'aeronaves' && <TelaAeronaves aeronaves={aeronaves} onAdicionar={adicionarAeronave} onRemover={pedirRemoverAeronave} />}
                {abaAtual === 'relatorio' && <TelaRelatorio voos={ativos} desembarques={desembarques} aeronaves={aeronaves} />}
                {abaAtual === 'usuarios' && (
                  <TelaUsuarios usuario={usuario} usuarios={usuarios} onSenha={trocarSenha} onCriar={criarUsuario} onRemover={pedirRemoverUsuario} />
                )}
                {abaAtual === 'lixeira' && <TelaLixeira voos={lixeira} onRestaurar={restaurarVoo} onExcluirDef={pedirExclusaoDefinitiva} />}
              </>
            )}
          </main>
        </div>

        <Modal
          dados={confirmacao}
          onCancelar={() => setConfirmacao(null)}
          onConfirmar={async () => {
            await confirmacao.aoConfirmar();
            setConfirmacao(null);
          }}
        />

        {aviso && (
          <div
            className={`fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border px-4 py-3 text-xs font-bold shadow-xl ${
              aviso.tipo === 'erro' ? 'border-rose-800 bg-rose-950 text-rose-200' : 'border-emerald-800 bg-emerald-950 text-emerald-200'
            }`}
          >
            {aviso.texto}
          </div>
        )}
      </div>
    </>
  );
}

