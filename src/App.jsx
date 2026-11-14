import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, Database, PlusCircle, UserCheck, Plane, Printer, Users, ChevronLeft,
  Menu, LogOut, Filter, PieChart, Pencil, Trash2, CalendarDays, Zap,
  ShieldCheck, KeyRound, UserPlus, RotateCcw, FileText, AlertTriangle, Eye, EyeOff, Clock
} from 'lucide-react';
import { supabase, supabaseConfigurado } from './supabase.js';

/* Nome exibido no app e crédito de criação (altere aqui se quiser) */
const NOME_APP = 'PCAN-BR';
const CRIADOR = 'CAIO';

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

// Os filtros só passam a valer quando o botão "Gerar filtros" é clicado.
// "Desfazer filtro" volta ao filtro aplicado anteriormente.
function useFiltro() {
  const [rascunho, setRascunho] = useState(FILTRO_VAZIO);
  const [aplicado, setAplicado] = useState(FILTRO_VAZIO);
  const [pilha, setPilha] = useState([]);
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pendente = !igual(rascunho, aplicado);
  const guardar = (f) => setPilha((p) => [...p.slice(-19), f]);

  const gerar = () => {
    if (!igual(rascunho, aplicado)) guardar(aplicado);
    setAplicado(rascunho);
  };
  const limpar = () => {
    if (!igual(aplicado, FILTRO_VAZIO)) guardar(aplicado);
    setRascunho(FILTRO_VAZIO);
    setAplicado(FILTRO_VAZIO);
  };
  const desfazer = () => {
    if (!pilha.length) return;
    const anterior = pilha[pilha.length - 1];
    setPilha((p) => p.slice(0, -1));
    setAplicado(anterior);
    setRascunho(anterior);
  };
  return { rascunho, setRascunho, aplicado, gerar, limpar, desfazer, podeDesfazer: pilha.length > 0, pendente };
}

/* ---------------------------------------------------------------
   ROTA, PENDÊNCIAS E HISTÓRICO DE ALTERAÇÕES
   --------------------------------------------------------------- */
// Coloca o traço automaticamente depois de cada código de 4 letras (ex.: SBBR-SBGL)
const formatarRota = (raw, anterior = '') => {
  const texto = String(raw || '');
  const limpo = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let saida = (limpo.match(/.{1,4}/g) || []).join('-');
  if (limpo.length > 0 && limpo.length % 4 === 0 && texto.length === String(anterior).length + 1) saida += '-';
  return saida;
};
const fecharRota = (v) => String(v || '').replace(/-+$/, '');
// Destinos = todos os códigos da rota, exceto o primeiro (origem)
const destinosDaRota = (rota) => [...new Set(codigosRota(rota).slice(1))];
const vazio = (x) => x === '' || x === null || x === undefined;
const contarNomes = (t) => new Set(String(t || '').split('\n').map(limparNome).filter(Boolean)).size;

// Lista de pendências de um voo (usada no alerta ao salvar e na tira do Painel de Voos)
const pendenciasVoo = (d) => {
  const p = [];
  const faltaHora = [];
  if (!d.hora_chamada) faltaHora.push('chamada');
  if (!d.hora_decolagem) faltaHora.push('decolagem');
  if (!d.hora_real) faltaHora.push('hora real');
  if (faltaHora.length) p.push(`Horários não preenchidos: ${faltaHora.join(', ')}`);
  if (!String(d.rota || '').trim()) p.push('Rota não informada');
  if (vazio(d.pax) || Number(d.pax) === 0) p.push('Total de PAX não informado');
  if (vazio(d.peso_pax)) p.push('Peso de PAX não informado');
  if (vazio(d.peso_bagagem)) p.push('Peso de bagagem não informado');
  if (vazio(d.qtd_bagagens)) p.push('Quantidade de bagagens não informada');
  if (!String(d.lista_prevista || '').trim()) p.push('Faltam nomes na relação principal');
  if (!String(d.lista_real || '').trim()) p.push('Faltam nomes em efetivamente embarcados');
  const dest = destinosDaRota(d.rota);
  if (dest.length > 1) {
    const mapa = d.pax_destinos || {};
    const soma = dest.reduce((s, c) => s + (Number(mapa[c]) || 0), 0);
    const total = Number(d.pax) || 0;
    if (soma !== total) p.push(`PAX por destino (${soma}) diferente do PAX total (${total})`);
  }
  return p;
};

