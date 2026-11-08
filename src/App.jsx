import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, Database, PlusCircle, UserCheck, Plane, Printer, Users, ChevronLeft,
  Menu, LogOut, Filter, PieChart, Pencil, Trash2, CalendarDays, Zap,
  ShieldCheck, KeyRound, UserPlus, RotateCcw, FileText, AlertTriangle
} from 'lucide-react';
import { supabase, supabaseConfigurado } from './supabase.js';

/* ================================================================
   ESTILOS REUTILIZÁVEIS
   ================================================================ */
const C = {
  painel: 'rounded-2xl border border-slate-800 bg-[#0c1424]',
  caixa: 'rounded-xl border border-slate-800 bg-[#050a16]',
  input:
    'w-full rounded-xl border border-slate-800 bg-[#050a16] px-3 py-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 [color-scheme:dark]',
  label: 'block mb-1.5 text-[11px] uppercase tracking-wide text-slate-400',
  botao:
    'rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wide px-4 py-3 transition',
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
  if (d < 0) d += 1440;
  return d;
};

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

const FILTRO_VAZIO = { aeronave: '', inicial: '', final: '', data: '', mes: '', local: '', desemb: '' };
const codigosRota = (rota) => (rota || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);

const filtrarVoos = (lista, f) =>
  lista.filter((v) => {
    if (f.aeronave && v.aeronave !== f.aeronave) return false;
    if (f.inicial && v.data_voo < f.inicial) return false;
    if (f.final && v.data_voo > f.final) return false;
    if (f.data && v.data_voo !== f.data) return false;
    if (f.mes && !v.data_voo.startsWith(f.mes)) return false;
    if (f.local && !codigosRota(v.rota).includes(f.local)) return false;
    if (f.desemb === 'com' && !(v.desembarcados > 0)) return false;
    if (f.desemb === 'sem' && v.desembarcados > 0) return false;
    return true;
  });

const somar = (lista, campo) => lista.reduce((s, v) => s + (Number(v[campo]) || 0), 0);

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

