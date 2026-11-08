// ... existing code ...
import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Plane,
  Briefcase,
  Trash2,
  Edit2,
  AlertCircle,
  Sun,
  Moon,
  Scale,
  PlusCircle,
  Check,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  Activity
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Lista de Voos Cadastrados Manualmente
  const [voos, setVoos] = useState([]);

  // Estado para Edição de Voo
  const [editandoId, setEditandoId] = useState(null);

  // Frota Oficial da Força Aérea Brasileira (FAB) customizável
  const [frotaAeronaves, setFrotaAeronaves] = useState([
    { id: '1', modelo: 'C-95 Bandeirante', matriculaPadrao: 'FAB 2301' },
    { id: '2', modelo: 'C-97 Brasília', matriculaPadrao: 'FAB 2350' },
    { id: '3', modelo: 'C-98 Caravan', matriculaPadrao: 'FAB 2720' },
    { id: '4', modelo: 'C-99 (ERJ-145)', matriculaPadrao: 'FAB 2591' },
    { id: '5', modelo: 'C-105 Amazonas (C-295)', matriculaPadrao: 'FAB 2701' },
    { id: '6', modelo: 'C-130 Hércules', matriculaPadrao: 'FAB 2101' },
    { id: '7', modelo: 'KC-390 Millennium', matriculaPadrao: 'FAB 2850' },
    { id: '8', modelo: 'KC-30 (A330-200)', matriculaPadrao: 'FAB 2801' },
    { id: '9', modelo: 'VC-2 (ERJ-190)', matriculaPadrao: 'FAB 2590' },
    { id: '10', modelo: 'H-36 Caracal', matriculaPadrao: 'FAB 2230' }
  ]);

  // Formulário para nova aeronave
  const [novaAeronave, setNovaAeronave] = useState({ modelo: '', matriculaPadrao: '' });

  // Estados dos Filtros Temporários e Aplicados
  const [filtroProjetoTemp, setFiltroProjetoTemp] = useState('todos');
  const [filtroDataTemp, setFiltroDataTemp] = useState('');
  const [filtroDataInicioTemp, setFiltroDataInicioTemp] = useState('');
  const [filtroDataFimTemp, setFiltroDataFimTemp] = useState('');
  const [filtroMesTemp, setFiltroMesTemp] = useState('todos');
  const [filtroAnoTemp, setFiltroAnoTemp] = useState('todos');

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    projeto: 'todos',
    data: '',
    dataInicio: '',
    dataFim: '',
    mes: 'todos',
    ano: 'todos'
  });

  // Estado do Formulário de Voo Manual
  const [formData, setFormData] = useState({
    projeto: 'C-99',
    modeloAeronave: 'C-99 (ERJ-145)',
    matricula: 'FAB 2591',
    rota: 'SBBR - SBGL',
    dataVoo: '2026-11-05',
    horarioChamada: '16:00',
    horarioDecolagem: '17:00',
    horarioEmbarqueReal: '17:10',
    totalPax: 48,
    pesoPax: 3876,
    pesoBagagem: 529,
    totalPeso: 4405,
    qtyBagagem: 17,
    textoListaPrevista: '',
    textoListaRealizada: ''
  });

  // Mapeamento automático de Projeto para Aeronave e Matrícula
  const associarProjetoComAeronave = (proj) => {
    const pUpper = proj.toUpperCase();
    let modeloMatch = 'C-99 (ERJ-145)';
    let matMatch = 'FAB 2591';

    if (pUpper.includes('C-95')) {
      modeloMatch = 'C-95 Bandeirante';
      matMatch = 'FAB 2301';
    } else if (pUpper.includes('C-97')) {
      modeloMatch = 'C-97 Brasília';
      matMatch = 'FAB 2350';
    } else if (pUpper.includes('C-98')) {
      modeloMatch = 'C-98 Caravan';
      matMatch = 'FAB 2720';
    } else if (pUpper.includes('C-99')) {
      modeloMatch = 'C-99 (ERJ-145)';
      matMatch = 'FAB 2591';
    } else if (pUpper.includes('C-105') || pUpper.includes('C295')) {
      modeloMatch = 'C-105 Amazonas (C-295)';
      matMatch = 'FAB 2701';
    } else if (pUpper.includes('C-130') || pUpper.includes('HERCULES')) {
      modeloMatch = 'C-130 Hércules';
      matMatch = 'FAB 2101';
    } else if (pUpper.includes('KC-390') || pUpper.includes('390')) {
      modeloMatch = 'KC-390 Millennium';
      matMatch = 'FAB 2850';
    } else if (pUpper.includes('KC-30') || pUpper.includes('A330')) {
      modeloMatch = 'KC-30 (A330-200)';
      matMatch = 'FAB 2801';
    } else if (pUpper.includes('VC-2')) {
      modeloMatch = 'VC-2 (ERJ-190)';
      matMatch = 'FAB 2590';
    } else if (pUpper.includes('H-36')) {
      modeloMatch = 'H-36 Caracal';
      matMatch = 'FAB 2230';
    }

    return { modeloMatch, matMatch };
  };

  const horaParaMinutos = (horaStr) => {
    if (!horaStr || !horaStr.includes(':')) return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const calcularEficiencia = (chamada, embarqueReal) => {
    const minChamada = horaParaMinutos(chamada);
    const minReal = horaParaMinutos(embarqueReal);
    if (minReal <= 0 || minChamada <= 0) return 100;
    const razao = (minChamada / minReal) * 100;
    return Math.min(Math.max(Number(razao.toFixed(1)), 10), 150);
  };

  const comparativoManifesto = useMemo(() => {
    const parseNomes = (texto) => {
      if (!texto) return [];
      return texto
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0)
        .map(n => n.toUpperCase());
    };

    const previstos = parseNomes(formData.textoListaPrevista);
    const realizados = parseNomes(formData.textoListaRealizada);

    if (previstos.length === 0 && realizados.length === 0) {
      return { comparativo: [], presentes: 0, faltaram: 0, novos: 0, taxaFalta: 0 };
    }

    const setRealizados = new Set(realizados);
    const setPrevistos = new Set(previstos);

    const comparativo = [];
    let presentes = 0;
    let faltaram = 0;
    let novos = 0;

    previstos.forEach(nome => {
      const presente = setRealizados.has(nome);
      if (presente) {
        presentes++;
        comparativo.push({ nome, status: 'PRESENTE' });
      } else {
        faltaram++;
        comparativo.push({ nome, status: 'FALTOU' });
      }
    });

    realizados.forEach(nome => {
      if (!setPrevistos.has(nome)) {
        novos++;
        comparativo.push({ nome, status: 'PAX NOVO' });
      }
    });

    const totalPrevistos = previstos.length || 1;
    const taxaFalta = Number(((faltaram / totalPrevistos) * 100).toFixed(1));

    return {
      comparativo,
      presentes,
      faltaram,
      novos,
      taxaFalta
    };
  }, [formData.textoListaPrevista, formData.textoListaRealizada]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'projeto') {
        const { modeloMatch, matMatch } = associarProjetoComAeronave(value);
        updated.modeloAeronave = modeloMatch;
        updated.matricula = matMatch;
      }

      if (name === 'pesoPax' || name === 'pesoBagagem') {
        const pPax = name === 'pesoPax' ? (Number(value) || 0) : Number(prev.pesoPax);
        const pBag = name === 'pesoBagagem' ? (Number(value) || 0) : Number(prev.pesoBagagem);
        updated.totalPeso = pPax + pBag;
      }
      return updated;
    });
  };

  const handleModeloChange = (e) => {
    const modeloSelecionado = e.target.value;
    const aeronaveEncontrada = frotaAeronaves.find(a => a.modelo === modeloSelecionado);
    setFormData(prev => ({
      ...prev,
      modeloAeronave: modeloSelecionado,
      matricula: aeronaveEncontrada ? aeronaveEncontrada.matriculaPadrao : prev.matricula
    }));
  };

  const handleSubmitVoo = (e) => {
    e.preventDefault();
    const pPax = Number(formData.pesoPax) || 0;
    const pBag = Number(formData.pesoBagagem) || 0;
    const tPeso = Number(formData.totalPeso) || (pPax + pBag);
    const ef = calcularEficiencia(formData.horarioChamada, formData.horarioEmbarqueReal || formData.horarioDecolagem);

    const dadosVoo = {
      id: editandoId ? editandoId : `voo-${Date.now()}`,
      projeto: formData.projeto.trim().toUpperCase() || 'GERAL',
      modeloAeronave: formData.modeloAeronave,
      matricula: formData.matricula.trim() || 'S/M',
      rota: formData.rota.trim() || 'SBBR - SBBR',
      dataVoo: formData.dataVoo,
      horarioChamada: formData.horarioChamada || '00:00',
      horarioDecolagem: formData.horarioDecolagem || '00:00',
      horarioEmbarqueReal: formData.horarioEmbarqueReal || formData.horarioDecolagem || '00:00',
      eficiencia: ef,
      totalPax: Number(formData.totalPax) || 0,
      pesoPax: pPax,
      pesoBagagem: pBag,
      totalPeso: tPeso,
      qtyBagagem: Number(formData.qtyBagagem) || 0,
      manifestoComparativo: comparativoManifesto
    };

    if (editandoId) {
      setVoos(prev => prev.map(v => v.id === editandoId ? dadosVoo : v));
      setEditandoId(null);
    } else {
      setVoos(prev => [dadosVoo, ...prev]);
    }

    setActiveTab('dashboard');
  };

  const handleAddAeronave = (e) => {
    e.preventDefault();
    if (!novaAeronave.modelo.trim()) return;
    const item = {
      id: `aero-${Date.now()}`,
      modelo: novaAeronave.modelo.trim(),
      matriculaPadrao: novaAeronave.matriculaPadrao.trim() || 'FAB S/M'
    };
    setFrotaAeronaves(prev => [...prev, item]);
    setNovaAeronave({ modelo: '', matriculaPadrao: '' });
  };

  const removerAeronave = (id) => {
    setFrotaAeronaves(prev => prev.filter(a => a.id !== id));
  };

  const iniciarEdicao = (voo) => {
    setFormData({
      projeto: voo.projeto,
      modeloAeronave: voo.modeloAeronave,
      matricula: voo.matricula,
      rota: voo.rota,
      dataVoo: voo.dataVoo,
      horarioChamada: voo.horarioChamada,
      horarioDecolagem: voo.horarioDecolagem,
      horarioEmbarqueReal: voo.horarioEmbarqueReal || voo.horarioDecolagem,
      totalPax: voo.totalPax,
      pesoPax: voo.pesoPax,
      pesoBagagem: voo.pesoBagagem,
      totalPeso: voo.totalPeso,
      qtyBagagem: voo.qtyBagagem,
      textoListaPrevista: voo.manifestoComparativo ? voo.manifestoComparativo.comparativo.filter(c => c.status !== 'PAX NOVO').map(c => c.nome).join('\n') : '',
      textoListaRealizada: voo.manifestoComparativo ? voo.manifestoComparativo.comparativo.filter(c => c.status === 'PRESENTE' || c.status === 'PAX NOVO').map(c => c.nome).join('\n') : ''
    });
    setEditandoId(voo.id);
    setActiveTab('registro');
  };

  const excluirVoo = (id) => {
    setVoos(prev => prev.filter(v => v.id !== id));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      projeto: filtroProjetoTemp,
      data: filtroDataTemp,
      mes: filtroMesTemp,
      ano: filtroAnoTemp
    });
  };

  const limparFiltros = () => {
    setFiltroProjetoTemp('todos');
    setFiltroDataTemp('');
    setFiltroDataInicioTemp('');
    setFiltroDataFimTemp('');
    setFiltroMesTemp('todos');
    setFiltroAnoTemp('todos');
    setFiltrosAplicados({
      projeto: 'todos',
      data: '',
      dataInicio: '',
      dataFim: '',
      mes: 'todos',
      ano: 'todos'
    });
  };

  const projetosDisponiveis = useMemo(() => {
    const setProjs = new Set(voos.map(v => v.projeto));
    return Array.from(setProjs);
  }, [voos]);

  const mesesDisponiveis = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set(voos.map(v => v.dataVoo ? v.dataVoo.split('-')[0] : ''));
    return Array.from(setAnos).filter(Boolean);
  }, [voos]);

  const voosFiltrados = useMemo(() => {
    return voos.filter(v => {
      const matchProjeto = filtrosAplicados.projeto === 'todos' || v.projeto === filtrosAplicados.projeto;
      const matchData = !filtrosAplicados.data || v.dataVoo === filtrosAplicados.data;
      
      let matchPeriodo = true;
      if (filtrosAplicados.dataInicio && filtrosAplicados.dataFim && v.dataVoo) {
        matchPeriodo = v.dataVoo >= filtrosAplicados.dataInicio && v.dataVoo <= filtrosAplicados.dataFim;
      } else if (filtrosAplicados.dataInicio && v.dataVoo) {
        matchPeriodo = v.dataVoo >= filtrosAplicados.dataInicio;
      } else if (filtrosAplicados.dataFim && v.dataVoo) {
        matchPeriodo = v.dataVoo <= filtrosAplicados.dataFim;
      }

      const [anoVoo, mesVoo] = v.dataVoo ? v.dataVoo.split('-') : ['', ''];
      const matchMes = filtrosAplicados.mes === 'todos' || mesVoo === filtrosAplicados.mes;
      const matchAno = filtrosAplicados.ano === 'todos' || anoVoo === filtrosAplicados.ano;

      return matchProjeto && matchData && matchPeriodo && matchMes && matchAno;
    });
  }, [voos, filtrosAplicados]);

  const voosAgrupadosPorProjeto = useMemo(() => {
    const mapa = {};
    voosFiltrados.forEach(v => {
      const p = v.projeto;
      if (!mapa[p]) {
        mapa[p] = {
          projeto: p,
          totalPax: 0,
          pesoPax: 0,
          pesoBagagem: 0,
          totalPeso: 0,
          qtyBagagem: 0,
          qtdVoos: 0,
          somaEficiencia: 0,
          aeronaves: new Set()
        };
      }
      mapa[p].totalPax += v.totalPax;
      mapa[p].pesoPax += v.pesoPax;
      mapa[p].pesoBagagem += v.pesoBagagem;
      mapa[p].totalPeso += v.totalPeso;
      mapa[p].qtyBagagem += v.qtyBagagem;
      mapa[p].qtdVoos += 1;
      mapa[p].somaEficiencia += (v.eficiencia || 100);
      mapa[p].aeronaves.add(v.modeloAeronave);
    });

    return Object.values(mapa).map(item => ({
      ...item,
      eficienciaMedia: Number((item.somaEficiencia / item.qtdVoos).toFixed(1)),
      aeronavesStr: Array.from(item.aeronaves).join(', ')
    }));
  }, [voosFiltrados]);

  return (
    <div className={`min-h-screen flex font-sans relative overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* FUNDO COM IMAGEM REAL DE AERONAVE EM VOO (FOTO HD COM PANORAMA E SOBREPOSIÇÃO) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <style>{`
          @keyframes slowPan {
            0% { transform: scale(1.05) translate(0px, 0px); }
            50% { transform: scale(1.15) translate(-30px, -15px); }
            100% { transform: scale(1.05) translate(0px, 0px); }
          }
          .animate-real-plane {
            animation: slowPan 35s ease-in-out infinite;
          }
        `}</style>
        
        {/* Imagem Fotográfica Real de Aeronave Militar em Voo com Movimento Lento */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 animate-real-plane filter contrast-125"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=80')` }}
        ></div>

        {/* Gradiente Escuro para Garantir Contraste Perfeito */}
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95' : 'bg-gradient-to-br from-slate-100/90 via-white/85 to-slate-200/90'}`}></div>
      </div>

      {/* SIDEBAR */}
      <aside className={`w-64 flex-shrink-0 flex flex-col justify-between border-r z-10 ${darkMode ? 'bg-slate-900/90 backdrop-blur-md border-slate-800' : 'bg-white/90 backdrop-blur-md border-slate-200'}`}>
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-600/30">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs uppercase tracking-wider">FlightOps BSB</h1>
              <p className="text-[10px] text-blue-400 font-bold">Base Aérea de Brasília</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard & Cômputo</span>
            </button>

            <button
              onClick={() => setActiveTab('registro')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'registro'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{editandoId ? 'Editar Voo' : 'Cadastrar Voo Manual'}</span>
            </button>

            <button
              onClick={() => setActiveTab('aeronaves')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'aeronaves'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Gestão de Frota / Aeronaves</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>CAN v2.9</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        
        <header className={`px-8 py-5 border-b flex items-center justify-between ${darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              FlightOps BSB - Gestão de voos e pax do CAN
            </h2>
            <p className="text-xs text-slate-400">Base Aérea de Brasília - Controle Operacional de Passageiros e Carga</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Total de Voos: {voos.length}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ========================================== */}
          {/* ABA 1: DASHBOARD & CÔMPUTO POR PROJETO */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* FILTROS COM BOTÃO FILTRAR E INTERVALO DE DATAS */}
              <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} space-y-4 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center">
                    <Filter className="w-4 h-4 mr-2" /> Filtros de Cômputo e Consulta
                  </span>
                  <button onClick={limparFiltros} className="text-xs text-blue-400 hover:underline font-bold">
                    Limpar Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Projeto</label>
                    <select
                      value={filtroProjetoTemp}
                      onChange={(e) => setFiltroProjetoTemp(e.target.value)}
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="todos">Todos os Projetos</option>
                      {projetosDisponiveis.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Data Específica</label>
                    <input
                      type="date"
                      value={filtroDataTemp}
                      onChange={(e) => setFiltroDataTemp(e.target.value)}
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Data Início (Período)</label>
                    <input
                      type="date"
                      value={filtroDataInicioTemp}
                      onChange={(e) => setFiltroDataInicioTemp(e.target.value)}
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Data Fim (Período)</label>
                    <input
                      type="date"
                      value={filtroDataFimTemp}
                      onChange={(e) => setFiltroDataFimTemp(e.target.value)}
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Mês / Ano</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={filtroMesTemp}
                        onChange={(e) => setFiltroMesTemp(e.target.value)}
                        className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <option value="todos">Mês</option>
                        {mesesDisponiveis.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={filtroAnoTemp}
                        onChange={(e) => setFiltroAnoTemp(e.target.value)}
                        className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <option value="todos">Ano</option>
                        {anosDisponiveis.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setFiltrosAplicados({
                        projeto: filtroProjetoTemp,
                        data: filtroDataTemp,
                        dataInicio: filtroDataInicioTemp,
                        dataFim: filtroDataFimTemp,
                        mes: filtroMesTemp,
                        ano: filtroAnoTemp
                      })}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Filtrar</span>
                    </button>
                  </div>
                </div>
              </div>

              {voos.length === 0 ? (
                <div className={`p-12 rounded-2xl border backdrop-blur-md text-center space-y-4 shadow-xl ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-bold">Nenhum voo registrado</h3>
                  <p className="text-xs text-slate-400">Utilize a aba de cadastro manual para registrar voos e cargas.</p>
                  <button onClick={() => setActiveTab('registro')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                    Cadastrar Voo
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* CÔMPUTO CONSOLIDADO POR PROJETO */}
                  <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} space-y-4 shadow-xl`}>
                    <h3 className="text-sm font-extrabold flex items-center text-blue-400">
                      <BarChart3 className="w-4 h-4 mr-2" /> Cômputo Consolidado por Projeto (Voos duplicados somados automaticamente)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {voosAgrupadosPorProjeto.map(item => (
                        <div key={item.projeto} className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-extrabold text-xs border border-blue-500/20">
                              Projeto: {item.projeto}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">{item.qtdVoos} voo(s)</span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-slate-300"><strong>Aeronaves:</strong> {item.aeronavesStr}</p>
                            <p className="text-emerald-400 font-bold">Total de PAX: {item.totalPax} passageiros</p>
                            <p className="text-indigo-400">Total Bagagens: {item.qtyBagagem} vol. ({item.pesoBagagem} kg)</p>
                            <p className="text-amber-400 font-semibold">Peso Geral Acumulado: {item.totalPeso} kg</p>
                            <p className="text-cyan-400 font-bold">Eficiência Média: {item.eficienciaMedia}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DETALHAMENTO DOS VOOS NO FILTRO */}
                  <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} space-y-4 shadow-xl`}>
                    <h3 className="text-sm font-extrabold flex items-center text-blue-400">
                      <Plane className="w-4 h-4 mr-2" /> Detalhamento dos Voos no Filtro & Comparativo de Manifestos
                    </h3>

                    <div className="space-y-4">
                      {voosFiltrados.map(v => (
                        <div key={v.id} className="p-5 rounded-xl bg-slate-800/30 border border-slate-800 space-y-4 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-[10px]">
                                  {v.projeto}
                                </span>
                                <span className="font-extrabold text-sm">{v.modeloAeronave} ({v.matricula})</span>
                              </div>
                              <p className="text-slate-300 mt-1">Rota: <strong>{v.rota}</strong> — Data: <strong>{v.dataVoo}</strong></p>
                              <p className="text-slate-400 mt-0.5">Chamada: {v.horarioChamada} | Decolagem: {v.horarioDecolagem} | Emb. Real: {v.horarioEmbarqueReal || v.horarioDecolagem} | <strong className="text-emerald-400">Eficiência: {v.eficiencia}%</strong></p>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                                📦 {v.qtyBagagem} vol. ({v.pesoBagagem} kg)
                              </span>
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                👥 {v.totalPax} PAX ({v.totalPeso} kg)
                              </span>
                              <button
                                onClick={() => iniciarEdicao(v)}
                                className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                title="Editar Voo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => excluirVoo(v.id)}
                                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                                title="Excluir Voo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Se houver dados comparativos de manifesto */}
                          {v.manifestoComparativo && v.manifestoComparativo.comparativo.length > 0 && (
                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <span className="font-extrabold text-slate-300">Resumo Comparativo de Embarque:</span>
                                <div className="flex items-center space-x-3 text-[11px]">
                                  <span className="text-emerald-400 font-bold">Presentes: {v.manifestoComparativo.presentes}</span>
                                  <span className="text-rose-400 font-bold">Faltaram: {v.manifestoComparativo.faltaram}</span>
                                  <span className="text-amber-400 font-bold">Pax Novos: {v.manifestoComparativo.novos}</span>
                                  <span className="text-blue-400 font-bold">Taxa de Faltas: {v.manifestoComparativo.taxaFalta}%</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                                {v.manifestoComparativo.comparativo.map((c, idxC) => (
                                  <div key={idxC} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[11px]">
                                    <span className="font-medium truncate mr-2">{c.nome}</span>
                                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] ${
                                      c.status === 'PRESENTE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                      c.status === 'FALTOU' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                      {c.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GRÁFICO DE BARRAS VERTICAL NO RODAPÉ */}
                  <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} space-y-4 shadow-xl`}>
                    <h3 className="text-sm font-extrabold flex items-center text-blue-400">
                      <BarChart3 className="w-4 h-4 mr-2" /> Gráfico Comparativo Geral de Cômputo (Barras Verticais)
                    </h3>
                    <p className="text-xs text-slate-400">Comparação visual de passageiros e peso total por voo filtrado.</p>

                    <div className="pt-6 pb-2 flex items-end justify-around gap-4 h-64 border-b border-slate-800 overflow-x-auto">
                      {voosFiltrados.map((v, idx) => {
                        const maxP = Math.max(...voosFiltrados.map(item => Math.max(item.totalPax, item.totalPeso / 50)), 1);
                        const hPax = Math.max(Math.round((v.totalPax / maxP) * 160), 20);
                        const hPeso = Math.max(Math.round(((v.totalPeso / 50) / maxP) * 160), 20);

                        return (
                          <div key={v.id || idx} className="flex flex-col items-center h-full justify-end flex-1 min-w-[70px] group">
                            <div className="flex items-end justify-center space-x-1.5 w-full h-44 pb-2">
                              <div
                                className="w-6 bg-blue-500 rounded-t-lg transition-all duration-300 group-hover:bg-blue-400 relative flex items-start justify-center pt-1"
                                style={{ height: `${hPax}px` }}
                                title={`Pax: ${v.totalPax}`}
                              >
                                <span className="text-[9px] font-bold text-white -rotate-90 origin-bottom mt-1">{v.totalPax}p</span>
                              </div>
                              <div
                                className="w-6 bg-emerald-500 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-400 relative flex items-start justify-center pt-1"
                                style={{ height: `${hPeso}px` }}
                                title={`Peso Total: ${v.totalPeso} kg`}
                              >
                                <span className="text-[9px] font-bold text-white -rotate-90 origin-bottom mt-1">{v.totalPeso}kg</span>
                              </div>
                            </div>
                            <div className="text-center mt-2 border-t border-slate-800 pt-1 w-full">
                              <span className="text-[11px] font-extrabold text-blue-400 block truncate">{v.projeto}</span>
                              <span className="text-[9px] text-slate-400 block truncate">{v.dataVoo}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center space-x-6 text-xs pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
                        <span className="text-slate-300 font-semibold">Total de Passageiros (PAX)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                        <span className="text-slate-300 font-semibold">Peso Total (kg) / Escala</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* ABA 2: CADASTRAR OU EDITAR VOO MANUALMENTE */}
          {/* ========================================== */}
          {activeTab === 'registro' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <form onSubmit={handleSubmitVoo} className={`p-8 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} shadow-xl space-y-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold flex items-center text-blue-400">
                      <PlusCircle className="w-5 h-5 mr-2" /> {editandoId ? 'Editar Voo Cadastrado' : 'Inserção Manual de Voo e Carga'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Preencha os horários (com minutos livres ex: 10:34) e calcule a eficiência operacional.</p>
                  </div>
                  {editandoId && (
                    <button
                      type="button"
                      onClick={() => { setEditandoId(null); setActiveTab('dashboard'); }}
                      className="text-xs text-rose-400 underline font-bold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Projeto / Identificador (Ex: C-95, C-97, C-99)</label>
                    <input
                      type="text"
                      name="projeto"
                      value={formData.projeto}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: C-99"
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Modelo da Aeronave (FAB)</label>
                    <select
                      name="modeloAeronave"
                      value={formData.modeloAeronave}
                      onChange={handleModeloChange}
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    >
                      {frotaAeronaves.map(a => (
                        <option key={a.modelo} value={a.modelo}>{a.modelo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Matrícula (Opcional)</label>
                    <input
                      type="text"
                      name="matricula"
                      value={formData.matricula}
                      onChange={handleInputChange}
                      placeholder="Ex: FAB 2591"
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Rota (Ex: SBBR - SBGL)</label>
                    <input
                      type="text"
                      name="rota"
                      value={formData.rota}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Data do Voo</label>
                    <input
                      type="date"
                      name="dataVoo"
                      value={formData.dataVoo}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Hora Chamada (Previsto)</label>
                    <input
                      type="time"
                      name="horarioChamada"
                      value={formData.horarioChamada}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Hora Decolagem</label>
                    <input
                      type="time"
                      name="horarioDecolagem"
                      value={formData.horarioDecolagem}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Hora Embarque Real (Execução)</label>
                    <input
                      type="time"
                      name="horarioEmbarqueReal"
                      value={formData.horarioEmbarqueReal}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Total de PAX</label>
                    <input
                      type="number"
                      name="totalPax"
                      value={formData.totalPax}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Peso Pax (kg)</label>
                    <input
                      type="number"
                      name="pesoPax"
                      value={formData.pesoPax}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Peso Bagagem (kg)</label>
                    <input
                      type="number"
                      name="pesoBagagem"
                      value={formData.pesoBagagem}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Total de Peso (kg)</label>
                    <input
                      type="number"
                      name="totalPeso"
                      value={formData.totalPeso}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Qtd Bagagens</label>
                    <input
                      type="number"
                      name="qtyBagagem"
                      value={formData.qtyBagagem}
                      onChange={handleInputChange}
                      required
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>

                {/* COPIAR E COLAR LISTAS DE NOMES PARA COMPARATIVO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-blue-400" /> 1ª Relação (Manifesto Previsto)
                    </label>
                    <textarea
                      name="textoListaPrevista"
                      rows="5"
                      value={formData.textoListaPrevista}
                      onChange={handleInputChange}
                      placeholder="Cole aqui os nomes da primeira relação (um por linha)..."
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center">
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> 2ª Relação (Realizado de Embarque)
                    </label>
                    <textarea
                      name="textoListaRealizada"
                      rows="5"
                      value={formData.textoListaRealizada}
                      onChange={handleInputChange}
                      placeholder="Cole aqui os nomes reais que embarcaram (um por linha)..."
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    ></textarea>
                  </div>
                </div>

                {/* PAINEL DE RESULTADO COMPARATIVO E EFICIÊNCIA */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">Eficiência Operacional & Comparativo</h4>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-extrabold text-xs border border-cyan-500/20">
                      Índice: {calcularEficiencia(formData.horarioChamada, formData.horarioEmbarqueReal || formData.horarioDecolagem)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xs text-slate-400 block">Presentes</span>
                      <span className="text-sm font-extrabold text-emerald-400">{comparativoManifesto.presentes}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-xs text-slate-400 block">Faltaram</span>
                      <span className="text-sm font-extrabold text-rose-400">{comparativoManifesto.faltaram}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-xs text-slate-400 block">Pax Novos</span>
                      <span className="text-sm font-extrabold text-amber-400">{comparativoManifesto.novos}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-xs text-slate-400 block">% de Faltas</span>
                      <span className="text-sm font-extrabold text-blue-400">{comparativoManifesto.taxaFalta}%</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editandoId ? 'Salvar Alterações do Voo' : 'Salvar Voo e Computar no Dashboard'}</span>
                </button>
              </form>

            </div>
          )}

          {/* ========================================== */}
          {/* ABA 3: GESTÃO DE FROTA E MODELOS DE AERONAVES */}
          {/* ========================================== */}
          {activeTab === 'aeronaves' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className={`p-8 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'} shadow-xl space-y-6`}>
                <div>
                  <h3 className="text-base font-extrabold flex items-center text-blue-400">
                    <Plane className="w-5 h-5 mr-2" /> Gestão Manual de Modelos e Matrículas da Frota
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Adicione novos modelos de aeronaves e matrículas padrão que serão disponibilizados no cadastro de voos.</p>
                </div>

                <form onSubmit={handleAddAeronave} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Modelo da Aeronave</label>
                    <input
                      type="text"
                      value={novaAeronave.modelo}
                      onChange={(e) => setNovaAeronave(prev => ({ ...prev, modelo: e.target.value }))}
                      required
                      placeholder="Ex: C-95 Bandeirante"
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Matrícula Padrão</label>
                    <input
                      type="text"
                      value={novaAeronave.matriculaPadrao}
                      onChange={(e) => setNovaAeronave(prev => ({ ...prev, matriculaPadrao: e.target.value }))}
                      placeholder="Ex: FAB 2301"
                      className={`w-full text-xs p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Adicionar Aeronave</span>
                    </button>
                  </div>
                </form>

                <div className="border-t border-slate-800 pt-6 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Aeronaves Cadastradas na Frota ({frotaAeronaves.length})</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {frotaAeronaves.map(a => (
                      <div key={a.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-100 block">{a.modelo}</strong>
                          <span className="text-slate-400">Matrícula Padrão: {a.matriculaPadrao}</span>
                        </div>
                        <button
                          onClick={() => removerAeronave(a.id)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                          title="Remover Aeronave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