const ROTULOS_CAMPOS = {
  aeronave: 'Aeronave', matricula: 'Matrícula', rota: 'Rota', data_voo: 'Data',
  hora_chamada: 'Chamada', hora_decolagem: 'Decolagem', hora_real: 'Hora real',
  pax: 'PAX', peso_pax: 'Peso PAX', peso_bagagem: 'Peso bagagem', total_peso: 'Peso total',
  qtd_bagagens: 'Qtd bagagens', total_previsto: 'Total previsto', embarcados: 'Embarcados',
  faltas: 'Faltas', extras: 'Extras', desembarcados: 'Desembarcados', excluido: 'Na lixeira',
  lista_prevista: 'Relação principal', lista_real: 'Efetivamente embarcados', pax_destinos: 'PAX por destino'
};
const IGNORAR_CAMPOS = new Set(['id', 'criado_em', 'ultima_alt_por', 'ultima_alt_em', 'excluido_em', 'excluido_por']);
const fmtValor = (campo, v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'SIM' : 'NÃO';
  if (campo === 'pax_destinos') {
    const e = Object.entries(v);
    return e.length ? e.map(([k, x]) => `${k}: ${x}`).join(', ') : '—';
  }
  if (campo === 'data_voo') return fmtData(String(v));
  return String(v);
};
// Compara o registo antes e depois e devolve só o que mudou
const diferencas = (antes, depois) => {
  if (!antes || !depois) return [];
  return Object.keys(depois)
    .filter((k) => !IGNORAR_CAMPOS.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map((k) =>
      k === 'lista_prevista' || k === 'lista_real'
        ? { campo: ROTULOS_CAMPOS[k], texto: 'texto atualizado' }
        : { campo: ROTULOS_CAMPOS[k] || k, de: fmtValor(k, antes[k]), para: fmtValor(k, depois[k]) }
    );
};
const resumoVoo = (v) => `${v.aeronave} · ${fmtData(v.data_voo)}${v.matricula ? ` · ${v.matricula}` : ''}`;
const resumoDesemb = (d) => `${d.aeronave} · ${fmtData(d.data_voo)} · ${d.desembarcados} desemb.`;
const ROTULO_TABELA = { voos: 'voo', desembarques: 'desembarque', aeronaves: 'aeronave', usuarios: 'utilizador' };
const COR_ACAO = {
  incluiu: 'border-emerald-700 text-emerald-400',
  alterou: 'border-sky-700 text-sky-300',
  excluiu: 'border-rose-700 text-rose-400',
  restaurou: 'border-amber-700 text-amber-400'
};

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
        input:not([type="password"]):not([type="date"]):not([type="month"]):not([type="number"]):not(.sem-caixa),
        textarea { text-transform: uppercase; }
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
      <button
        type="button"
        onClick={filtro.desfazer}
        disabled={!filtro.podeDesfazer}
        className={`${C.botaoSec} flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
        title="Volta ao filtro aplicado anteriormente"
      >
        <RotateCcw size={14} /> Desfazer filtro
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
    <div className={`${C.caixa} px-2 py-2.5 text-center`}>
      <div className="text-[11px] uppercase text-slate-400">{rotulo}</div>
      <div className={`font-mono text-sm font-bold ${destaque ? 'text-sky-400' : 'text-white'}`}>{valor}</div>
    </div>
  );
}

function Celula({ rotulo, valor, sub, destaque }) {
  return (
    <div className="min-w-[64px]">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{rotulo}</div>
      <div className={`font-mono text-sm font-bold ${destaque ? 'text-sky-400' : 'text-white'}`}>{valor}</div>
      {sub && <div className="text-[10px] uppercase text-slate-500">{sub}</div>}
    </div>
  );
}

// Voo em forma de tira horizontal
function TiraVoo({ v, onEditar, onApagar }) {
  const ef = calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real);
  const corEf =
    ef === null
      ? 'border-slate-700 text-slate-400'
      : ef >= 100
      ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400'
      : 'border-amber-700 bg-amber-950/40 text-amber-400';
  const pend = pendenciasVoo(v);
  const dest = destinosDaRota(v.rota);
  const subPax = dest.length > 1 ? dest.map((c) => `${c} ${v.pax_destinos?.[c] ?? 0}`).join(' · ') : undefined;

  return (
    <div className={`${C.painel} border-l-4 border-l-sky-500 px-5 py-4`}>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
        <div className="min-w-[170px] flex-1">
          <h3 className="text-base font-bold uppercase text-sky-400">{v.aeronave}</h3>
          <p className="text-xs uppercase text-slate-300">
            Matrícula: <b className="font-mono text-white">{v.matricula || 'N/D'}</b>
          </p>
        </div>
        <Celula rotulo="Data" valor={v.data_voo} sub={diaSemana(v.data_voo)} />
        <div className="min-w-[110px]">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Rota</div>
          <span className="mt-0.5 inline-block rounded-md bg-slate-800/80 px-2 py-1 font-mono text-xs font-bold text-sky-300">
            {v.rota || '—'}
          </span>
        </div>
        <Celula rotulo="Chamada" valor={v.hora_chamada || '--:--'} />
        <Celula rotulo="Decolagem" valor={v.hora_decolagem || '--:--'} />
        <Celula rotulo="Hora real" valor={v.hora_real || '--:--'} />
        <Celula rotulo="Pax" valor={v.pax} sub={subPax} />
        <Celula rotulo="Peso pax" valor={`${v.peso_pax} KG`} />
        <Celula rotulo="Bagagem" valor={`${v.peso_bagagem} KG`} sub={`${v.qtd_bagagens} VOL.`} />
        <Celula rotulo="Total" valor={`${v.total_peso} KG`} destaque />
        <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold uppercase ${corEf}`}>
          <Zap size={13} /> Efetividade: {fmtEf(ef)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <span className="rounded-lg border border-slate-800 bg-[#050a16] px-2.5 py-1.5 text-[11px] uppercase text-slate-400">
            Última alt. por: <b className="font-mono text-white">{v.ultima_alt_por || '—'}</b>{' '}
            <span className="font-mono text-sky-300">({fmtTs(v.ultima_alt_em)})</span>
          </span>
          {pend.length > 0 && (
            <span className="flex items-start gap-1 text-[11px] text-amber-400">
              <AlertTriangle size={13} className="mt-px shrink-0" /> {pend.join(' · ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase">
          <button onClick={() => onEditar(v)} className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={() => onApagar(v)} className="flex items-center gap-1 text-rose-400 hover:text-rose-300">
            <Trash2 size={14} /> Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ dados, onCancelar, onConfirmar }) {
  const [ocupado, setOcupado] = useState(false);
  if (!dados) return null;
  const aviso = dados.tipo === 'aviso';
  const confirmar = async () => {
    setOcupado(true);
    await onConfirmar();
    setOcupado(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`${C.painel} w-full max-w-md space-y-4 p-6`}>
        <div className={`flex items-center gap-3 ${aviso ? 'text-amber-400' : 'text-rose-400'}`}>
          <AlertTriangle size={22} />
          <h3 className="text-sm font-bold uppercase">{dados.titulo}</h3>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{dados.texto}</p>
        {dados.itens && dados.itens.length > 0 && (
          <ul className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-200">
            {dados.itens.map((i) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-700 py-3 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
          >
            {dados.botaoCancelar || 'Cancelar'}
          </button>
          <button
            onClick={confirmar}
            disabled={ocupado}
            className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase text-white disabled:opacity-50 ${
              aviso ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
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

function TelaLogin({ onEntrar, onVerificar, online }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [ver, setVer] = useState(false);
  const [verif, setVerif] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const mudarNome = (e) => {
    setNome(e.target.value);
    setVerif(null);
    setErro('');
  };
  const mudarSenha = (e) => {
    setSenha(e.target.value);
    setVerif(null);
    setErro('');
  };

  const verificar = async () => {
    if (!nome.trim() || !senha) {
      setVerif({ tipo: 'aviso', texto: 'Preencha utilizador e senha para verificar.' });
      return;
    }
    setVerificando(true);
    const r = await onVerificar(nome, senha);
    setVerificando(false);
    if (r === 'ok') setVerif({ tipo: 'ok', texto: 'Senha correta. Pode clicar em Entrar.' });
    else if (r === 'erro') setVerif({ tipo: 'aviso', texto: 'Não foi possível verificar agora. Tente novamente.' });
    else setVerif({ tipo: 'erro', texto: 'Utilizador ou senha incorretos.' });
  };

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

  const corVerif = { ok: 'text-emerald-400', erro: 'text-rose-400', aviso: 'text-amber-400' };

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
                PCAN<span className="text-sky-400">-BR</span>
              </h1>
              <p className="text-[10px] uppercase text-slate-400">Posto CAN BR — Base Aérea de Brasília</p>
            </div>
          </div>
          <Campo rotulo="Utilizador">
            <input className={C.input} value={nome} onChange={mudarNome} placeholder="EX: CAIO" autoCapitalize="characters" required />
          </Campo>
          <Campo rotulo="Senha">
            <div className="relative">
              <input
                type={ver ? 'text' : 'password'}
                className={`${C.input} pr-11 sem-caixa`}
                value={senha}
                onChange={mudarSenha}
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
          <div className="space-y-2">
            <button type="button" onClick={verificar} disabled={verificando} className={`${C.botaoSec} flex w-full items-center justify-center gap-2 disabled:opacity-50`}>
              <ShieldCheck size={14} /> {verificando ? 'A verificar…' : 'Verificar senha'}
            </button>
            {verif && <p className={`text-xs font-bold ${corVerif[verif.tipo]}`}>{verif.texto}</p>}
          </div>
          {erro && <p className="text-xs font-bold text-rose-400">{erro}</p>}
          {!online && <p className="text-xs text-amber-400">A ligar ao servidor… se demorar, verifique a internet.</p>}
          <button type="submit" disabled={ocupado} className={`${C.botao} w-full`}>
            {ocupado ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
        <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] uppercase tracking-wide text-slate-500">
          {NOME_APP} · Criado por <b className="text-sky-300">{CRIADOR}</b>
        </p>
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
        <div className="space-y-3">
          {lista.map((v) => (
            <TiraVoo key={v.id} v={v} onEditar={onEditar} onApagar={onApagar} />
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
  const [prev, setPrev] = useState(voo?.lista_prevista || '');
  const [real, setReal] = useState(voo?.lista_real || '');
  const [paxDest, setPaxDest] = useState(() =>
    Object.fromEntries(Object.entries(voo?.pax_destinos || {}).map(([k, x]) => [k, String(x)]))
  );
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const pendente = useRef(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setHora = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(/[^\d:]/g, '').slice(0, 5) }));
  const fecharHora = (k) => () => setF((s) => ({ ...s, [k]: normHora(s[k]) }));
  const mudarRota = (e) => setF((s) => ({ ...s, rota: formatarRota(e.target.value, s.rota) }));
  const fecharRotaCampo = () => setF((s) => ({ ...s, rota: fecharRota(s.rota) }));

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

  // PAX por destino (só quando a rota tem mais de um destino)
  const destinos = useMemo(() => destinosDaRota(f.rota), [f.rota]);
  const multi = destinos.length > 1;
  const somaDest = destinos.reduce((s, c) => s + (Number(paxDest[c]) || 0), 0);
  const paxTotal = Number(f.pax) || 0;
  const divergente = multi && somaDest !== paxTotal;
  const paxDestinos = multi ? Object.fromEntries(destinos.map((c) => [c, Number(paxDest[c]) || 0])) : {};

  const listaPend = pendenciasVoo({
    rota: f.rota,
    pax: f.pax,
    hora_chamada: normHora(f.hora_chamada),
    hora_decolagem: normHora(f.hora_decolagem),
    hora_real: normHora(f.hora_real),
    peso_pax: f.peso_pax,
    peso_bagagem: f.peso_bagagem,
    qtd_bagagens: f.qtd_bagagens,
    lista_prevista: prev,
    lista_real: real,
    pax_destinos: paxDestinos
  });

  const montarDados = () => ({
    aeronave: f.aeronave || aeronaves[0]?.modelo,
    matricula: f.matricula.trim().toUpperCase(),
    rota: fecharRota(f.rota.trim().toUpperCase()),
    data_voo: f.data_voo,
    hora_chamada: normHora(f.hora_chamada),
    hora_decolagem: normHora(f.hora_decolagem),
    hora_real: normHora(f.hora_real),
    pax: Number(f.pax) || 0,
    peso_pax: Number(f.peso_pax) || 0,
    peso_bagagem: Number(f.peso_bagagem) || 0,
    total_peso: totalPeso,
    qtd_bagagens: Number(f.qtd_bagagens) || 0,
    lista_prevista: prev.toUpperCase(),
    lista_real: real.toUpperCase(),
    pax_destinos: paxDestinos,
    ...cruz
  });

  const salvar = async (dados) => {
    setSalvando(true);
    await onSalvar(dados, voo?.id);
    setSalvando(false);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const dados = montarDados();
    if (!dados.aeronave) return avisar('Cadastre uma aeronave antes de adicionar voos.', 'erro');
    if (listaPend.length > 0) {
      pendente.current = dados;
      setAlerta({
        tipo: 'aviso',
        titulo: 'Voo não está totalmente preenchido',
        texto: 'Foram encontradas as pendências abaixo. Deseja salvar mesmo assim?',
        itens: listaPend,
        botao: 'Salvar mesmo assim',
        botaoCancelar: 'Voltar e corrigir'
      });
      return;
    }
    await salvar(dados);
  };

  const num = (k) => ({ type: 'number', min: '0', inputMode: 'numeric', className: C.input, value: f[k], onChange: set(k), placeholder: '0' });
  const hora = (k, ph) => ({ className: C.input, value: f[k], onChange: setHora(k), onBlur: fecharHora(k), placeholder: ph, inputMode: 'numeric' });

  return (
    <>
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
            <input className={C.input} value={f.rota} onChange={mudarRota} onBlur={fecharRotaCampo} placeholder="SBBR-SBGR-SBGL" />
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

        {multi && (
          <div className={`${C.caixa} space-y-3 p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase text-sky-400">PAX por destino</span>
              <span className={`font-mono text-xs font-bold ${divergente ? 'text-amber-400' : 'text-emerald-400'}`}>
                Soma dos destinos: {somaDest} · PAX total: {paxTotal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {destinos.map((c) => (
                <Campo key={c} rotulo={c}>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className={C.input}
                    value={paxDest[c] ?? ''}
                    onChange={(e) => setPaxDest((s) => ({ ...s, [c]: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
              ))}
            </div>
            {divergente && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-700 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  ALERTA: a soma dos PAX por destino ({somaDest}) é diferente do PAX total ({paxTotal}).
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-sky-400">
              <FileText size={13} /> 1. Copiar & colar relação principal
            </div>
            <p className="mb-2 text-[10px] text-slate-500">Patentes (2S, SGT, CEL) são ignoradas no cruzamento de nomes</p>
            <textarea rows="5" className={C.input} value={prev} onChange={(e) => setPrev(e.target.value)} placeholder={'2S JOAO DA SILVA\nSGT MARIA OLIVEIRA\nCEL CARLOS SOUZA'} />
            <p className={`mt-1 text-[10px] ${contarNomes(prev) === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{contarNomes(prev)} nomes</p>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-400">
              <Users size={13} /> 2. Copiar & colar efetivamente embarcados
            </div>
            <p className="mb-2 text-[10px] text-slate-500">O nome limpo coincidirá mesmo se omitir a patente nesta lista</p>
            <textarea rows="5" className={C.input} value={real} onChange={(e) => setReal(e.target.value)} placeholder={'JOAO DA SILVA\nMARIA OLIVEIRA\nNOVO PASSAGEIRO'} />
            <p className={`mt-1 text-[10px] ${contarNomes(real) === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{contarNomes(real)} nomes</p>
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

      <Modal
        dados={alerta}
        onCancelar={() => setAlerta(null)}
        onConfirmar={async () => {
          setAlerta(null);
          await salvar(pendente.current);
        }}
      />
    </>
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
  const mudarRota = (e) => setF((s) => ({ ...s, rota: formatarRota(e.target.value, s.rota) }));
  const fecharRotaCampo = () => setF((s) => ({ ...s, rota: fecharRota(s.rota) }));

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
        rota: fecharRota(f.rota.trim().toUpperCase()),
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
            <input className={C.input} value={f.rota} onChange={mudarRota} onBlur={fecharRotaCampo} placeholder="SBGR-SBBR" />
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
      <form onSubmit={enviar} className="space-y-4">import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, Database, PlusCircle, UserCheck, Plane, Printer, Users, ChevronLeft,
  Menu, LogOut, Filter, PieChart, Pencil, Trash2, CalendarDays, Zap,
  ShieldCheck, KeyRound, UserPlus, RotateCcw, FileText, AlertTriangle, Eye, EyeOff, Clock, ChevronDown
} from 'lucide-react';
import { supabase, supabaseConfigurado } from './supabase.js';

/* Nome exibido no app e crédito de criação (altere aqui se quiser) */
const NOME_APP = 'PCAN-BR';
const CRIADOR = 'CAIO';

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
const FILTRO_VAZIO = { aeronaves: [], inicial: '', final: '', data: '', mes: '', locais: [] };
const codigosRota = (rota) => (rota || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);

const filtrarVoos = (lista, f) =>
  lista.filter((v) => {
    if (f.aeronaves.length && !f.aeronaves.includes(v.aeronave)) return false;
    if (f.inicial && v.data_voo < f.inicial) return false;
    if (f.final && v.data_voo > f.final) return false;
    if (f.data && v.data_voo !== f.data) return false;
    if (f.mes && !v.data_voo.startsWith(f.mes)) return false;
    if (f.locais.length && !codigosRota(v.rota).some((c) => f.locais.includes(c))) return false;
    return true;
  });

const somar = (lista, campo) => lista.reduce((s, v) => s + (Number(v[campo]) || 0), 0);

// Os filtros só passam a valer quando o botão "Gerar filtros" é clicado.
// "Desfazer filtro" volta ao filtro aplicado anteriormente; "Remover filtros" limpa tudo.
function useFiltro() {
  const [rascunho, setRascunho] = useState(FILTRO_VAZIO);
  const [aplicado, setAplicado] = useState(FILTRO_VAZIO);
  const [pilha, setPilha] = useState([]);
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pendente = !igual(rascunho, aplicado);
  const ativo = !igual(aplicado, FILTRO_VAZIO);
  const guardar = (f) => setPilha((p) => [...p.slice(-19), f]);

  const gerar = () => {
    if (!igual(rascunho, aplicado)) guardar(aplicado);
    setAplicado(rascunho);
  };
  const limpar = () => {
    if (!igual(aplicado, FILTRO_VAZIO)) guardar(aplicado);
    setRascunho(FILTRO_VAZIO);
    setAplicado(FILTRO_VAZIO);
  };
  const remover = (chave) => {
    const vazioChave = Array.isArray(FILTRO_VAZIO[chave]) ? [] : '';
    if (!igual(aplicado[chave], vazioChave)) guardar(aplicado);
    setAplicado((a) => ({ ...a, [chave]: vazioChave }));
    setRascunho((r) => ({ ...r, [chave]: vazioChave }));
  };
  const desfazer = () => {
    if (!pilha.length) return;
    const anterior = pilha[pilha.length - 1];
    setPilha((p) => p.slice(0, -1));
    setAplicado(anterior);
    setRascunho(anterior);
  };
  return { rascunho, setRascunho, aplicado, gerar, limpar, remover, desfazer, podeDesfazer: pilha.length > 0, pendente, ativo };
}

/* ---------------------------------------------------------------
   ROTA, PENDÊNCIAS E HISTÓRICO DE ALTERAÇÕES
   --------------------------------------------------------------- */
// Coloca o traço automaticamente depois de cada código de 4 letras (ex.: SBBR-SBGL)
const formatarRota = (raw, anterior = '') => {
  const texto = String(raw || '');
  const limpo = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let saida = (limpo.match(/.{1,4}/g) || []).join('-');
  if (limpo.length > 0 && limpo.length % 4 === 0 && texto.length === String(anterior).length + 1) saida += '-';
  return saida;
};
const fecharRota = (v) => String(v || '').replace(/-+$/, '');
// Destinos = todos os códigos da rota, exceto o primeiro (origem)
const destinosDaRota = (rota) => [...new Set(codigosRota(rota).slice(1))];
const vazio = (x) => x === '' || x === null || x === undefined;
const contarNomes = (t) => new Set(String(t || '').split('\n').map(limparNome).filter(Boolean)).size;

// Lista de pendências de um voo (alerta ao salvar e alerta piscando na tira do Painel de Voos).
// Usa a quantidade de nomes: nomes_previsto (relação principal) e nomes_real (efetivamente embarcados).
const pendenciasVoo = (d) => {
  const p = [];
  const faltaHora = [];
  if (!d.hora_chamada) faltaHora.push('chamada');
  if (!d.hora_decolagem) faltaHora.push('decolagem');
  if (!d.hora_real) faltaHora.push('hora real');
  if (faltaHora.length) p.push(`Horários não preenchidos: ${faltaHora.join(', ')}`);
  if (!String(d.rota || '').trim()) p.push('Rota não informada');
  if (vazio(d.pax) || Number(d.pax) === 0) p.push('Total de PAX não informado');
  if (vazio(d.peso_pax)) p.push('Peso de PAX não informado');
  if (vazio(d.peso_bagagem)) p.push('Peso de bagagem não informado');
  if (vazio(d.qtd_bagagens)) p.push('Quantidade de bagagens não informada');
  const nPrev = Number(d.nomes_previsto) || 0;
  const nReal = Number(d.nomes_real) || 0;
  const paxTotal = Number(d.pax) || 0;
  if (nPrev === 0) p.push('Faltam nomes na relação principal');
  if (nReal === 0) p.push('Faltam nomes em efetivamente embarcados');
  if (nReal > 0 && paxTotal > 0 && nReal !== paxTotal) p.push(`PAX total (${paxTotal}) diferente dos embarcados na lista (${nReal})`);
  const dest = destinosDaRota(d.rota);
  if (dest.length > 1) {
    const mapa = d.pax_destinos || {};
    const soma = dest.reduce((s, c) => s + (Number(mapa[c]) || 0), 0);
    if (soma !== paxTotal) p.push(`PAX por destino (${soma}) diferente do PAX total (${paxTotal})`);
  }
  return p;
};
// Voo já salvo: as quantidades de nomes vêm dos totais guardados
const pendenciasSalvo = (v) =>
  pendenciasVoo({ ...v, nomes_previsto: v.total_previsto, nomes_real: (Number(v.embarcados) || 0) + (Number(v.extras) || 0) });
const classificarPend = (pend) => ({
  divergente: pend.some((t) => t.includes('diferente')),
  falta: pend.some((t) => !t.includes('diferente'))
});
const fmtMin = (m) => (m === null || m === undefined ? '—' : `${Math.floor(m / 60)}h${p2(m % 60)}`);

const ROTULOS_CAMPOS = {
  aeronave: 'Aeronave', matricula: 'Matrícula', rota: 'Rota', data_voo: 'Data',
  hora_chamada: 'Chamada', hora_decolagem: 'Decolagem', hora_real: 'Hora real',
  pax: 'PAX', peso_pax: 'Peso PAX', peso_bagagem: 'Peso bagagem', total_peso: 'Peso total',
  qtd_bagagens: 'Qtd bagagens', total_previsto: 'Total previsto', embarcados: 'Embarcados',
  faltas: 'Faltas', extras: 'Extras', desembarcados: 'Desembarcados', excluido: 'Na lixeira',
  lista_prevista: 'Relação principal', lista_real: 'Efetivamente embarcados', pax_destinos: 'PAX por destino'
};
const IGNORAR_CAMPOS = new Set(['id', 'criado_em', 'ultima_alt_por', 'ultima_alt_em', 'excluido_em', 'excluido_por']);
const fmtValor = (campo, v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'SIM' : 'NÃO';
  if (campo === 'pax_destinos') {
    const e = Object.entries(v);
    return e.length ? e.map(([k, x]) => `${k}: ${x}`).join(', ') : '—';
  }
  if (campo === 'data_voo') return fmtData(String(v));
  return String(v);
};
// Compara o registo antes e depois e devolve só o que mudou
const diferencas = (antes, depois) => {
  if (!antes || !depois) return [];
  return Object.keys(depois)
    .filter((k) => !IGNORAR_CAMPOS.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map((k) =>
      k === 'lista_prevista' || k === 'lista_real'
        ? { campo: ROTULOS_CAMPOS[k], texto: 'texto atualizado' }
        : { campo: ROTULOS_CAMPOS[k] || k, de: fmtValor(k, antes[k]), para: fmtValor(k, depois[k]) }
    );
};
const resumoVoo = (v) => `${v.aeronave} · ${fmtData(v.data_voo)}${v.matricula ? ` · ${v.matricula}` : ''}`;
const resumoDesemb = (d) => `${d.aeronave} · ${fmtData(d.data_voo)} · ${d.desembarcados} desemb.`;
const ROTULO_TABELA = { voos: 'voo', desembarques: 'desembarque', aeronaves: 'aeronave', usuarios: 'utilizador' };
const COR_ACAO = {
  incluiu: 'border-emerald-700 text-emerald-400',
  alterou: 'border-sky-700 text-sky-300',
  excluiu: 'border-rose-700 text-rose-400',
  restaurou: 'border-amber-700 text-amber-400'
};

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
        input:not([type="password"]):not([type="date"]):not([type="month"]):not([type="number"]):not(.sem-caixa),
        textarea { text-transform: uppercase; }
        .fundo-aviao { left: 0; animation: fundo-cruzar 22s linear forwards; }
        @keyframes alerta-piscar {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(245, 158, 11, 0.75); }
          50% { opacity: 0.3; box-shadow: none; }
        }
        .alerta-piscar { animation: alerta-piscar 1.1s ease-in-out infinite; }
        @keyframes mapa-fluxo { to { stroke-dashoffset: -20; } }
        .mapa-linha { stroke-dasharray: 5 5; animation: mapa-fluxo 1.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fundo-aviao { animation: none; left: 35%; }
          .alerta-piscar, .mapa-linha { animation: none; }
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

// Lista com caixas de seleção: "TODAS" (sem filtro) ou escolher apenas algumas
function MultiSelecao({ rotulo, opcoes, valor, onChange, todasRotulo = 'TODAS' }) {
  const [aberto, setAberto] = useState(false);
  const todas = valor.length === 0;
  const resumo = todas ? `${todasRotulo} (${opcoes.length})` : valor.length === 1 ? valor[0] : `${valor.length} SELECIONADAS`;
  const alternar = (o) => onChange(valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o]);
  const linha = 'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs uppercase hover:bg-slate-800';
  return (
    <Campo rotulo={rotulo} className="relative">
      <button type="button" onClick={() => setAberto((a) => !a)} className={`${C.input} flex items-center justify-between gap-2 text-left`}>
        <span className="truncate">{resumo}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-[#0a1120] p-2 shadow-xl">
            <label className={`${linha} font-bold text-sky-300`}>
              <input type="checkbox" checked={todas} onChange={() => onChange([])} /> {todasRotulo}
            </label>
            <div className="my-1 border-t border-slate-800" />
            {opcoes.length === 0 && <p className="px-2 py-2 text-[11px] text-slate-500">Nenhuma opção disponível.</p>}
            {opcoes.map((o) => (
              <label key={o} className={`${linha} text-slate-200`}>
                <input type="checkbox" checked={valor.includes(o)} onChange={() => alternar(o)} /> {o}
              </label>
            ))}
            <div className="mt-1 border-t border-slate-800 pt-2 text-right">
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-bold uppercase text-white hover:bg-sky-500">
                Ok
              </button>
            </div>
          </div>
        </>
      )}
    </Campo>
  );
}

function CamposFiltro({ f, setF, aeronaves, comMes = true, rotulos = {} }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <MultiSelecao
        rotulo="Aeronave FAB"
        opcoes={aeronaves.map((a) => a.modelo)}
        valor={f.aeronaves}
        onChange={(v) => setF({ ...f, aeronaves: v })}
        todasRotulo="TODAS AS AERONAVES"
      />
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
  const a = filtro.aplicado;
  const chips = [];
  if (a.aeronaves.length) chips.push(['aeronaves', `Aeronaves: ${a.aeronaves.join(', ')}`]);
  if (a.inicial) chips.push(['inicial', `De ${fmtData(a.inicial)}`]);
  if (a.final) chips.push(['final', `Até ${fmtData(a.final)}`]);
  if (a.data) chips.push(['data', `Data ${fmtData(a.data)}`]);
  if (a.mes) chips.push(['mes', `Mês ${a.mes.split('-').reverse().join('/')}`]);
  if (a.locais.length) chips.push(['locais', `Locais: ${a.locais.join(', ')}`]);
  return (
    <div className="space-y-3 border-t border-slate-800 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={filtro.gerar} className={`${C.botao} flex items-center gap-2`}>
          <Filter size={14} /> Gerar filtros
        </button>
        <button
          type="button"
          onClick={filtro.desfazer}
          disabled={!filtro.podeDesfazer}
          className={`${C.botaoSec} flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
          title="Volta ao filtro aplicado anteriormente"
        >
          <RotateCcw size={14} /> Desfazer filtro
        </button>
        <button
          type="button"
          onClick={filtro.limpar}
          disabled={!filtro.ativo && !filtro.pendente}
          className={`${C.botaoSec} flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Trash2 size={14} /> Remover filtros
        </button>
        {filtro.pendente && (
          <span className="text-[11px] font-bold uppercase text-amber-400">
            Alterações ainda não aplicadas — clique em Gerar filtros
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Filtros ativos:</span>
          {chips.map(([chave, texto]) => (
            <span key={chave} className="flex items-center gap-2 rounded-full border border-sky-800 bg-sky-950/50 py-1 pl-3 pr-1.5 text-[11px] uppercase text-sky-200">
              {texto}
              <button
                type="button"
                onClick={() => filtro.remover(chave)}
                className="rounded-full bg-sky-900/70 px-1.5 text-xs font-bold leading-5 text-sky-100 hover:bg-rose-700"
                title="Remover este filtro"
                aria-label="Remover este filtro"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const PALETA = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#22d3ee', '#f472b6', '#a3e635'];

// Gráfico principal: rosca. Gráfico secundário: barras.
function CartaoMetrica({ titulo, total, unidade, tema, dados, destaque, onSelecionar }) {
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
  const cor = (i) => PALETA[i % PALETA.length];
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

      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-500/80">
        <PieChart size={11} /> Principal · rosca
      </div>
      <div className={`${C.caixa} mt-1.5 flex min-h-[10.5rem] items-center justify-center gap-5 px-4 py-3`}>
        {soma === 0 ? (
          <span className="text-[11px] uppercase text-slate-600">Sem dados</span>
        ) : (
          <>
            <div className="relative h-36 w-36 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#1e293b" strokeWidth="16" />
                {fatias.map(({ d, i, len, off }) => (
                  <circle
                    key={d.nome}
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke={cor(i)}
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
                <span className="font-mono text-base font-extrabold text-white">{itemFoco ? itemFoco.valor : total}</span>
                <span className="text-[9px] uppercase text-slate-500">{itemFoco ? `${pct(itemFoco.valor)}%` : 'total'}</span>
              </div>
            </div>
            <div className="flex max-h-36 min-w-0 flex-col gap-1 overflow-y-auto">
              {fatias.map(({ d, i }) => (
                <button
                  key={d.nome}
                  type="button"
                  {...eventos(d)}
                  className={`flex items-center gap-2 text-left text-[10px] uppercase transition-opacity ${apagado(d) ? 'opacity-30' : 'opacity-100'}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: cor(i) }} />
                  <span className="truncate text-slate-300">{d.nome}</span>
                  <span className="font-mono text-slate-500">{pct(d.valor)}%</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <BarChart3 size={11} /> Secundário · barras
      </div>
      <div className={`${C.caixa} mt-1.5 flex h-28 items-end justify-center gap-3 overflow-x-auto px-3 pt-2`}>
        {dados.length === 0 ? (
          <span className="self-center text-[11px] uppercase text-slate-600">Sem dados</span>
        ) : (
          dados.map((d, i) => (
            <button
              key={d.nome}
              type="button"
              {...eventos(d)}
              className={`flex h-full min-w-[44px] flex-col items-center justify-end pb-1 transition-opacity duration-200 ${apagado(d) ? 'opacity-30' : 'opacity-100'}`}
            >
              <span className="font-mono text-[10px] font-bold text-slate-200">{d.valor}</span>
              <div
                className={`w-9 rounded-t-md transition-all duration-700 ease-out hover:brightness-125 ${d.nome === destaque ? 'ring-2 ring-white' : ''}`}
                style={{ height: pronto ? `${Math.max(Math.round((d.valor / max) * 52), 4)}px` : '0px', background: cor(i) }}
              />
              <span className="max-w-[52px] truncate pt-1 text-[9px] uppercase text-slate-500">{d.rotulo}</span>
            </button>
          ))
        )}
      </div>

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
    <div className={`${C.caixa} px-2 py-2.5 text-center`}>
      <div className="text-[11px] uppercase text-slate-400">{rotulo}</div>
      <div className={`font-mono text-sm font-bold ${destaque ? 'text-sky-400' : 'text-white'}`}>{valor}</div>
    </div>
  );
}

function Celula({ rotulo, valor, sub, destaque }) {
  return (
    <div className="min-w-[64px]">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{rotulo}</div>
      <div className={`font-mono text-sm font-bold ${destaque ? 'text-sky-400' : 'text-white'}`}>{valor}</div>
      {sub && <div className="text-[10px] uppercase text-slate-500">{sub}</div>}
    </div>
  );
}

function Mini({ rotulo, valor, cor = 'text-white' }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#050a16] px-1 py-1.5">
      <div className={`font-mono text-sm font-bold ${cor}`}>{valor}</div>
      <div className="text-[9px] uppercase text-slate-500">{rotulo}</div>
    </div>
  );
}

function Bloco({ titulo, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-500/80">{titulo}</div>
      {children}
    </div>
  );
}

function RotaChips({ rota, paxDestinos }) {
  const codigos = codigosRota(rota);
  if (!codigos.length) return <span className="text-xs text-slate-500">Rota não informada</span>;
  const multi = destinosDaRota(rota).length > 1;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {codigos.map((c, i) => (
          <React.Fragment key={`${c}-${i}`}>
            {i > 0 && <span className="text-slate-500">→</span>}
            <span className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${i === 0 ? 'bg-slate-800 text-slate-200' : 'bg-sky-900/50 text-sky-200'}`}>
              {c}
              {i > 0 && multi && paxDestinos && paxDestinos[c] !== undefined && (
                <span className="ml-1 text-[10px] font-normal text-sky-400">({paxDestinos[c]} pax)</span>
              )}
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] uppercase text-slate-500">Origem → destino{multi ? 's' : ''}</p>
    </div>
  );
}

// Cabeçalho e rodapé compartilhados pelas tiras de voo e de desembarque
function TiraCabecalho({ Icone, aeronave, matricula, data, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-800 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-sky-600/20 p-2 text-sky-300">
          <Icone size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold uppercase leading-tight text-sky-400">{aeronave}</h3>
          <p className="text-[11px] uppercase text-slate-400">
            Matrícula: <b className="font-mono text-white">{matricula || 'N/D'}</b>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs uppercase text-slate-300">
        <CalendarDays size={14} className="text-sky-400" />
        <b className="font-mono text-white">{fmtData(data)}</b> · {diaSemana(data)}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function TiraRodape({ por, em, onEditar, onApagar }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#050a16]/50 px-5 py-2.5">
      <span className="text-[11px] uppercase text-slate-400">
        Última alt. por: <b className="font-mono text-white">{por || '—'}</b> <span className="font-mono text-sky-300">({fmtTs(em)})</span>
      </span>
      <div className="flex items-center gap-4 text-xs font-bold uppercase">
        <button onClick={onEditar} className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
          <Pencil size={14} /> Editar
        </button>
        <button onClick={onApagar} className="flex items-center gap-1 text-rose-400 hover:text-rose-300">
          <Trash2 size={14} /> Apagar
        </button>
      </div>
    </div>
  );
}

// Voo em forma de tira horizontal, organizada em blocos
function TiraVoo({ v, onEditar, onApagar }) {
  const ef = calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real);
  const corEf =
    ef === null
      ? 'border-slate-700 text-slate-400'
      : ef >= 100
      ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400'
      : 'border-amber-700 bg-amber-950/40 text-amber-400';
  const pend = pendenciasSalvo(v);
  const { falta, divergente } = classificarPend(pend);
  const rotuloAlerta = falta && divergente ? 'Faltam dados · PAX divergente' : falta ? 'Faltam dados' : 'PAX divergente';
  const previsto = intervalo(v.hora_chamada, v.hora_decolagem);
  const executado = intervalo(v.hora_chamada, v.hora_real);

  return (
    <div className={`${C.painel} overflow-hidden border-l-4 ${pend.length ? 'border-l-amber-500' : 'border-l-sky-500'}`}>
      <TiraCabecalho Icone={Plane} aeronave={v.aeronave} matricula={v.matricula} data={v.data_voo}>
        <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold uppercase ${corEf}`}>
          <Zap size={13} /> Efetividade: {fmtEf(ef)}
        </span>
        {pend.length > 0 && (
          <span className="alerta-piscar flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-950/60 px-2.5 py-1.5 text-[11px] font-bold uppercase text-amber-300">
            <AlertTriangle size={14} /> Atenção: {rotuloAlerta}
          </span>
        )}
      </TiraCabecalho>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1.45fr_1.5fr_1.2fr]">
        <Bloco titulo="Rota e destinos">
          <RotaChips rota={v.rota} paxDestinos={v.pax_destinos} />
        </Bloco>

        <Bloco titulo="Horários">
          <div className="grid grid-cols-3 gap-2">
            <Celula rotulo="Chamada" valor={v.hora_chamada || '--:--'} />
            <Celula rotulo="Decolagem" valor={v.hora_decolagem || '--:--'} />
            <Celula rotulo="Hora real" valor={v.hora_real || '--:--'} />
          </div>
          <p className="mt-2 text-[11px] uppercase text-slate-400">
            Previsto <b className="font-mono text-white">{fmtMin(previsto)}</b> · Real <b className="font-mono text-white">{fmtMin(executado)}</b>
          </p>
        </Bloco>

        <Bloco titulo="Passageiros">
          <div className="flex items-end gap-4">
            <div>
              <div className="font-mono text-2xl font-extrabold leading-none text-white">{v.pax}</div>
              <div className="mt-1 text-[10px] uppercase text-slate-400">PAX total</div>
            </div>
            <div className="grid flex-1 grid-cols-4 gap-1 text-center">
              <Mini rotulo="Previsto" valor={v.total_previsto ?? 0} />
              <Mini rotulo="Embarc." valor={v.embarcados ?? 0} cor="text-sky-400" />
              <Mini rotulo="Faltas" valor={v.faltas ?? 0} cor="text-amber-400" />
              <Mini rotulo="Extras" valor={v.extras ?? 0} cor="text-emerald-400" />
            </div>
          </div>
        </Bloco>

        <Bloco titulo="Carga">
          <div className="grid grid-cols-3 gap-2">
            <Celula rotulo="Peso pax" valor={`${v.peso_pax} KG`} />
            <Celula rotulo="Bagagem" valor={`${v.peso_bagagem} KG`} sub={`${v.qtd_bagagens} vol.`} />
            <Celula rotulo="Total" valor={`${v.total_peso} KG`} destaque />
          </div>
        </Bloco>
      </div>

      {pend.length > 0 && (
        <div className="flex flex-wrap items-start gap-x-4 gap-y-1 border-t border-amber-900/50 bg-amber-950/20 px-5 py-2 text-[11px] text-amber-300">
          <span className="flex items-center gap-1 font-bold uppercase">
            <AlertTriangle size={13} /> Pendências:
          </span>
          {pend.map((t) => (
            <span key={t}>• {t}</span>
          ))}
        </div>
      )}

      <TiraRodape por={v.ultima_alt_por} em={v.ultima_alt_em} onEditar={() => onEditar(v)} onApagar={() => onApagar(v)} />
    </div>
  );
}

// Desembarque no mesmo padrão da tira de voo
function TiraDesemb({ d, onEditar, onApagar }) {
  return (
    <div className={`${C.painel} overflow-hidden border-l-4 border-l-emerald-500`}>
      <TiraCabecalho Icone={UserCheck} aeronave={d.aeronave} matricula={d.matricula} data={d.data_voo}>
        <span className="flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-bold uppercase text-emerald-400">
          <UserCheck size={13} /> Desembarque
        </span>
      </TiraCabecalho>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-4 md:grid-cols-3">
        <Bloco titulo="Rota / origem">
          <RotaChips rota={d.rota} />
        </Bloco>
        <Bloco titulo="Passageiros">
          <div className="font-mono text-2xl font-extrabold leading-none text-emerald-400">{d.desembarcados}</div>
          <div className="mt-1 text-[10px] uppercase text-slate-400">Desembarcados</div>
        </Bloco>
        <Bloco titulo="Data do voo">
          <Celula rotulo="Dia" valor={fmtData(d.data_voo)} sub={diaSemana(d.data_voo)} />
        </Bloco>
      </div>
      <TiraRodape por={d.ultima_alt_por} em={d.ultima_alt_em} onEditar={() => onEditar(d)} onApagar={() => onApagar(d)} />
    </div>
  );
}

// Paginação das listas (evita mostrar centenas de registos de uma vez)
function usePaginas(lista, chave, tamanhoInicial = 20) {
  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanhoEstado] = useState(tamanhoInicial);
  useEffect(() => {
    setPagina(1);
  }, [chave]);
  const total = Math.max(1, Math.ceil(lista.length / tamanho));
  const atual = Math.min(pagina, total);
  const itens = useMemo(() => lista.slice((atual - 1) * tamanho, atual * tamanho), [lista, atual, tamanho]);
  const setTamanho = (t) => {
    setTamanhoEstado(t);
    setPagina(1);
  };
  return { itens, pagina: atual, total, tamanho, qtd: lista.length, setPagina, setTamanho };
}

function BarraPaginas({ p }) {
  if (p.qtd === 0) return null;
  const ini = (p.pagina - 1) * p.tamanho + 1;
  const fim = Math.min(p.pagina * p.tamanho, p.qtd);
  const ir = (n) => {
    p.setPagina(n);
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const btn =
    'rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className={`${C.painel} flex flex-wrap items-center justify-between gap-3 px-5 py-3`}>
      <span className="font-mono text-[11px] uppercase text-slate-400">
        Mostrando {ini}–{fim} de {p.qtd}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-lg border border-slate-700 bg-[#050a16] px-2 py-1.5 text-[11px] uppercase text-slate-300"
          value={p.tamanho}
          onChange={(e) => p.setTamanho(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} por página</option>
          ))}
        </select>
        <button className={btn} disabled={p.pagina <= 1} onClick={() => ir(1)}>« Primeira</button>
        <button className={btn} disabled={p.pagina <= 1} onClick={() => ir(p.pagina - 1)}>‹ Anterior</button>
        <span className="font-mono text-[11px] text-white">{p.pagina} / {p.total}</span>
        <button className={btn} disabled={p.pagina >= p.total} onClick={() => ir(p.pagina + 1)}>Próxima ›</button>
        <button className={btn} disabled={p.pagina >= p.total} onClick={() => ir(p.total)}>Última »</button>
      </div>
    </div>
  );
}

function Modal({ dados, onCancelar, onConfirmar }) {
  const [ocupado, setOcupado] = useState(false);
  if (!dados) return null;
  const aviso = dados.tipo === 'aviso';
  const confirmar = async () => {
    setOcupado(true);
    await onConfirmar();
    setOcupado(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`${C.painel} w-full max-w-md space-y-4 p-6`}>
        <div className={`flex items-center gap-3 ${aviso ? 'text-amber-400' : 'text-rose-400'}`}>
          <AlertTriangle size={22} />
          <h3 className="text-sm font-bold uppercase">{dados.titulo}</h3>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{dados.texto}</p>
        {dados.itens && dados.itens.length > 0 && (
          <ul className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-200">
            {dados.itens.map((i) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-700 py-3 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
          >
            {dados.botaoCancelar || 'Cancelar'}
          </button>
          <button
            onClick={confirmar}
            disabled={ocupado}
            className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase text-white disabled:opacity-50 ${
              aviso ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
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

function TelaLogin({ onEntrar, onVerificar, online }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [ver, setVer] = useState(false);
  const [verif, setVerif] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const mudarNome = (e) => {
    setNome(e.target.value);
    setVerif(null);
    setErro('');
  };
  const mudarSenha = (e) => {
    setSenha(e.target.value);
    setVerif(null);
    setErro('');
  };

  const verificar = async () => {
    if (!nome.trim() || !senha) {
      setVerif({ tipo: 'aviso', texto: 'Preencha utilizador e senha para verificar.' });
      return;
    }
    setVerificando(true);
    const r = await onVerificar(nome, senha);
    setVerificando(false);
    if (r === 'ok') setVerif({ tipo: 'ok', texto: 'Senha correta. Pode clicar em Entrar.' });
    else if (r === 'erro') setVerif({ tipo: 'aviso', texto: 'Não foi possível verificar agora. Tente novamente.' });
    else setVerif({ tipo: 'erro', texto: 'Utilizador ou senha incorretos.' });
  };

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

  const corVerif = { ok: 'text-emerald-400', erro: 'text-rose-400', aviso: 'text-amber-400' };

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
                PCAN<span className="text-sky-400">-BR</span>
              </h1>
              <p className="text-[10px] uppercase text-slate-400">Posto CAN BR — Base Aérea de Brasília</p>
            </div>
          </div>
          <Campo rotulo="Utilizador">
            <input className={C.input} value={nome} onChange={mudarNome} placeholder="EX: CAIO" autoCapitalize="characters" required />
          </Campo>
          <Campo rotulo="Senha">
            <div className="relative">
              <input
                type={ver ? 'text' : 'password'}
                className={`${C.input} pr-11 sem-caixa`}
                value={senha}
                onChange={mudarSenha}
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
          <div className="space-y-2">
            <button type="button" onClick={verificar} disabled={verificando} className={`${C.botaoSec} flex w-full items-center justify-center gap-2 disabled:opacity-50`}>
              <ShieldCheck size={14} /> {verificando ? 'A verificar…' : 'Verificar senha'}
            </button>
            {verif && <p className={`text-xs font-bold ${corVerif[verif.tipo]}`}>{verif.texto}</p>}
          </div>
          {erro && <p className="text-xs font-bold text-rose-400">{erro}</p>}
          {!online && <p className="text-xs text-amber-400">A ligar ao servidor… se demorar, verifique a internet.</p>}
          <button type="submit" disabled={ocupado} className={`${C.botao} w-full`}>
            {ocupado ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
        <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] uppercase tracking-wide text-slate-500">
          {NOME_APP} · Criado por <b className="text-sky-300">{CRIADOR}</b>
        </p>
      </div>
    </>
  );
}

/* Mapa do Brasil (desenho estilizado) e aeroportos. Para incluir um aeroporto novo, copie uma linha de AEROPORTOS. */
const MAPA_W = 477;
const MAPA_H = 481;
const ESTADOS_BR = [{"uf": "AC", "nome": "Acre", "regiao": "Norte", "d": "M15.1 152.4L42.9 154.8L66.1 165.6L80.0 175.2L88.1 184.8L85.8 192.0L74.2 191.4L63.2 199.2L41.7 199.2L31.3 187.2L18.5 181.2L10.4 172.8L2.4 157.7L9.3 155.4L15.1 152.4Z", "cx": 45.1, "cy": 175.6}, {"uf": "AM", "nome": "Amazonas", "regiao": "Norte", "d": "M48.7 118.0L52.2 94.8L55.6 80.4L48.7 60.0L54.5 49.2L77.7 43.2L84.6 52.8L95.1 57.6L104.3 52.8L109.0 48.0L114.8 56.4L129.8 70.8L143.7 73.2L155.3 79.2L164.6 74.4L176.2 63.6L185.5 78.0L193.6 87.6L204.0 93.6L209.8 105.6L201.7 115.2L195.9 127.2L190.1 145.2L183.2 156.0L169.2 165.6L160.0 174.0L149.5 165.6L132.1 163.2L112.4 177.6L88.1 184.8L80.0 175.2L66.1 165.6L42.9 154.8L15.1 152.4L22.0 142.8L31.3 129.6L39.4 120.0L48.7 118.0Z", "cx": 114.2, "cy": 116.4}, {"uf": "RR", "nome": "Roraima", "regiao": "Norte", "d": "M109.0 48.0L118.2 40.8L121.7 25.2L132.1 18.0L147.2 13.2L156.5 4.8L162.3 4.0L166.9 14.4L163.4 26.4L169.2 36.0L165.8 44.4L177.4 51.6L176.2 63.6L164.6 74.4L155.3 79.2L143.7 73.2L129.8 70.8L114.8 56.4L109.0 48.0Z", "cx": 145.9, "cy": 44.6}, {"uf": "RO", "nome": "Rondônia", "regiao": "Norte", "d": "M88.1 184.8L112.4 177.6L132.1 163.2L149.5 165.6L160.0 174.0L163.4 187.2L154.2 199.2L166.9 213.6L160.0 223.2L158.8 231.6L146.1 229.2L132.1 223.2L118.2 214.8L106.6 205.2L102.0 196.8L95.1 192.0L85.8 192.0L88.1 184.8Z", "cx": 133.8, "cy": 195.5}, {"uf": "MT", "nome": "Mato Grosso", "regiao": "Centro-Oeste", "d": "M160.0 174.0L169.2 165.6L183.2 156.0L194.7 168.0L205.2 177.6L220.2 181.2L236.5 182.4L252.7 184.8L266.6 183.6L275.3 181.2L273.6 189.6L272.4 204.0L278.2 217.2L277.0 223.2L273.6 235.2L266.6 246.0L255.0 254.4L246.9 268.8L243.4 282.0L231.8 276.0L222.6 273.6L211.0 274.8L197.1 276.0L186.1 281.4L183.2 264.0L173.9 259.2L161.1 250.8L147.2 237.6L158.8 231.6L160.0 223.2L166.9 213.6L154.2 199.2L163.4 187.2L160.0 174.0Z", "cx": 213.0, "cy": 221.7}, {"uf": "PA", "nome": "Pará", "regiao": "Norte", "d": "M227.2 39.6L215.6 42.0L201.7 43.8L192.4 46.8L185.5 50.4L177.4 51.6L176.2 63.6L185.5 78.0L193.6 87.6L204.0 93.6L209.8 105.6L201.7 115.2L195.9 127.2L190.1 145.2L183.2 156.0L194.7 168.0L205.2 177.6L220.2 181.2L236.5 182.4L252.7 184.8L266.6 183.6L275.3 181.2L284.0 168.0L294.4 154.8L299.1 141.6L301.4 129.0L304.9 118.8L310.7 105.6L317.6 93.6L323.4 85.2L326.9 79.8L316.5 76.8L304.9 75.6L297.9 82.8L300.2 74.4L287.5 66.0L275.9 63.6L270.7 67.8L264.3 75.6L256.2 80.4L251.5 81.6L246.9 70.8L238.8 57.6L227.2 39.6Z", "cx": 244.9, "cy": 115.3}, {"uf": "AP", "nome": "Amapá", "regiao": "Norte", "d": "M261.4 15.0L270.1 38.4L280.5 46.8L276.5 60.0L275.9 63.6L270.7 67.8L264.3 75.6L256.2 80.4L251.5 81.6L246.9 70.8L238.8 57.6L227.2 39.6L238.8 39.0L250.4 31.2L257.3 21.6L261.4 15.0Z", "cx": 256.6, "cy": 50.9}, {"uf": "TO", "nome": "Tocantins", "regiao": "Norte", "d": "M301.4 129.0L307.2 138.0L309.5 156.0L319.9 169.2L328.1 190.2L329.2 198.0L325.7 206.4L323.4 217.2L322.8 228.0L313.0 226.8L307.2 222.0L299.1 216.0L289.8 217.2L278.2 217.2L272.4 204.0L273.6 189.6L275.3 181.2L284.0 168.0L294.4 154.8L299.1 141.6L301.4 129.0Z", "cx": 301.5, "cy": 188.3}, {"uf": "MA", "nome": "Maranhão", "regiao": "Nordeste", "d": "M326.9 79.8L336.2 86.4L343.1 93.6L350.1 97.2L361.7 96.0L369.8 99.6L375.6 100.2L368.6 110.4L362.8 124.8L360.5 139.2L351.2 153.6L343.1 168.0L335.0 181.2L328.1 190.2L319.9 169.2L309.5 156.0L307.2 138.0L301.4 129.0L304.9 118.8L310.7 105.6L317.6 93.6L323.4 85.2L326.9 79.8Z", "cx": 334.3, "cy": 129.2}, {"uf": "PI", "nome": "Piauí", "regiao": "Nordeste", "d": "M375.6 100.2L380.2 102.0L382.5 110.4L386.0 121.2L386.0 133.2L390.7 145.2L391.8 154.8L387.2 159.6L382.5 166.8L380.2 175.2L368.6 178.8L357.0 187.2L345.4 195.6L338.5 198.0L329.2 198.0L328.1 190.2L335.0 181.2L343.1 168.0L351.2 153.6L360.5 139.2L362.8 124.8L368.6 110.4L375.6 100.2Z", "cx": 365.1, "cy": 154.8}, {"uf": "CE", "nome": "Ceará", "regiao": "Nordeste", "d": "M380.2 102.0L394.1 101.4L408.0 103.2L413.8 111.6L423.1 120.0L428.3 123.6L420.8 133.2L416.2 139.2L415.0 150.0L413.8 154.8L405.7 161.4L396.4 158.4L387.2 159.6L391.8 154.8L390.7 145.2L386.0 133.2L386.0 121.2L382.5 110.4L380.2 102.0Z", "cx": 402.2, "cy": 128.9}, {"uf": "RN", "nome": "Rio Grande do Norte", "regiao": "Nordeste", "d": "M428.3 123.6L439.3 127.2L449.8 128.4L454.4 135.6L454.6 141.6L454.6 144.6L445.1 145.2L437.0 144.0L425.4 146.4L415.0 150.0L416.2 139.2L420.8 133.2L428.3 123.6Z", "cx": 434.9, "cy": 137.0}, {"uf": "PB", "nome": "Paraíba", "regiao": "Nordeste", "d": "M454.6 144.6L456.1 150.0L456.7 153.0L456.1 157.8L447.5 154.8L438.2 159.6L428.9 165.6L421.9 162.0L413.8 154.8L415.0 150.0L425.4 146.4L437.0 144.0L445.1 145.2L454.6 144.6Z", "cx": 434.9, "cy": 153.0}, {"uf": "PE", "nome": "Pernambuco", "regiao": "Nordeste", "d": "M456.1 157.8L455.8 164.4L454.4 170.4L452.1 175.2L447.5 174.6L438.2 177.0L428.9 177.6L417.9 176.4L411.5 180.0L402.2 181.2L390.7 180.0L380.2 175.2L382.5 166.8L387.2 159.6L396.4 158.4L405.7 161.4L413.8 154.8L421.9 162.0L428.9 165.6L438.2 159.6L447.5 154.8L456.1 157.8Z", "cx": 417.6, "cy": 168.6}, {"uf": "AL", "nome": "Alagoas", "regiao": "Nordeste", "d": "M452.1 175.2L449.8 180.0L444.0 186.0L438.2 193.2L433.5 189.6L427.7 186.0L420.8 182.4L418.5 180.0L417.9 176.4L428.9 177.6L438.2 177.0L447.5 174.6L452.1 175.2Z", "cx": 435.6, "cy": 182.0}, {"uf": "SE", "nome": "Sergipe", "regiao": "Nordeste", "d": "M438.2 193.2L433.5 198.0L428.9 202.8L426.6 206.4L421.9 204.0L417.3 198.0L417.3 190.8L419.6 186.0L420.8 182.4L427.7 186.0L433.5 189.6L438.2 193.2Z", "cx": 425.8, "cy": 194.3}, {"uf": "BA", "nome": "Bahia", "regiao": "Nordeste", "d": "M329.2 198.0L325.7 206.4L323.4 217.2L322.8 228.0L328.1 235.2L324.6 247.2L322.3 258.0L322.3 267.6L333.8 258.0L345.4 244.8L353.6 238.8L366.3 246.0L380.2 249.6L383.7 261.6L380.2 273.6L385.4 284.4L391.8 283.2L399.9 283.8L403.4 278.4L406.9 265.2L407.5 252.0L409.2 235.2L413.8 223.2L421.9 214.8L426.6 206.4L421.9 204.0L417.3 198.0L417.3 190.8L419.6 186.0L420.8 182.4L418.5 180.0L417.9 176.4L411.5 180.0L402.2 181.2L390.7 180.0L380.2 175.2L368.6 178.8L357.0 187.2L345.4 195.6L338.5 198.0L329.2 198.0Z", "cx": 375.4, "cy": 222.0}, {"uf": "GO", "nome": "Goiás", "regiao": "Centro-Oeste", "d": "M243.4 282.0L246.9 268.8L255.0 254.4L266.6 246.0L273.6 235.2L277.0 223.2L278.2 217.2L289.8 217.2L299.1 216.0L307.2 222.0L313.0 226.8L322.8 228.0L328.1 235.2L324.6 247.2L322.3 258.0L322.3 267.6L313.0 271.2L304.9 282.0L293.3 285.6L281.7 290.4L274.7 297.6L268.9 300.6L258.5 292.8L250.4 288.0L243.4 282.0Z", "cx": 286.9, "cy": 257.5}, {"uf": "MG", "nome": "Minas Gerais", "regiao": "Sudeste", "d": "M322.3 267.6L333.8 258.0L345.4 244.8L353.6 238.8L366.3 246.0L380.2 249.6L383.7 261.6L380.2 273.6L385.4 284.4L386.0 295.2L383.7 304.8L376.7 312.0L375.0 318.0L375.6 319.8L367.5 324.0L360.5 331.2L352.4 334.8L347.8 335.4L338.5 336.0L329.2 339.6L322.3 341.4L315.3 336.0L316.5 326.4L307.2 315.6L304.9 307.2L295.6 307.2L282.8 307.2L268.4 307.2L268.9 300.6L274.7 297.6L281.7 290.4L293.3 285.6L304.9 282.0L313.0 271.2L322.3 267.6Z", "cx": 340.6, "cy": 292.4}, {"uf": "ES", "nome": "Espírito Santo", "regiao": "Sudeste", "d": "M385.4 284.4L391.8 283.2L399.9 283.8L399.3 294.0L396.4 302.4L394.1 310.8L388.3 318.0L384.9 322.8L381.4 321.6L375.6 319.8L375.0 318.0L376.7 312.0L383.7 304.8L386.0 295.2L385.4 284.4Z", "cx": 388.8, "cy": 302.5}, {"uf": "RJ", "nome": "Rio de Janeiro", "regiao": "Sudeste", "d": "M375.6 319.8L381.4 321.6L384.9 322.8L383.7 330.0L376.7 337.2L373.3 342.0L362.8 342.6L357.0 343.2L347.8 345.6L341.4 347.4L343.1 343.2L346.0 340.2L347.8 335.4L352.4 334.8L360.5 331.2L367.5 324.0L375.6 319.8Z", "cx": 366.0, "cy": 333.9}, {"uf": "SP", "nome": "São Paulo", "regiao": "Sudeste", "d": "M268.4 307.2L282.8 307.2L295.6 307.2L304.9 307.2L307.2 315.6L316.5 326.4L315.3 336.0L322.3 341.4L329.2 339.6L338.5 336.0L347.8 335.4L346.0 340.2L343.1 343.2L341.4 347.4L337.3 349.2L332.7 353.4L323.4 355.8L315.3 360.0L308.3 365.4L304.3 369.0L303.1 370.8L295.6 360.0L287.5 356.4L279.4 354.0L271.3 345.6L262.0 339.6L253.9 339.0L244.6 339.0L246.3 336.0L253.9 327.6L259.7 316.8L268.4 307.2Z", "cx": 293.6, "cy": 335.1}, {"uf": "MS", "nome": "Mato Grosso do Sul", "regiao": "Centro-Oeste", "d": "M186.1 281.4L197.1 276.0L211.0 274.8L222.6 273.6L231.8 276.0L243.4 282.0L250.4 288.0L258.5 292.8L268.9 300.6L268.4 307.2L259.7 316.8L253.9 327.6L246.3 336.0L244.6 339.0L238.8 346.8L231.3 356.0L227.2 354.0L217.9 344.4L212.1 334.8L197.1 333.6L188.9 331.2L188.9 319.2L191.3 306.0L191.8 295.2L186.1 281.4Z", "cx": 224.5, "cy": 309.3}, {"uf": "PR", "nome": "Paraná", "regiao": "Sul", "d": "M244.6 339.0L253.9 339.0L262.0 339.6L271.3 345.6L279.4 354.0L287.5 356.4L295.6 360.0L303.1 370.8L299.1 373.8L296.8 378.0L296.8 380.4L289.8 379.2L280.5 382.8L266.6 380.4L251.5 382.2L235.9 387.6L229.5 380.4L227.2 373.8L228.4 366.0L231.3 356.0L238.8 346.8L244.6 339.0Z", "cx": 260.6, "cy": 364.4}, {"uf": "SC", "nome": "Santa Catarina", "regiao": "Sul", "d": "M296.8 380.4L297.3 390.0L299.7 398.4L296.2 409.2L289.8 415.2L284.0 419.4L278.2 415.2L274.7 408.0L265.5 402.0L252.7 396.0L236.5 393.0L235.9 387.6L251.5 382.2L266.6 380.4L280.5 382.8L289.8 379.2L296.8 380.4Z", "cx": 274.6, "cy": 394.9}, {"uf": "RS", "nome": "Rio Grande do Sul", "regiao": "Sul", "d": "M284.0 419.4L279.4 429.6L270.1 440.4L258.5 451.2L250.4 462.0L241.1 472.2L240.0 463.2L241.1 458.4L231.8 450.0L220.2 441.6L211.0 436.8L199.4 428.4L192.4 429.6L198.2 423.6L209.8 411.6L222.6 402.0L231.8 394.8L236.5 393.0L252.7 396.0L265.5 402.0L274.7 408.0L278.2 415.2L284.0 419.4Z", "cx": 242.4, "cy": 425.4}, {"uf": "DF", "nome": "Distrito Federal", "regiao": "Centro-Oeste", "d": "M304.9 253.2L311.8 255.6L311.2 259.2L303.7 259.8L300.5 256.8L302.6 253.2Z", "cx": 306.1, "cy": 256.6}];
const BRASILIA = { x: 304.6, y: 257.6 };
const AEROPORTOS = {"SBBR": {"n": "Brasília", "uf": "DF", "x": 304.6, "y": 257.6}, "SBGR": {"n": "Guarulhos", "uf": "SP", "x": 321.4, "y": 348.4}, "SBSP": {"n": "Congonhas", "uf": "SP", "x": 319.2, "y": 350.8}, "SBKP": {"n": "Campinas", "uf": "SP", "x": 313.7, "y": 343.2}, "SBMT": {"n": "Campo de Marte", "uf": "SP", "x": 319.5, "y": 349.3}, "SBGL": {"n": "Galeão", "uf": "RJ", "x": 358.8, "y": 340.9}, "SBRJ": {"n": "Santos Dumont", "uf": "RJ", "x": 359.8, "y": 342.1}, "SBAF": {"n": "Afonsos", "uf": "RJ", "x": 357.3, "y": 341.6}, "SBSC": {"n": "Santa Cruz", "uf": "RJ", "x": 353.3, "y": 342.4}, "SBCF": {"n": "Confins", "uf": "MG", "x": 350.4, "y": 302.6}, "SBBH": {"n": "Pampulha", "uf": "MG", "x": 350.7, "y": 305.4}, "SBSV": {"n": "Salvador", "uf": "BA", "x": 410.8, "y": 221.8}, "SBRF": {"n": "Recife", "uf": "PE", "x": 455.3, "y": 164.8}, "SBFZ": {"n": "Fortaleza", "uf": "CE", "x": 413.5, "y": 112.6}, "SBNT": {"n": "Natal", "uf": "RN", "x": 451.5, "y": 138.1}, "SBSG": {"n": "São Gonçalo do Amarante", "uf": "RN", "x": 450.1, "y": 136.4}, "SBJP": {"n": "João Pessoa", "uf": "PB", "x": 455.0, "y": 153.0}, "SBMO": {"n": "Maceió", "uf": "AL", "x": 445.2, "y": 181.3}, "SBAR": {"n": "Aracaju", "uf": "SE", "x": 430.4, "y": 199.0}, "SBSL": {"n": "São Luís", "uf": "MA", "x": 347.3, "y": 98.2}, "SBTE": {"n": "Teresina", "uf": "PI", "x": 363.8, "y": 127.9}, "SBBE": {"n": "Belém", "uf": "PA", "x": 298.1, "y": 83.8}, "SBMQ": {"n": "Macapá", "uf": "AP", "x": 268.1, "y": 66.6}, "SBEG": {"n": "Manaus", "uf": "AM", "x": 164.0, "y": 103.7}, "SBMN": {"n": "Manaus Ponta Pelada", "uf": "AM", "x": 164.6, "y": 105.0}, "SBBV": {"n": "Boa Vista", "uf": "RR", "x": 156.6, "y": 33.0}, "SBPV": {"n": "Porto Velho", "uf": "RO", "x": 120.9, "y": 175.3}, "SBRB": {"n": "Rio Branco", "uf": "AC", "x": 73.0, "y": 185.6}, "SBCY": {"n": "Cuiabá", "uf": "MT", "x": 209.6, "y": 255.0}, "SBCG": {"n": "Campo Grande", "uf": "MS", "x": 226.4, "y": 312.8}, "SBGO": {"n": "Goiânia", "uf": "GO", "x": 289.6, "y": 266.8}, "SBPJ": {"n": "Palmas", "uf": "TO", "x": 299.5, "y": 190.7}, "SBCT": {"n": "Curitiba", "uf": "PR", "x": 290.0, "y": 373.6}, "SBBI": {"n": "Bacacheri", "uf": "PR", "x": 289.5, "y": 372.0}, "SBFL": {"n": "Florianópolis", "uf": "SC", "x": 297.3, "y": 399.2}, "SBPA": {"n": "Porto Alegre", "uf": "RS", "x": 267.0, "y": 427.1}, "SBCO": {"n": "Canoas", "uf": "RS", "x": 267.3, "y": 426.6}, "SBVT": {"n": "Vitória", "uf": "ES", "x": 393.1, "y": 310.3}, "SBCR": {"n": "Corumbá", "uf": "MS", "x": 195.8, "y": 297.2}, "SBFI": {"n": "Foz do Iguaçu", "uf": "PR", "x": 228.5, "y": 374.4}, "SBLO": {"n": "Londrina", "uf": "PR", "x": 267.4, "y": 347.2}, "SBMG": {"n": "Maringá", "uf": "PR", "x": 257.2, "y": 349.0}, "SBCA": {"n": "Cascavel", "uf": "PR", "x": 240.0, "y": 367.2}, "SBSM": {"n": "Santa Maria", "uf": "RS", "x": 237.8, "y": 423.7}, "SBPK": {"n": "Pelotas", "uf": "RS", "x": 253.5, "y": 447.8}, "SBUG": {"n": "Uruguaiana", "uf": "RS", "x": 198.9, "y": 424.6}, "SBBG": {"n": "Bagé", "uf": "RS", "x": 232.9, "y": 443.9}, "SBNF": {"n": "Navegantes", "uf": "SC", "x": 296.2, "y": 389.8}, "SBJV": {"n": "Joinville", "uf": "SC", "x": 294.4, "y": 381.8}, "SBCH": {"n": "Chapecó", "uf": "SC", "x": 249.7, "y": 392.8}, "SBLJ": {"n": "Lages", "uf": "SC", "x": 277.3, "y": 400.6}, "SBCX": {"n": "Caxias do Sul", "uf": "RS", "x": 266.6, "y": 417.6}, "SBPF": {"n": "Passo Fundo", "uf": "RS", "x": 253.5, "y": 406.1}, "SBUR": {"n": "Uberaba", "uf": "MG", "x": 304.1, "y": 304.3}, "SBUL": {"n": "Uberlândia", "uf": "MG", "x": 301.0, "y": 293.8}, "SBMK": {"n": "Montes Claros", "uf": "MG", "x": 352.2, "y": 267.7}, "SBIP": {"n": "Ipatinga", "uf": "MG", "x": 367.6, "y": 300.8}, "SBJF": {"n": "Juiz de Fora", "uf": "MG", "x": 357.1, "y": 328.7}, "SBBQ": {"n": "Barbacena", "uf": "MG", "x": 352.9, "y": 322.4}, "SBRP": {"n": "Ribeirão Preto", "uf": "SP", "x": 306.4, "y": 320.9}, "SBSJ": {"n": "São José dos Campos", "uf": "SP", "x": 328.5, "y": 346.0}, "SBSR": {"n": "São José do Rio Preto", "uf": "SP", "x": 287.4, "y": 317.0}, "SBBU": {"n": "Bauru", "uf": "SP", "x": 291.5, "y": 335.3}, "SBLN": {"n": "Lins", "uf": "SP", "x": 283.5, "y": 327.1}, "SBDN": {"n": "Presidente Prudente", "uf": "SP", "x": 264.1, "y": 333.4}, "SBGW": {"n": "Guaratinguetá", "uf": "SP", "x": 336.2, "y": 340.7}, "SBTA": {"n": "Taubaté", "uf": "SP", "x": 332.5, "y": 343.7}, "SBYS": {"n": "Campo Fontenelle", "uf": "SP", "x": 311.4, "y": 331.0}, "SBAU": {"n": "Araçatuba", "uf": "SP", "x": 275.5, "y": 320.9}, "SBSN": {"n": "Santarém", "uf": "PA", "x": 225.0, "y": 96.4}, "SBMA": {"n": "Marabá", "uf": "PA", "x": 290.5, "y": 131.6}, "SBHT": {"n": "Altamira", "uf": "PA", "x": 254.4, "y": 106.2}, "SBCJ": {"n": "Carajás", "uf": "PA", "x": 280.5, "y": 140.6}, "SBIH": {"n": "Itaituba", "uf": "PA", "x": 211.0, "y": 118.1}, "SBAA": {"n": "Conceição do Araguaia", "uf": "PA", "x": 281.6, "y": 157.7}, "SBIZ": {"n": "Imperatriz", "uf": "MA", "x": 310.0, "y": 133.6}, "SBPB": {"n": "Parnaíba", "uf": "PI", "x": 376.4, "y": 101.9}, "SBJU": {"n": "Juazeiro do Norte", "uf": "CE", "x": 404.9, "y": 153.8}, "SBPL": {"n": "Petrolina", "uf": "PE", "x": 389.8, "y": 179.5}, "SBFN": {"n": "Fernando de Noronha", "uf": "PE", "x": 484.3, "y": 113.4}, "SBKG": {"n": "Campina Grande", "uf": "PB", "x": 444.0, "y": 154.4}, "SBMS": {"n": "Mossoró", "uf": "RN", "x": 427.0, "y": 129.6}, "SBUF": {"n": "Paulo Afonso", "uf": "BA", "x": 416.7, "y": 180.0}, "SBVC": {"n": "Vitória da Conquista", "uf": "BA", "x": 386.5, "y": 245.5}, "SBIL": {"n": "Ilhéus", "uf": "BA", "x": 407.7, "y": 245.0}, "SBPS": {"n": "Porto Seguro", "uf": "BA", "x": 403.4, "y": 259.6}, "SBLE": {"n": "Lençóis", "uf": "BA", "x": 381.6, "y": 217.0}, "SBLP": {"n": "Bom Jesus da Lapa", "uf": "BA", "x": 356.9, "y": 226.3}, "SBTC": {"n": "Una", "uf": "BA", "x": 403.9, "y": 248.0}, "SBBW": {"n": "Barra do Garças", "uf": "MT", "x": 252.8, "y": 257.5}, "SBSO": {"n": "Sorriso", "uf": "MT", "x": 214.7, "y": 217.0}, "SBSI": {"n": "Sinop", "uf": "MT", "x": 215.7, "y": 209.8}, "SBAT": {"n": "Alta Floresta", "uf": "MT", "x": 209.8, "y": 185.6}, "SBCN": {"n": "Caldas Novas", "uf": "GO", "x": 296.6, "y": 279.8}, "SBAN": {"n": "Anápolis", "uf": "GO", "x": 292.9, "y": 262.0}, "SBPP": {"n": "Ponta Porã", "uf": "MS", "x": 214.5, "y": 337.8}, "SBDO": {"n": "Dourados", "uf": "MS", "x": 223.4, "y": 333.6}, "SBTG": {"n": "Três Lagoas", "uf": "MS", "x": 256.3, "y": 315.2}, "SBPN": {"n": "Porto Nacional", "uf": "TO", "x": 299.0, "y": 195.8}, "SBCZ": {"n": "Cruzeiro do Sul", "uf": "AC", "x": 16.6, "y": 158.4}, "SBTT": {"n": "Tabatinga", "uf": "AM", "x": 49.4, "y": 118.2}, "SBTF": {"n": "Tefé", "uf": "AM", "x": 109.9, "y": 107.8}, "SBUA": {"n": "São Gabriel da Cachoeira", "uf": "AM", "x": 83.6, "y": 69.0}, "SBOI": {"n": "Oiapoque", "uf": "AP", "x": 259.7, "y": 20.9}, "SBVH": {"n": "Vilhena", "uf": "RO", "x": 158.8, "y": 216.5}, "SBJI": {"n": "Ji-Paraná", "uf": "RO", "x": 143.2, "y": 197.6}, "SBCP": {"n": "Campos dos Goytacazes", "uf": "RJ", "x": 381.4, "y": 327.6}, "SBME": {"n": "Macaé", "uf": "RJ", "x": 375.9, "y": 335.3}};


const REGIAO_UF = Object.fromEntries(ESTADOS_BR.map((e) => [e.uf, e.regiao]));

// Mapa do Brasil com as localidades atendidas como destino (partindo de Brasília)
function MapaBrasil({ voos }) {
  const [hover, setHover] = useState('');

  const info = useMemo(() => {
    const destinos = {};
    const estados = {};
    const regioes = {};
    const semPosicao = {};
    const exterior = {};
    voos.forEach((v) => {
      const todos = destinosDaRota(v.rota);
      const usarMapa = todos.length > 1;
      const ufsVoo = new Set();
      const regsVoo = new Set();
      todos.forEach((c) => {
        if (c === 'SBBR') return;
        const pax = usarMapa ? Number(v.pax_destinos?.[c]) || 0 : Number(v.pax) || 0;
        const ap = AEROPORTOS[c];
        if (!ap) {
          const alvo = /^S[BDIJNSW]/.test(c) ? semPosicao : exterior;
          alvo[c] = (alvo[c] || 0) + 1;
          return;
        }
        const d = (destinos[c] = destinos[c] || { codigo: c, ...ap, voos: 0, pax: 0 });
        d.voos += 1;
        d.pax += pax;
        const e = (estados[ap.uf] = estados[ap.uf] || { voos: 0, pax: 0, locais: {} });
        if (!ufsVoo.has(ap.uf)) {
          ufsVoo.add(ap.uf);
          e.voos += 1;
        }
        e.pax += pax;
        e.locais[c] = (e.locais[c] || 0) + 1;
        const reg = REGIAO_UF[ap.uf];
        const g = (regioes[reg] = regioes[reg] || { voos: 0, pax: 0 });
        if (!regsVoo.has(reg)) {
          regsVoo.add(reg);
          g.voos += 1;
        }
        g.pax += pax;
      });
    });
    return { destinos, estados, regioes, semPosicao, exterior };
  }, [voos]);

  const { destinos, estados, regioes, semPosicao, exterior } = info;
  const lista = useMemo(() => Object.values(destinos).sort((a, b) => b.voos - a.voos || b.pax - a.pax), [destinos]);
  const maxD = Math.max(1, ...lista.map((d) => d.voos));
  const maxE = Math.max(1, ...Object.values(estados).map((e) => e.voos));
  const ordem = useMemo(() => [...ESTADOS_BR].sort((a, b) => Number(a.uf === hover) - Number(b.uf === hover)), [hover]);

  const eh = hover ? ESTADOS_BR.find((e) => e.uf === hover) : null;
  const est = hover ? estados[hover] : null;
  const reg = eh ? regioes[eh.regiao] : null;

  const curva = (d) => {
    const dx = d.x - BRASILIA.x;
    const dy = d.y - BRASILIA.y;
    const dist = Math.hypot(dx, dy) || 1;
    let nx = -dy / dist;
    let ny = dx / dist;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const k = dist * 0.22;
    const cx = (BRASILIA.x + d.x) / 2 + nx * k;
    const cy = (BRASILIA.y + d.y) / 2 + ny * k;
    return `M${BRASILIA.x} ${BRASILIA.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${d.x} ${d.y}`;
  };

  const listaTxt = (o) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c} (${n})`)
      .join(', ');

  return (
    <div className={`${C.painel} space-y-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={C.titulo}>
          <Plane size={14} /> Destinos atendidos — Brasil
        </div>
        <span className="font-mono text-[11px] uppercase text-slate-400">
          {lista.length} destinos · linhas partem de Brasília (SBBR)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
        <div className={`${C.caixa} p-2`}>
          <svg viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="mx-auto w-full max-w-[560px]">
            {ordem.map((e) => {
              const dado = estados[e.uf];
              const ativo = hover === e.uf;
              const inten = dado ? 0.22 + 0.5 * (dado.voos / maxE) : 0;
              const fill = ativo
                ? dado
                  ? 'rgba(56,189,248,0.85)'
                  : '#24405f'
                : dado
                ? `rgba(56,189,248,${inten.toFixed(2)})`
                : '#0f1b30';
              return (
                <g
                  key={e.uf}
                  onMouseEnter={() => setHover(e.uf)}
                  onMouseLeave={() => setHover('')}
                  onClick={() => setHover((h) => (h === e.uf ? '' : e.uf))}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={e.d}
                    fill={fill}
                    stroke={ativo ? '#bae6fd' : '#334155'}
                    strokeWidth={ativo ? 1.6 : 0.8}
                    strokeLinejoin="round"
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      transform: ativo ? 'scale(1.045)' : 'scale(1)',
                      transition: 'transform .2s ease, fill .2s ease',
                      filter: ativo ? 'drop-shadow(0 0 6px rgba(56,189,248,.55))' : 'none'
                    }}
                  />
                  <path d={e.d} fill="none" stroke="transparent" strokeWidth="9" pointerEvents="stroke" />
                </g>
              );
            })}

            <g pointerEvents="none">
              {ESTADOS_BR.filter((e) => e.uf !== 'DF').map((e) => (
                <text
                  key={e.uf}
                  x={e.cx}
                  y={e.cy + 2.5}
                  textAnchor="middle"
                  fontSize={hover === e.uf ? 10 : 7.5}
                  fontWeight={hover === e.uf ? 700 : 500}
                  fill={hover === e.uf ? '#f1f5f9' : '#64748b'}
                >
                  {e.uf}
                </text>
              ))}
            </g>

            <g pointerEvents="none" fill="none" strokeLinecap="round">
              {lista.map((d) => (
                <path
                  key={d.codigo}
                  d={curva(d)}
                  className="mapa-linha"
                  stroke={hover && d.uf === hover ? '#fde68a' : '#7dd3fc'}
                  strokeWidth={0.8 + 1.8 * (d.voos / maxD)}
                  opacity={hover ? (d.uf === hover ? 1 : 0.12) : 0.6}
                />
              ))}
            </g>

            <g pointerEvents="none">
              {lista.map((d) => (
                <circle key={d.codigo} cx={d.x} cy={d.y} r={2.2 + 2.2 * (d.voos / maxD)} fill="#34d399" stroke="#064e3b" strokeWidth="0.8" />
              ))}
              {lista.slice(0, 14).map((d) => (
                <text
                  key={`t-${d.codigo}`}
                  x={d.x + 4}
                  y={d.y - 3.5}
                  fontSize="7"
                  fill="#e2e8f0"
                  stroke="#050a16"
                  strokeWidth="2"
                  paintOrder="stroke"
                >
                  {d.codigo}
                </text>
              ))}
              <circle cx={BRASILIA.x} cy={BRASILIA.y} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
              <circle cx={BRASILIA.x} cy={BRASILIA.y} r="4" fill="none" stroke="#fbbf24" strokeWidth="1">
                <animate attributeName="r" values="4;12;4" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <text x={BRASILIA.x + 7} y={BRASILIA.y + 12} fontSize="8" fontWeight="700" fill="#fde68a" stroke="#050a16" strokeWidth="2" paintOrder="stroke">
                BRASÍLIA
              </text>
            </g>
          </svg>
        </div>

        <div className="min-w-0 space-y-4">
          <div className={`${C.caixa} min-h-[160px] space-y-3 p-4`}>
            {eh ? (
              <>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/80">Estado em destaque</div>
                  <div className="text-base font-extrabold uppercase text-white">
                    {eh.uf} — {eh.nome}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Caixa rotulo="Estado · voos" valor={est ? est.voos : 0} destaque />
                  <Caixa rotulo="Estado · pax" valor={est ? est.pax : 0} destaque />
                  <Caixa rotulo={`Região ${eh.regiao} · voos`} valor={reg ? reg.voos : 0} />
                  <Caixa rotulo={`Região ${eh.regiao} · pax`} valor={reg ? reg.pax : 0} />
                </div>
                <p className="text-[11px] uppercase text-slate-400">
                  {est ? `Destinos: ${listaTxt(est.locais)}` : 'Sem voos para este estado nos filtros atuais.'}
                </p>
              </>
            ) : (
              <>
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/80">Resumo</div>
                <p className="text-xs text-slate-300">
                  Passe o mouse (ou toque) sobre um estado para destacá-lo e ver o total dele e da região. Quanto mais forte a cor do
                  estado e mais grossa a linha, mais voos foram para lá.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((r) => (
                    <Caixa key={r} rotulo={r} valor={`${regioes[r]?.voos || 0} voos`} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-500/80">Principais destinos</div>
            {lista.length === 0 ? (
              <p className="text-xs uppercase text-slate-500">Nenhum destino encontrado para os filtros atuais.</p>
            ) : (
              <div className={`${C.caixa} divide-y divide-slate-800`}>
                {lista.slice(0, 10).map((d) => (
                  <div
                    key={d.codigo}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                    onMouseEnter={() => setHover(d.uf)}
                    onMouseLeave={() => setHover('')}
                  >
                    <span className="min-w-0 truncate">
                      <b className="font-mono text-sky-300">{d.codigo}</b>{' '}
                      <span className="uppercase text-slate-300">{d.n} · {d.uf}</span>
                    </span>
                    <span className="shrink-0 font-mono text-slate-300">{d.voos} voos · {d.pax} pax</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {Object.keys(semPosicao).length > 0 && (
            <p className="text-[11px] text-slate-500">
              Sem posição no mapa (aeroporto ainda não cadastrado na lista AEROPORTOS): {listaTxt(semPosicao)}
            </p>
          )}
          {Object.keys(exterior).length > 0 && (
            <p className="text-[11px] text-slate-500">Destinos no exterior (fora do mapa): {listaTxt(exterior)}</p>
          )}
        </div>
      </div>
    </div>
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
          <MultiSelecao
            rotulo="Filtrar pax por localidade / destino"
            opcoes={localidades}
            valor={filtro.rascunho.locais}
            onChange={(v) => filtro.setRascunho({ ...filtro.rascunho, locais: v })}
            todasRotulo="TODAS AS LOCALIDADES"
          />
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

      <MapaBrasil voos={filtrados} />
    </div>
  );
}

function TelaPainel({ voos, aeronaves, onEditar, onApagar }) {
  const filtro = useFiltro();
  const lista = useMemo(() => filtrarVoos(voos, filtro.aplicado), [voos, filtro.aplicado]);
  const pag = usePaginas(lista, JSON.stringify(filtro.aplicado));
  const comAtencao = useMemo(() => lista.filter((v) => pendenciasSalvo(v).length > 0).length, [lista]);
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
      <div className={`${C.painel} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
        <h3 className="text-xs font-bold uppercase text-white">Painel de registo de voos — Posto CAN BR</h3>
        <div className="flex flex-wrap items-center gap-3">
          {comAtencao > 0 && (
            <span className="alerta-piscar flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-950/60 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-300">
              <AlertTriangle size={13} /> {comAtencao} {comAtencao === 1 ? 'voo precisa' : 'voos precisam'} de atenção
            </span>
          )}
          <span className="font-mono text-[11px] uppercase text-slate-400">{lista.length} registos</span>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="py-10 text-center text-xs uppercase text-slate-500">Nenhum voo encontrado.</p>
      ) : (
        <>
          <div className="space-y-3">
            {pag.itens.map((v) => (
              <TiraVoo key={v.id} v={v} onEditar={onEditar} onApagar={onApagar} />
            ))}
          </div>
          <BarraPaginas p={pag} />
        </>
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
  const [prev, setPrev] = useState(voo?.lista_prevista || '');
  const [real, setReal] = useState(voo?.lista_real || '');
  const [paxDest, setPaxDest] = useState(() =>
    Object.fromEntries(Object.entries(voo?.pax_destinos || {}).map(([k, x]) => [k, String(x)]))
  );
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const pendente = useRef(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setHora = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(/[^\d:]/g, '').slice(0, 5) }));
  const fecharHora = (k) => () => setF((s) => ({ ...s, [k]: normHora(s[k]) }));
  const mudarRota = (e) => setF((s) => ({ ...s, rota: formatarRota(e.target.value, s.rota) }));
  const fecharRotaCampo = () => setF((s) => ({ ...s, rota: fecharRota(s.rota) }));

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

  // PAX por destino (só quando a rota tem mais de um destino)
  const destinos = useMemo(() => destinosDaRota(f.rota), [f.rota]);
  const multi = destinos.length > 1;
  const somaDest = destinos.reduce((s, c) => s + (Number(paxDest[c]) || 0), 0);
  const paxTotal = Number(f.pax) || 0;
  const divergente = multi && somaDest !== paxTotal;
  const paxDestinos = multi ? Object.fromEntries(destinos.map((c) => [c, Number(paxDest[c]) || 0])) : {};

  const listaPend = pendenciasVoo({
    rota: f.rota,
    pax: f.pax,
    hora_chamada: normHora(f.hora_chamada),
    hora_decolagem: normHora(f.hora_decolagem),
    hora_real: normHora(f.hora_real),
    peso_pax: f.peso_pax,
    peso_bagagem: f.peso_bagagem,
    qtd_bagagens: f.qtd_bagagens,
    nomes_previsto: cruz.total_previsto,
    nomes_real: (cruz.embarcados || 0) + (cruz.extras || 0),
    pax_destinos: paxDestinos
  });

  const montarDados = () => ({
    aeronave: f.aeronave || aeronaves[0]?.modelo,
    matricula: f.matricula.trim().toUpperCase(),
    rota: fecharRota(f.rota.trim().toUpperCase()),
    data_voo: f.data_voo,
    hora_chamada: normHora(f.hora_chamada),
    hora_decolagem: normHora(f.hora_decolagem),
    hora_real: normHora(f.hora_real),
    pax: Number(f.pax) || 0,
    peso_pax: Number(f.peso_pax) || 0,
    peso_bagagem: Number(f.peso_bagagem) || 0,
    total_peso: totalPeso,
    qtd_bagagens: Number(f.qtd_bagagens) || 0,
    lista_prevista: prev.toUpperCase(),
    lista_real: real.toUpperCase(),
    pax_destinos: paxDestinos,
    ...cruz
  });

  const salvar = async (dados) => {
    setSalvando(true);
    await onSalvar(dados, voo?.id);
    setSalvando(false);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const dados = montarDados();
    if (!dados.aeronave) return avisar('Cadastre uma aeronave antes de adicionar voos.', 'erro');
    if (listaPend.length > 0) {
      pendente.current = dados;
      setAlerta({
        tipo: 'aviso',
        titulo: 'Voo não está totalmente preenchido',
        texto: 'Foram encontradas as pendências abaixo. Deseja salvar mesmo assim?',
        itens: listaPend,
        botao: 'Salvar mesmo assim',
        botaoCancelar: 'Voltar e corrigir'
      });
      return;
    }
    await salvar(dados);
  };

  const num = (k) => ({ type: 'number', min: '0', inputMode: 'numeric', className: C.input, value: f[k], onChange: set(k), placeholder: '0' });
  const hora = (k, ph) => ({ className: C.input, value: f[k], onChange: setHora(k), onBlur: fecharHora(k), placeholder: ph, inputMode: 'numeric' });

  return (
    <>
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
            <input className={C.input} value={f.rota} onChange={mudarRota} onBlur={fecharRotaCampo} placeholder="SBBR-SBGR-SBGL" />
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

        {multi && (
          <div className={`${C.caixa} space-y-3 p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase text-sky-400">PAX por destino</span>
              <span className={`font-mono text-xs font-bold ${divergente ? 'text-amber-400' : 'text-emerald-400'}`}>
                Soma dos destinos: {somaDest} · PAX total: {paxTotal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {destinos.map((c) => (
                <Campo key={c} rotulo={c}>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className={C.input}
                    value={paxDest[c] ?? ''}
                    onChange={(e) => setPaxDest((s) => ({ ...s, [c]: e.target.value }))}
                    placeholder="0"
                  />
                </Campo>
              ))}
            </div>
            {divergente && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-700 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  ALERTA: a soma dos PAX por destino ({somaDest}) é diferente do PAX total ({paxTotal}).
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-sky-400">
              <FileText size={13} /> 1. Copiar & colar relação principal
            </div>
            <p className="mb-2 text-[10px] text-slate-500">Patentes (2S, SGT, CEL) são ignoradas no cruzamento de nomes</p>
            <textarea rows="5" className={C.input} value={prev} onChange={(e) => setPrev(e.target.value)} placeholder={'2S JOAO DA SILVA\nSGT MARIA OLIVEIRA\nCEL CARLOS SOUZA'} />
            <p className={`mt-1 text-[10px] ${contarNomes(prev) === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{contarNomes(prev)} nomes</p>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-400">
              <Users size={13} /> 2. Copiar & colar efetivamente embarcados
            </div>
            <p className="mb-2 text-[10px] text-slate-500">O nome limpo coincidirá mesmo se omitir a patente nesta lista</p>
            <textarea rows="5" className={C.input} value={real} onChange={(e) => setReal(e.target.value)} placeholder={'JOAO DA SILVA\nMARIA OLIVEIRA\nNOVO PASSAGEIRO'} />
            <p className={`mt-1 text-[10px] ${contarNomes(real) === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{contarNomes(real)} nomes</p>
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

      <Modal
        dados={alerta}
        onCancelar={() => setAlerta(null)}
        onConfirmar={async () => {
          setAlerta(null);
          await salvar(pendente.current);
        }}
      />
    </>
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
  const pag = usePaginas(lista, JSON.stringify(filtro.aplicado));
  const total = somar(lista, 'desembarcados');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mudarRota = (e) => setF((s) => ({ ...s, rota: formatarRota(e.target.value, s.rota) }));
  const fecharRotaCampo = () => setF((s) => ({ ...s, rota: fecharRota(s.rota) }));

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
        rota: fecharRota(f.rota.trim().toUpperCase()),
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
            <input className={C.input} value={f.rota} onChange={mudarRota} onBlur={fecharRotaCampo} placeholder="SBGR-SBBR" />
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
        <>
          <div className="space-y-3">
            {pag.itens.map((d) => (
              <TiraDesemb key={d.id} d={d} onEditar={editar} onApagar={onApagar} />
            ))}
          </div>
          <BarraPaginas p={pag} />
        </>
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
        <span className="text-slate-500">Sistema PCAN-BR — Controlo operacional</span>
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

function TelaUsuarios({ usuario, usuarios, onSenha, onCriar, onRemover, onResetar }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('operador');
  const [resetId, setResetId] = useState(null);
  const [senhaReset, setSenhaReset] = useState('');

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
  const gerarTemp = () => {
    const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint32Array(8));
    setSenhaReset(Array.from(bytes, (n) => alfabeto[n % alfabeto.length]).join(''));
  };
  const abrirReset = (u) => {
    setResetId((atual) => (atual === u.id ? null : u.id));
    setSenhaReset('');
  };
  const salvarReset = async (u) => {
    if (await onResetar(u, senhaReset)) {
      setResetId(null);
      setSenhaReset('');
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
      </form>

      <div className={`${C.painel} space-y-3 p-6`}>
        <h3 className="text-xs font-bold uppercase text-white">Utilizadores com acesso ao sistema ({usuarios.length})</h3>
        {usuarios.map((u) => (
          <div key={u.id} className={`${C.caixa} px-3 py-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold uppercase text-sky-300">{u.nome}</div>
                <div className="mt-0.5 text-[11px] uppercase text-slate-400">
                  Último acesso:{' '}
                  <span className="font-mono text-white">{u.ultimo_acesso ? fmtTs(u.ultimo_acesso) : 'nunca acessou'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded border border-sky-800 bg-sky-950/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-sky-300">
                  {u.perfil === 'admin' ? 'Admin' : 'Operador'}
                </span>
                <button
                  type="button"
                  onClick={() => abrirReset(u)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase text-amber-400 hover:text-amber-300"
                >
                  <KeyRound size={13} /> Redefinir senha
                </button>
                {u.id !== usuario.id && (
                  <button type="button" onClick={() => onRemover(u)} className="text-rose-400 hover:text-rose-300" title="Remover">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            {resetId === u.id && (
              <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                <div className="text-[11px] uppercase text-slate-400">Nova senha para {u.nome} (mínimo 6 caracteres)</div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${C.input} sem-caixa min-w-[160px] flex-1`}
                    value={senhaReset}
                    onChange={(e) => setSenhaReset(e.target.value)}
                    placeholder="Digite ou gere uma senha"
                  />
                  <button type="button" onClick={gerarTemp} className={C.botaoSec}>Gerar senha</button>
                  <button type="button" onClick={() => salvarReset(u)} className={C.botao}>Salvar</button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Anote e repasse a nova senha ao utilizador. Depois de salvar ela não poderá ser consultada novamente.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
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

function TelaHistorico({ historico }) {
  const [tabela, setTabela] = useState('');
  const [autor, setAutor] = useState('');
  const [mostrar, setMostrar] = useState(30);
  const autores = useMemo(() => [...new Set(historico.map((h) => h.usuario))].sort(), [historico]);
  const lista = useMemo(
    () => historico.filter((h) => (!tabela || h.tabela === tabela) && (!autor || h.usuario === autor)),
    [historico, tabela, autor]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Clock size={15} /> Histórico de alterações — quem alterou, quando e o quê
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="Tipo de registo">
            <select className={C.input} value={tabela} onChange={(e) => setTabela(e.target.value)}>
              <option value="">TODOS</option>
              <option value="voos">VOOS</option>
              <option value="desembarques">DESEMBARQUES</option>
              <option value="aeronaves">AERONAVES</option>
              <option value="usuarios">UTILIZADORES</option>
            </select>
          </Campo>
          <Campo rotulo="Feito por">
            <select className={C.input} value={autor} onChange={(e) => setAutor(e.target.value)}>
              <option value="">TODOS</option>
              {autores.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
        </div>
        <p className="text-[11px] text-slate-500">Mostra as últimas 300 alterações registadas.</p>
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-xs uppercase text-slate-500">Nenhuma alteração registada.</p>
      ) : (
        <div className="space-y-3">
          {lista.slice(0, mostrar).map((h) => {
            const alts = Array.isArray(h.alteracoes) ? h.alteracoes : [];
            return (
              <div key={h.id} className={`${C.painel} space-y-2 px-5 py-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${COR_ACAO[h.acao] || 'border-slate-600 text-slate-300'}`}>
                      {h.acao}
                    </span>
                    <span className="text-xs font-bold uppercase text-sky-300">{ROTULO_TABELA[h.tabela] || h.tabela}</span>
                    <span className="text-xs uppercase text-white">{h.resumo}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {fmtTs(h.criado_em)} · <b className="text-white">{h.usuario}</b>
                  </span>
                </div>
                {alts.length > 0 && (
                  <ul className="space-y-1 border-t border-slate-800 pt-2 text-xs">
                    {alts.map((d) => (
                      <li key={d.campo} className="flex flex-wrap items-center gap-x-2 text-slate-300">
                        <b className="uppercase text-slate-400">{d.campo}:</b>
                        {d.texto ? (
                          <span>{d.texto}</span>
                        ) : (
                          <>
                            <span className="font-mono text-rose-300 line-through">{d.de}</span>
                            <span>→</span>
                            <span className="font-mono text-emerald-300">{d.para}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {lista.length > mostrar && (
            <button onClick={() => setMostrar((m) => m + 30)} className={`${C.botaoSec} w-full`}>
              Mostrar mais ({lista.length - mostrar} restantes)
            </button>
          )}
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
  { id: 'historico', rotulo: 'Histórico', Icone: Clock },
  { id: 'usuarios', rotulo: 'Utilizadores', Icone: Users, admin: true },
  { id: 'lixeira', rotulo: 'Lixeira', Icone: Trash2, admin: true }
];

// Colunas leves dos voos (as listas de nomes só são buscadas ao editar um voo)
const VOO_COLS =
  'id,aeronave,matricula,rota,data_voo,hora_chamada,hora_decolagem,hora_real,pax,peso_pax,peso_bagagem,total_peso,qtd_bagagens,total_previsto,embarcados,faltas,extras,desembarcados,pax_destinos,ultima_alt_por,ultima_alt_em,excluido,excluido_em,excluido_por,criado_em';

// O Supabase devolve no máximo 1000 linhas por consulta: busca em páginas até trazer tudo
const buscarTudo = async (montar) => {
  const tam = 1000;
  let todos = [];
  for (let i = 0; i < 100; i += 1) {
    const { data, error } = await montar().range(i * tam, i * tam + tam - 1);
    if (error) return { data: null, error };
    todos = todos.concat(data);
    if (data.length < tam) break;
  }
  return { data: todos, error: null };
};

// Atualização incremental: só o registo que mudou é trocado na lista (economiza tráfego do Supabase)
const cmpDataVoo = (a, b) =>
  String(b.data_voo || '').localeCompare(String(a.data_voo || '')) || String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
const cmpHistorico = (a, b) => String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
const cmpNome = (a, b) => String(a.modelo ?? a.nome ?? '').localeCompare(String(b.modelo ?? b.nome ?? ''));
const mesclar = (lista, linha, cmp, limite) => {
  const nova = [...lista.filter((x) => x.id !== linha.id), linha].sort(cmp);
  return limite ? nova.slice(0, limite) : nova;
};
const semId = (lista, id) => lista.filter((x) => x.id !== id);
const semListas = ({ lista_prevista, lista_real, ...resto }) => resto;
const semSenha = ({ senha_hash, ...resto }) => resto;

export default function App() {
  const [usuario, setUsuario] = useState(() => lerLocal('flightops_sessao', null));
  const [aba, setAba] = useState('dashboard');
  const [menuAberto, setMenuAberto] = useState(() => window.innerWidth >= 1024);
  const [voos, setVoos] = useState([]);
  const [desembarques, setDesembarques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(false);
  const [vooEditando, setVooEditando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const timerAviso = useRef(null);
  const bootstrapFeito = useRef(false);
  const acessoRegistrado = useRef(false);
  const ultimaCarga = useRef(0);

  const avisar = useCallback((texto, tipo = 'ok') => {
    setAviso({ texto, tipo });
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 4000);
  }, []);

  /* ---------- carregar dados + sincronização em tempo real ---------- */
  const carregarTudo = useCallback(async () => {
    if (!supabase) return;
    try {
      const [v, d, a, u, h] = await Promise.all([
        buscarTudo(() => supabase.from('voos').select(VOO_COLS).order('data_voo', { ascending: false }).order('criado_em', { ascending: false }).order('id')),
        buscarTudo(() => supabase.from('desembarques').select('*').order('data_voo', { ascending: false }).order('criado_em', { ascending: false }).order('id')),
        supabase.from('aeronaves').select('*').order('modelo'),
        supabase.from('usuarios').select('id,nome,perfil,criado_em,ultimo_acesso').order('nome'),
        supabase.from('historico').select('*').order('criado_em', { ascending: false }).limit(300)
      ]);
      if (v.error || d.error || a.error || u.error || h.error) {
        setOnline(false);
        return;
      }
      setVoos(v.data);
      setDesembarques(d.data);
      setAeronaves(a.data);
      setUsuarios(u.data);
      setHistorico(h.data);
      ultimaCarga.current = Date.now();
      setOnline(true);
      setCarregando(false);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    carregarTudo();
    let conectouAntes = false;
    const tratar = (aoMudar, aoApagar) => (p) => {
      if (p.eventType === 'DELETE') aoApagar(p.old?.id);
      else aoMudar(p.new);
    };
    const canal = supabase
      .channel('flightops-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voos' },
        tratar((r) => setVoos((l) => mesclar(l, semListas(r), cmpDataVoo)), (id) => setVoos((l) => semId(l, id))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desembarques' },
        tratar((r) => setDesembarques((l) => mesclar(l, r, cmpDataVoo)), (id) => setDesembarques((l) => semId(l, id))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aeronaves' },
        tratar((r) => setAeronaves((l) => mesclar(l, r, cmpNome)), (id) => setAeronaves((l) => semId(l, id))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' },
        tratar((r) => setUsuarios((l) => mesclar(l, semSenha(r), cmpNome)), (id) => setUsuarios((l) => semId(l, id))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico' },
        tratar((r) => setHistorico((l) => mesclar(l, r, cmpHistorico, 300)), (id) => setHistorico((l) => semId(l, id))))
      .subscribe((status) => {
        // Se a ligação em tempo real cair e voltar, recarrega tudo uma vez para não perder nada
        if (status === 'SUBSCRIBED') {
          if (conectouAntes) carregarTudo();
          conectouAntes = true;
        }
      });
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaCarga.current > 120000) carregarTudo();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('online', carregarTudo);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') carregarTudo();
    }, 600000); // rede de segurança a cada 10 minutos
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

  /* ---------- regista o último acesso de quem entra no sistema ---------- */
  useEffect(() => {
    if (!supabase || !usuario || acessoRegistrado.current) return;
    acessoRegistrado.current = true;
    supabase
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuario.id)
      .then(() => {});
  }, [usuario]);

  const sair = useCallback(() => {
    setUsuario(null);
    gravarLocal('flightops_sessao', null);
    setAba('dashboard');
    acessoRegistrado.current = false;
  }, []);

  // Se o utilizador logado foi removido, encerra a sessão
  useEffect(() => {
    if (usuario && !carregando && usuarios.length > 0 && !usuarios.some((u) => u.id === usuario.id)) sair();
  }, [usuario, usuarios, carregando, sair]);

  const ativos = useMemo(() => voos.filter((v) => !v.excluido), [voos]);
  const lixeira = useMemo(() => voos.filter((v) => v.excluido), [voos]);
  const ehAdmin = usuario?.perfil === 'admin';
  const ultima = historico[0];

  /* ---------- ações ---------- */
  // "log" (opcional) grava a alteração na aba Histórico
  const gravar = async (consulta, msgOk, log, aplicar) => {
    const { data, error } = await consulta;
    if (error) {
      avisar(error.code === '23505' ? 'Já existe um registo com esse nome.' : `Erro: ${error.message}`, 'erro');
      return false;
    }
    if (aplicar) aplicar(data);
    if (log) {
      const l = typeof log === 'function' ? log(data) : log;
      const { data: h } = await supabase.from('historico').insert({ usuario: usuario.nome, ...l }).select().single();
      if (h) setHistorico((lista) => mesclar(lista, h, cmpHistorico, 300));
    }
    if (msgOk) avisar(msgOk);
    return true;
  };
  const aplicarVoo = (row) => row && setVoos((l) => mesclar(l, row, cmpDataVoo));
  const aplicarDesemb = (row) => row && setDesembarques((l) => mesclar(l, row, cmpDataVoo));
  const aplicarAeronave = (row) => row && setAeronaves((l) => mesclar(l, row, cmpNome));
  const aplicarUsuario = (row) => row && setUsuarios((l) => mesclar(l, row, cmpNome));
  const agora = () => new Date().toISOString();
  const carimbo = () => ({ ultima_alt_por: usuario.nome, ultima_alt_em: agora() });

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

  // Confere utilizador e senha sem entrar no sistema
  const verificarSenha = async (nome, senha) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('senha_hash')
      .eq('nome', nome.trim().toUpperCase())
      .maybeSingle();
    if (error) return 'erro';
    if (!data) return 'invalida';
    return (await hashSenha(nome, senha)) === data.senha_hash ? 'ok' : 'invalida';
  };

  const salvarVoo = async (dados, id) => {
    const payload = { ...dados, ...carimbo() };
    let ok;
    if (id) {
      const antes = vooEditando && vooEditando.id === id ? vooEditando : voos.find((v) => v.id === id);
      const depois = { ...antes, ...payload };
      ok = await gravar(supabase.from('voos').update(payload).eq('id', id).select(VOO_COLS).single(), 'Voo atualizado.', {
        acao: 'alterou', tabela: 'voos', registro_id: id, resumo: resumoVoo(depois), alteracoes: diferencas(antes, depois)
      }, aplicarVoo);
    } else {
      ok = await gravar(supabase.from('voos').insert(payload).select(VOO_COLS).single(), 'Voo guardado.', (row) => ({
        acao: 'incluiu', tabela: 'voos', registro_id: row.id, resumo: resumoVoo(row)
      }), aplicarVoo);
    }
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
          supabase.from('voos').update({ excluido: true, excluido_em: agora(), excluido_por: usuario.nome }).eq('id', v.id).select(VOO_COLS).single(),
          'Voo movido para a Lixeira.',
          { acao: 'excluiu', tabela: 'voos', registro_id: v.id, resumo: `${resumoVoo(v)} → movido para a lixeira` },
          aplicarVoo
        )
    });

  const restaurarVoo = (v) =>
    gravar(
      supabase.from('voos').update({ excluido: false, excluido_em: null, excluido_por: null, ...carimbo() }).eq('id', v.id).select(VOO_COLS).single(),
      'Voo restaurado.',
      { acao: 'restaurou', tabela: 'voos', registro_id: v.id, resumo: `${resumoVoo(v)} → restaurado da lixeira` },
      aplicarVoo
    );

  const pedirExclusaoDefinitiva = (v) =>
    setConfirmacao({
      titulo: 'Excluir definitivamente?',
      texto: `O voo ${v.aeronave} de ${fmtData(v.data_voo)} será apagado para sempre. Esta ação não pode ser desfeita.`,
      botao: 'Excluir definitivamente',
      aoConfirmar: () =>
        gravar(supabase.from('voos').delete().eq('id', v.id), 'Voo excluído definitivamente.', {
          acao: 'excluiu', tabela: 'voos', registro_id: v.id, resumo: `${resumoVoo(v)} → excluído definitivamente`
        }, () => setVoos((l) => semId(l, v.id)))
    });

  const salvarDesemb = (dados, id) => {
    const payload = { ...dados, ...carimbo() };
    if (id) {
      const antes = desembarques.find((d) => d.id === id);
      const depois = { ...antes, ...payload };
      return gravar(supabase.from('desembarques').update(payload).eq('id', id).select().single(), 'Desembarque atualizado.', {
        acao: 'alterou', tabela: 'desembarques', registro_id: id, resumo: resumoDesemb(depois), alteracoes: diferencas(antes, depois)
      }, aplicarDesemb);
    }
    return gravar(supabase.from('desembarques').insert(payload).select().single(), 'Voo de desembarque incluído.', (row) => ({
      acao: 'incluiu', tabela: 'desembarques', registro_id: row.id, resumo: resumoDesemb(row)
    }), aplicarDesemb);
  };

  const pedirExclusaoDesemb = (d) =>
    setConfirmacao({
      titulo: 'Excluir desembarque?',
      texto: `Excluir o registo de ${d.desembarcados} desembarcados do voo ${d.aeronave} de ${fmtData(d.data_voo)}? Esta ação não pode ser desfeita.`,
      botao: 'Sim, excluir',
      aoConfirmar: () =>
        gravar(supabase.from('desembarques').delete().eq('id', d.id), 'Registo excluído.', {
          acao: 'excluiu', tabela: 'desembarques', registro_id: d.id, resumo: resumoDesemb(d)
        }, () => setDesembarques((l) => semId(l, d.id)))
    });

  const adicionarAeronave = (modelo) =>
    gravar(supabase.from('aeronaves').insert({ modelo }).select().single(), 'Aeronave adicionada.', (row) => ({
      acao: 'incluiu', tabela: 'aeronaves', registro_id: row.id, resumo: modelo
    }), aplicarAeronave);
  const pedirRemoverAeronave = (a) =>
    setConfirmacao({
      titulo: 'Remover aeronave?',
      texto: `Remover ${a.modelo} da lista? Os voos já registados com este modelo não são alterados.`,
      botao: 'Sim, remover',
      aoConfirmar: () =>
        gravar(supabase.from('aeronaves').delete().eq('id', a.id), 'Aeronave removida.', {
          acao: 'excluiu', tabela: 'aeronaves', registro_id: a.id, resumo: a.modelo
        }, () => setAeronaves((l) => semId(l, a.id)))
    });

  const trocarSenha = async (nova) => {
    if (nova.length < 6) {
      avisar('A senha deve ter no mínimo 6 caracteres.', 'erro');
      return false;
    }
    const senha_hash = await hashSenha(usuario.nome, nova);
    return gravar(supabase.from('usuarios').update({ senha_hash }).eq('id', usuario.id), 'Senha atualizada.', {
      acao: 'alterou', tabela: 'usuarios', registro_id: usuario.id, resumo: `Senha de ${usuario.nome} alterada`
    });
  };
  // Só o administrador redefine a senha de outro utilizador (a senha antiga nunca é exibida)
  const resetarSenha = async (u, nova) => {
    if (!ehAdmin) return false;
    if (nova.length < 6) {
      avisar('A senha deve ter no mínimo 6 caracteres.', 'erro');
      return false;
    }
    const senha_hash = await hashSenha(u.nome, nova);
    return gravar(supabase.from('usuarios').update({ senha_hash }).eq('id', u.id), `Senha de ${u.nome} redefinida.`, {
      acao: 'alterou', tabela: 'usuarios', registro_id: u.id, resumo: `Senha de ${u.nome} redefinida pelo administrador`
    });
  };
  const criarUsuario = async (nome, senha, perfil) => {
    if (senha.length < 6) {
      avisar('A senha deve ter no mínimo 6 caracteres.', 'erro');
      return false;
    }
    const senha_hash = await hashSenha(nome, senha);
    const nomeFinal = nome.trim().toUpperCase();
    return gravar(supabase.from('usuarios').insert({ nome: nomeFinal, senha_hash, perfil }).select('id,nome,perfil,criado_em,ultimo_acesso').single(), 'Utilizador cadastrado.', {
      acao: 'incluiu', tabela: 'usuarios', resumo: `${nomeFinal} (${perfil === 'admin' ? 'administrador' : 'operador'})`
    }, aplicarUsuario);
  };
  const pedirRemoverUsuario = (u) =>
    setConfirmacao({
      titulo: 'Remover utilizador?',
      texto: `${u.nome} deixará de conseguir entrar no sistema.`,
      botao: 'Sim, remover',
      aoConfirmar: () =>
        gravar(supabase.from('usuarios').delete().eq('id', u.id), 'Utilizador removido.', {
          acao: 'excluiu', tabela: 'usuarios', registro_id: u.id, resumo: u.nome
        }, () => setUsuarios((l) => semId(l, u.id)))
    });

  const ir = (id) => {
    if (id === 'adicionar') setVooEditando(null);
    setAba(id);
    if (window.innerWidth < 1024) setMenuAberto(false);
  };
  // Ao editar, busca as listas de nomes do voo (não vêm na lista geral)
  const editar = async (v) => {
    const { data } = await supabase.from('voos').select('lista_prevista,lista_real').eq('id', v.id).maybeSingle();
    setVooEditando({ ...v, lista_prevista: data?.lista_prevista || '', lista_real: data?.lista_real || '' });
    setAba('adicionar');
  };

  /* ---------- renderização ---------- */
  if (!supabaseConfigurado) return <TelaConfig />;
  if (!usuario) return <TelaLogin onEntrar={entrar} onVerificar={verificarSenha} online={online} />;

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
                PCAN<span className="text-sky-400">-BR</span>
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
                {abaAtual === 'historico' && <TelaHistorico historico={historico} />}
                {abaAtual === 'usuarios' && (
                  <TelaUsuarios
                    usuario={usuario}
                    usuarios={usuarios}
                    onSenha={trocarSenha}
                    onCriar={criarUsuario}
                    onRemover={pedirRemoverUsuario}
                    onResetar={resetarSenha}
                  />
                )}
                {abaAtual === 'lixeira' && <TelaLixeira voos={lixeira} onRestaurar={restaurarVoo} onExcluirDef={pedirExclusaoDefinitiva} />}
              </>
            )}
          </main>
        </div>

        {/* RODAPÉ: criador e última alteração */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-800 bg-[#0a1120] px-4 py-2 text-[11px] uppercase tracking-wide text-slate-400">
          <span>
            {NOME_APP} · Criado por <b className="text-sky-300">{CRIADOR}</b>
          </span>
          <button
            onClick={() => ir('historico')}
            className="flex min-w-0 items-center gap-2 text-left hover:text-white"
            title="Ver histórico de alterações"
          >
            <Clock size={12} className="shrink-0" />
            {ultima ? (
              <span className="max-w-[70vw] truncate">
                Última alteração: <b className="text-white">{ultima.usuario}</b>{' '}
                <span className="font-mono text-sky-300">({fmtTs(ultima.criado_em)})</span> — {ultima.acao}{' '}
                {ROTULO_TABELA[ultima.tabela] || ultima.tabela}: {ultima.resumo}
              </span>
            ) : (
              <span>Nenhuma alteração registada</span>
            )}
          </button>
        </footer>

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
            className={`fixed bottom-14 right-4 z-50 max-w-xs rounded-xl border px-4 py-3 text-xs font-bold shadow-xl ${
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