function CartaoMetrica({ titulo, total, unidade, tema, dados }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  return (
    <div className={`${C.painel} p-5`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-300">{titulo}</span>
        <span className={`font-mono text-xl font-extrabold ${tema.texto}`}>
          {total}
          {unidade && <small className="ml-1 text-base">{unidade}</small>}
        </span>
      </div>
      <div className={`${C.caixa} mt-4 flex h-40 items-end justify-center gap-4 overflow-x-auto px-4 pt-3`}>
        {dados.length === 0 ? (
          <span className="self-center text-[11px] uppercase text-slate-600">Sem dados</span>
        ) : (
          dados.map((d) => (
            <div key={d.rotulo} className="flex h-full min-w-[48px] flex-col items-center justify-end pb-1">
              <div
                className={`flex w-12 items-center justify-center rounded-t-lg bg-gradient-to-b ${tema.barra} font-mono text-[10px] font-bold text-slate-900`}
                style={{ height: `${Math.max((d.valor / max) * 78, 14)}%` }}
              >
                {d.valor}
              </div>
              <span className="max-w-[60px] truncate pt-1 text-[9px] uppercase text-slate-500">{d.rotulo}</span>
            </div>
          ))
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
    <div className="flex min-h-screen items-center justify-center bg-[#050a16] p-4 text-slate-200">
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
          <input type="password" className={C.input} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
        </Campo>
        {erro && <p className="text-xs font-bold text-rose-400">{erro}</p>}
        {!online && <p className="text-xs text-amber-400">A ligar ao servidor… se demorar, verifique a internet.</p>}
        <button type="submit" disabled={ocupado} className={`${C.botao} w-full`}>
          {ocupado ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function TelaDashboard({ voos, aeronaves }) {
  const [f, setF] = useState(FILTRO_VAZIO);
  const [mostrarEstat, setMostrarEstat] = useState(false);
  const filtrados = useMemo(() => filtrarVoos(voos, f), [voos, f]);

  const localidades = useMemo(
    () => [...new Set(voos.flatMap((v) => codigosRota(v.rota)))].filter((c) => c !== 'SBBR').sort(),
    [voos]
  );

  const grupos = useMemo(() => {
    const m = {};
    filtrados.forEach((v) => {
      if (!m[v.aeronave]) m[v.aeronave] = { aeronave: v.aeronave, lista: [] };
      m[v.aeronave].lista.push(v);
    });
    return Object.values(m).map((g) => {
      const efs = g.lista
        .map((v) => calcEfetividade(v.hora_chamada, v.hora_decolagem, v.hora_real))
        .filter((e) => e !== null);
      return {
        aeronave: g.aeronave,
        voos: g.lista.length,
        pax: somar(g.lista, 'pax'),
        desemb: somar(g.lista, 'desembarcados'),
        pesoPax: somar(g.lista, 'peso_pax'),
        bagagem: somar(g.lista, 'peso_bagagem'),
        total: somar(g.lista, 'total_peso'),
        ef: efs.length ? Math.round((efs.reduce((a, b) => a + b, 0) / efs.length) * 10) / 10 : null
      };
    });
  }, [filtrados]);

  const dados = (campo) => grupos.map((g) => ({ rotulo: g.aeronave.split(' ')[0], valor: g[campo] }));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Filter size={14} /> Filtros operacionais — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={f} setF={setF} aeronaves={aeronaves} />
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 lg:grid-cols-2">
          <Campo rotulo="Filtrar pax por localidade / destino">
            <select className={C.input} value={f.local} onChange={set('local')}>
              <option value="">TODAS AS LOCALIDADES (GERAL)</option>
              {localidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Filtrar por status de desembarque">
            <select className={C.input} value={f.desemb} onChange={set('desemb')}>
              <option value="">TODOS OS VOOS</option>
              <option value="com">COM DESEMBARQUE REGISTRADO</option>
              <option value="sem">SEM DESEMBARQUE REGISTRADO</option>
            </select>
          </Campo>
        </div>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CartaoMetrica titulo="Total de voos" total={filtrados.length} tema={TEMAS.sky} dados={dados('voos')} />
        <CartaoMetrica titulo="Total de passageiros (PAX)" total={somar(filtrados, 'pax')} tema={TEMAS.emerald} dados={dados('pax')} />
        <CartaoMetrica titulo="Total desembarcados" total={somar(filtrados, 'desembarcados')} tema={TEMAS.cyan} dados={dados('desemb')} />
        <CartaoMetrica titulo="Peso total pax" total={somar(filtrados, 'peso_pax')} unidade="KG" tema={TEMAS.indigo} dados={dados('pesoPax')} />
        <CartaoMetrica titulo="Peso total de bagagem" total={somar(filtrados, 'peso_bagagem')} unidade="KG" tema={TEMAS.amber} dados={dados('bagagem')} />
        <CartaoMetrica titulo="Peso total transp." total={somar(filtrados, 'total_peso')} unidade="KG" tema={TEMAS.rose} dados={dados('total')} />
      </div>
    </div>
  );
}

function TelaPainel({ voos, aeronaves, onEditar, onApagar }) {
  const [f, setF] = useState(FILTRO_VAZIO);
  const lista = useMemo(() => filtrarVoos(voos, f), [voos, f]);
  return (
    <div className="space-y-6">
      <div className={`${C.painel} space-y-4 p-5`}>
        <div className={C.titulo}>
          <Filter size={14} /> Filtros operacionais — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={f} setF={setF} aeronaves={aeronaves} />
        </div>
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

function TelaDesembarque({ voos, aeronaves, onSalvar, avisar }) {
  const [f, setF] = useState(FILTRO_VAZIO);
  const [vooId, setVooId] = useState('');
  const [qtd, setQtd] = useState('');
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);

  const filtrados = useMemo(() => filtrarVoos(voos, f), [voos, f]);
  const selecionado = useMemo(() => voos.find((v) => v.id === vooId), [voos, vooId]);

  useEffect(() => {
    if (selecionado) {
      setQtd(String(selecionado.desembarcados ?? ''));
      setObs(selecionado.obs_desembarque || '');
    } else {
      setQtd('');
      setObs('');
    }
  }, [selecionado]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!vooId) return avisar('Selecione um voo.', 'erro');
    setSalvando(true);
    await onSalvar(vooId, {
      desembarcados: Number(qtd) || 0,
      obs_desembarque: obs.trim()
    });
    setSalvando(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={enviar} className={`${C.painel} space-y-4 p-6`}>
        <div className={C.titulo}>
          <UserCheck size={16} /> Registo de desembarque — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CamposFiltro f={f} setF={setF} aeronaves={aeronaves} />
        </div>
        <Campo rotulo="Selecionar voo">
          <select className={C.input} value={vooId} onChange={(e) => setVooId(e.target.value)} required>
            <option value="">SELECIONE O VOO</option>
            {filtrados.map((v) => (
              <option key={v.id} value={v.id}>
                {v.data_voo} | {v.aeronave} ({v.rota || 'Sem rota'}) - PAX: {v.pax}
              </option>
            ))}
          </select>
        </Campo>
        {selecionado && (
          <div className={`${C.caixa} grid grid-cols-3 gap-2 p-3 text-center`}>
            <Caixa rotulo="Pax previstos" valor={selecionado.pax} />
            <Caixa rotulo="Embarcados" valor={selecionado.embarcados} />
            <Caixa rotulo="Destino" valor={selecionado.rota} />
          </div>
        )}
        <Campo rotulo="Quantidade de desembarcados em BSB">
          <input type="number" min="0" className={C.input} value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="0" required />
        </Campo>
        <Campo rotulo="Observações de desembarque">
          <textarea rows="3" className={C.input} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: Passageiros em trânsito para hotel de trânsito..." />
        </Campo>
        <button type="submit" disabled={salvando} className={`${C.botao} w-full`}>
          {salvando ? 'A guardar…' : 'Registar desembarque'}
        </button>
      </form>
    </div>
  );
}

function TelaRelatorios({ voos, aeronaves }) {
  const [f, setF] = useState(FILTRO_VAZIO);
  const filtrados = useMemo(() => filtrarVoos(voos, f), [voos, f]);

  return (
    <div className="space-y-6">
      <div className={`${C.painel} space-y-4 p-5 print:hidden`}>
        <div className={C.titulo}>
          <Printer size={15} /> Relatórios operacionais — Posto CAN BR
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CamposFiltro f={f} setF={setF} aeronaves={aeronaves} />
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={() => window.print()} className={`${C.botao} flex items-center gap-2`}>
            <Printer size={14} /> Imprimir / Gerar PDF
          </button>
        </div>
      </div>

      <div className={`${C.painel} space-y-6 p-8 text-slate-100 print:border-none print:bg-white print:text-black print:p-0`}>
        <div className="border-b border-slate-800 pb-4 print:border-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-extrabold uppercase print:text-black">Posto CAN BR — Base Aérea de Brasília</h1>
              <p className="text-xs uppercase text-slate-400 print:text-gray-600">Relatório Consolidado de Tráfego Aéreo</p>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 print:text-gray-600">
              Gerado em: {fmtTs(new Date().toISOString())}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#050a16] p-4 text-center print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] uppercase text-slate-400 print:text-gray-600">Total de voos</div>
            <div className="font-mono text-xl font-bold text-sky-400 print:text-black">{filtrados.length}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#050a16] p-4 text-center print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] uppercase text-slate-400 print:text-gray-600">Total PAX</div>
            <div className="font-mono text-xl font-bold text-emerald-400 print:text-black">{somar(filtrados, 'pax')}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#050a16] p-4 text-center print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] uppercase text-slate-400 print:text-gray-600">Peso Total</div>
            <div className="font-mono text-xl font-bold text-indigo-400 print:text-black">{somar(filtrados, 'total_peso')} KG</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#050a16] p-4 text-center print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] uppercase text-slate-400 print:text-gray-600">Bagagens</div>
            <div className="font-mono text-xl font-bold text-amber-400 print:text-black">{somar(filtrados, 'qtd_bagagens')}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 print:border-black print:text-black">
                {['Data', 'Aeronave', 'Matr.', 'Rota', 'Chamada', 'Decolagem', 'Real', 'Pax', 'Peso (kg)'].map((h) => (
                  <th key={h} className="px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono print:text-black">
              {filtrados.length === 0 ? (
                <tr><td colSpan="9" className="px-2 py-6 text-center text-slate-500">Nenhum registo para os filtros selecionados.</td></tr>
              ) : (
                filtrados.map((v) => (
                  <tr key={v.id} className="border-b border-slate-800/60 print:border-gray-300">
                    <td className="px-2 py-2">{fmtData(v.data_voo)}</td>
                    <td className="px-2 py-2 font-bold">{v.aeronave}</td>
                    <td className="px-2 py-2">{v.matricula || '—'}</td>
                    <td className="px-2 py-2">{v.rota || '—'}</td>
                    <td className="px-2 py-2">{v.hora_chamada || '--:--'}</td>
                    <td className="px-2 py-2">{v.hora_decolagem || '--:--'}</td>
                    <td className="px-2 py-2">{v.hora_real || '--:--'}</td>
                    <td className="px-2 py-2">{v.pax}</td>
                    <td className="px-2 py-2">{v.total_peso}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TelaUtilizadores({ usuarios, aeronaves, onSalvarUsuario, onApagarUsuario, onSalvarAeronave, onApagarAeronave, usuarioAtual, avisar }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('user');
  const [novaAero, setNovaAero] = useState('');
  const [salvandoU, setSalvandoU] = useState(false);
  const [salvandoA, setSalvandoA] = useState(false);

  const criarUsuario = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !senha) return avisar('Preencha utilizador e senha.', 'erro');
    setSalvandoU(true);
    await onSalvarUsuario(nome.trim(), senha, perfil);
    setNome('');
    setSenha('');
    setSalvandoU(false);
  };

  const criarAeronave = async (e) => {
    e.preventDefault();
    if (!novaAero.trim()) return avisar('Digite o modelo da aeronave.', 'erro');
    setSalvandoA(true);
    await onSalvarAeronave(novaAero.trim());
    setNovaAero('');
    setSalvandoA(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className={`${C.painel} space-y-6 p-6`}>
        <div className={C.titulo}>
          <Users size={16} /> Gestão de utilizadores
        </div>
        <form onSubmit={criarUsuario} className="space-y-4 border-b border-slate-800 pb-6">
          <Campo rotulo="Novo utilizador (login)">
            <input className={C.input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="EX: SGT SILVA" autoCapitalize="characters" required />
          </Campo>
          <Campo rotulo="Senha de acesso">
            <input type="password" className={C.input} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
          </Campo>
          <Campo rotulo="Perfil de acesso">
            <select className={C.input} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              <option value="user">Operador (Padrão)</option>
              <option value="admin">Administrador</option>
            </select>
          </Campo>
          <button type="submit" disabled={salvandoU} className={`${C.botao} w-full`}>
            {salvandoU ? 'A criar…' : 'Criar utilizador'}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-300">Utilizadores registados</h3>
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div key={u.id} className={`${C.caixa} flex items-center justify-between p-3`}>
                <div>
                  <span className="font-bold uppercase text-white">{u.login}</span>
                  <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase text-sky-400">
                    {u.perfil === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </div>
                {u.login !== 'CAIO' && u.login !== usuarioAtual.login && (
                  <button onClick={() => onApagarUsuario(u.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${C.painel} space-y-6 p-6`}>
        <div className={C.titulo}>
          <Plane size={16} /> Gestão de aeronaves FAB
        </div>
        <form onSubmit={criarAeronave} className="space-y-4 border-b border-slate-800 pb-6">
          <Campo rotulo="Modelo da aeronave">
            <input className={C.input} value={novaAero} onChange={(e) => setNovaAero(e.target.value)} placeholder="EX: C-130 HERCULES" autoCapitalize="characters" required />
          </Campo>
          <button type="submit" disabled={salvandoA} className={`${C.botao} w-full`}>
            {salvandoA ? 'A adicionar…' : 'Adicionar aeronave'}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-300">Aeronaves disponíveis</h3>
          <div className="space-y-2">
            {aeronaves.map((a) => (
              <div key={a.id} className={`${C.caixa} flex items-center justify-between p-3`}>
                <span className="font-bold uppercase text-sky-400">{a.modelo}</span>
                <button onClick={() => onApagarAeronave(a.id)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [configurado, setConfigurado] = useState(supabaseConfigurado);
  const [online, setOnline] = useState(true);
  const [usuario, setUsuario] = useState(() => lerLocal('flightops_usuario', null));
  const [tela, setTela] = useState('dashboard');
  const [voos, setVoos] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [menuMob, setMenuMob] = useState(false);

  const avisar = (txt, tipo = 'sucesso') => {
    setToast({ txt, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const carregarDados = useCallback(async () => {
    if (!configurado) return;
    try {
      setOnline(true);
      const [{ data: v }, { data: a }, { data: u }] = await Promise.all([
        supabase.from('voos').select('*').order('data_voo', { ascending: false }),
        supabase.from('aeronaves').select('*').order('modelo'),
        supabase.from('usuarios').select('*').order('login')
      ]);
      if (v) setVoos(v);
      if (a) setAeronaves(a);
      if (u) setUsuarios(u);
    } catch {
      setOnline(false);
      avisar('Erro ao ligar ao servidor Supabase.', 'erro');
    }
  }, [configurado]);

  useEffect(() => {
    if (!configurado) return;
    carregarDados();

    const canal = supabase
      .channel('mudancas-globais')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        carregarDados();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [configurado, carregarDados]);

  const entrar = async (loginTxt, senhaTxt) => {
    const l = loginTxt.trim().toUpperCase();
    if (!l || !senhaTxt) return 'Preencha utilizador e senha.';
    try {
      const hash = await hashSenha(l, senhaTxt);
      const { data, error } = await supabase.from('usuarios').select('*').eq('login', l).eq('senha', hash).single();
      if (error || !data) return 'Utilizador ou senha incorretos.';
      setUsuario(data);
      gravarLocal('flightops_usuario', data);
      avisar(`Bem-vindo, ${data.login}!`);
      return null;
    } catch {
      return 'Erro ao autenticar. Verifique a ligação.';
    }
  };

  const sair = () => {
    setUsuario(null);
    gravarLocal('flightops_usuario', null);
    setTela('dashboard');
    avisar('Sessão encerrada.');
  };

  const salvarVoo = async (dadosVoo, id) => {
    const payload = {
      ...dadosVoo,
      ultima_alt_por: usuario?.login || 'SISTEMA',
      ultima_alt_em: new Date().toISOString()
    };
    if (id) {
      const { error } = await supabase.from('voos').update(payload).eq('id', id);
      if (error) return avisar('Erro ao atualizar voo.', 'erro');
      avisar('Voo atualizado com sucesso!');
      setEditando(null);
    } else {
      const { error } = await supabase.from('voos').insert([payload]);
      if (error) return avisar('Erro ao registar voo.', 'erro');
      avisar('Voo registado com sucesso!');
    }
    setTela('painel');
    carregarDados();
  };

  const salvarDesembarque = async (id, dadosDesemb) => {
    const payload = {
      ...dadosDesemb,
      ultima_alt_por: usuario?.login || 'SISTEMA',
      ultima_alt_em: new Date().toISOString()
    };
    const { error } = await supabase.from('voos').update(payload).eq('id', id);
    if (error) return avisar('Erro ao registar desembarque.', 'erro');
    avisar('Desembarque registado com sucesso!');
    setTela('painel');
    carregarDados();
  };

  const apagarVooConfirmado = async (v) => {
    const { error } = await supabase.from('voos').delete().eq('id', v.id);
    if (error) return avisar('Erro ao apagar voo.', 'erro');
    avisar('Voo apagado com sucesso!');
    setModal(null);
    carregarDados();
  };

  const salvarUtilizador = async (loginTxt, senhaTxt, perfilTxt) => {
    const login = loginTxt.toUpperCase();
    const hash = await hashSenha(login, senhaTxt);
    const { error } = await supabase.from('usuarios').insert([{ login, senha: hash, perfil: perfilTxt }]);
    if (error) return avisar('Erro ao criar utilizador (login já existe?).', 'erro');
    avisar('Utilizador criado com sucesso!');
    carregarDados();
  };

  const apagarUtilizador = async (id) => {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return avisar('Erro ao apagar utilizador.', 'erro');
    avisar('Utilizador apagado com sucesso!');
    carregarDados();
  };

  const salvarAeronave = async (modeloTxt) => {
    const modelo = modeloTxt.toUpperCase();
    const { error } = await supabase.from('aeronaves').insert([{ modelo }]);
    if (error) return avisar('Erro ao adicionar aeronave (já existe?).', 'erro');
    avisar('Aeronave adicionada com sucesso!');
    carregarDados();
  };

  const apagarAeronave = async (id) => {
    const { error } = await supabase.from('aeronaves').delete().eq('id', id);
    if (error) return avisar('Erro ao apagar aeronave.', 'erro');
    avisar('Aeronave apagada com sucesso!');
    carregarDados();
  };

  if (!configurado) return <TelaConfig />;
  if (!usuario) return <TelaLogin onEntrar={entrar} online={online} />;

  const menus = [
    { id: 'dashboard', rotulo: 'Dashboard', icone: BarChart3 },
    { id: 'painel', rotulo: 'Painel de voos
