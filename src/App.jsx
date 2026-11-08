import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  const [formVoo, setFormVoo] = useState({
    aeronave: 'C-95 (BANDEIRANTE)',
    rota: '',
    pax: '',
    pesoPax: '',
    bagagem: ''
  });

  const [aeronaves, setAeronaves] = useState([
    'C-95 (BANDEIRANTE)',
    'C-97 (BRASÍLIA)',
    'C-98 (CARAVAN)',
    'KC-390',
    'C-105 (AMAZONAS)',
    'H-60 (BLACK HAWK)',
    'C-99 (LEGACY)'
  ]);
  const [novaAeronave, setNovaAeronave] = useState('');
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');

  useEffect(() => {
    carregarVoos();
  }, []);

  async function carregarVoos() {
    try {
      const { data, error } = await supabase.from('voos').select('*');
      if (error) throw error;
      if (data) setVoos(data);
    } catch (err) {
      console.error('Erro ao carregar voos:', err.message);
    }
  }

  async function adicionarVoo(e) {
    e.preventDefault();
    try {
      const novoRegistro = {
        prefixo: formVoo.aeronave,
        rota: formVoo.rota,
        data_voo: '2026-11-08',
        horario: '00:00',
        pax: Number(formVoo.pax) || 0,
        peso_pax: Number(formVoo.pesoPax) || 0,
        bagagem: Number(formVoo.bagagem) || 0,
        excluido: false
      };

      const { error } = await supabase.from('voos').insert([novoRegistro]);
      if (error) throw error;

      alert('Voo registado com sucesso!');
      setFormVoo({ aeronave: 'C-95 (BANDEIRANTE)', rota: '', pax: '', pesoPax: '', bagagem: '' });
      setMenuAtivo('painel');
      carregarVoos();
    } catch (err) {
      alert('Erro ao adicionar voo: ' + err.message);
    }
  }

  async function moverParaLixeira(id, prefixo) {
    if (!window.confirm(`Deseja enviar o voo ${prefixo || ''} para a lixeira?`)) return;
    try {
      const { error } = await supabase.from('voos').update({ excluido: true }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  async function excluirDefinitivo(id) {
    if (!window.confirm('Deseja excluir permanentemente?')) return;
    try {
      const { error } = await supabase.from('voos').delete().eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function restaurarVoo(id) {
    try {
      const { error } = await supabase.from('voos').update({ excluido: false }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao restaurar: ' + err.message);
    }
  }

  const voosAtivos = voos.filter(v => !v.excluido);
  const voosLixeira = voos.filter(v => v.excluido);

  const totalVoos = voosAtivos.length;
  const totalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.pax) || 0), 0);
  const totalBagagem = voosAtivos.reduce((acc, curr) => acc + (Number(curr.bagagem) || 0), 0);
  const pesoTotalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.peso_pax) || 0), 0);
  const pesoTotalTransp = pesoTotalPax + totalBagagem;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'painel', label: 'Painel de Voos', icon: '📋' },
    { id: 'adicionar', label: 'Adicionar Voo', icon: '➕' },
    { id: 'desembarque', label: 'Desembarque', icon: '🛬' },
    { id: 'aeronave', label: 'Adicionar Aeronave', icon: '✈️' },
    { id: 'relatorio', label: 'Imprimir Relatório', icon: '🖨️' },
    { id: 'utilizadores', label: 'Utilizadores', icon: '👥' },
    { id: 'lixeira', label: `Lixeira (${voosLixeira.length})`, icon: '🗑️', danger: true }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070c1b', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar Lateral */}
      <div style={{ width: sidebarAberto ? '270px' : '80px', backgroundColor: '#090e21', borderRight: '1px solid #141f38', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #141f38' }}>
          <div style={{ background: '#00b4d8', padding: '10px', borderRadius: '12px', color: '#070c1b', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map(item => {
            const ativo = menuAtivo === item.id;
            return (
              <div key={item.id} onClick={() => setMenuAtivo(item.id)} style={{ padding: '13px 16px', borderRadius: '10px', cursor: 'pointer', background: ativo ? (item.danger ? '#ef4444' : '#00b4d8') : 'transparent', color: ativo ? '#070c1b' : (item.danger ? '#f87171' : '#94a3b8'), fontWeight: ativo ? '700' : '500', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {sidebarAberto && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #141f38' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#0e152e', border: '1px solid #1a2744', color: '#94a3b8', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            {sidebarAberto ? '◀ Ocultar Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070c1b', minWidth: 0 }}>
        
        {/* Topbar Superior */}
        <div style={{ height: '75px', borderBottom: '1px solid #141f38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', backgroundColor: '#070c1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#00b4d8', padding: '8px', borderRadius: '10px', color: '#070c1b', fontWeight: 'bold' }}>✈</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>FLIGHTOPS BSB</h2>
              <small style={{ color: '#64748b', fontSize: '9px', fontWeight: '600' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>● POSTO CAN BR OPERACIONAL</span>
            <span style={{ background: '#0e152e', color: '#fff', border: '1px solid #1a2744', padding: '7px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Workspace do Dashboard */}
        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              {/* Filtros Operacionais */}
              <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ color: '#00b4d8', fontSize: '11px', fontWeight: '800', marginBottom: '18px', letterSpacing: '0.5px' }}>
                  🔍 FILTROS OPERACIONAIS — POSTO CAN BR
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>MÊS / ANO</label>
                    <input type="text" placeholder("-------- de ----" style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#64748b', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #141f38', paddingTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>📍 FILTRAR PAX POR LOCALIDADE / DESTINO:</label>
                    <select style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS LOCALIDADES (GERAL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>👤 FILTRAR POR STATUS DE DESEMBARQUE:</label>
                    <select style={{ width: '100%', backgroundColor: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODOS OS VOOS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Perfil Estatístico Operacional */}
              <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(0,180,216,0.1)', padding: '12px', borderRadius: '12px', color: '#00b4d8', fontSize: '20px' }}>⏱️</div>
                  <div>
                    <div style={{ color: '#00b4d8', fontSize: '14px', fontWeight: '800' }}>PERFIL ESTATÍSTICA OPERACIONAL</div>
                    <small style={{ color: '#64748b', fontSize: '12px' }}>Gere a visão consolidada por tipo de aeronave aplicando os filtros de data acima</small>
                  </div>
                </div>
                <button onClick={() => alert('Estatística gerada com sucesso!')} style={{ background: '#00b4d8', color: '#070c1b', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 15px rgba(0,180,216,0.3)' }}>
                  GERAR ESTATÍSTICA
                </button>
              </div>

              {/* 3 Cartões Superiores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
                
                {/* Cartão 1: Total de Voos */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>TOTAL DE VOOS</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>{totalVoos}</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #38bdf8, #0077b6)', width: '45px', height: '40px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '12px' }}>
                      {totalVoos}
                    </div>
                  </div>
                </div>

                {/* Cartão 2: Total de Passageiros */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#34d399' }}>{totalPax}</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #34d399, #059669)', width: '45px', height: '65px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#070c1b', fontSize: '12px' }}>
                      {totalPax}
                    </div>
                  </div>
                </div>

                {/* Cartão 3: Total Desembarcados */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>TOTAL DESEMBARCADOS</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>0</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #38bdf8, #0077b6)', width: '45px', height: '35px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '12px' }}>
                      0
                    </div>
                  </div>
                </div>

              </div>

              {/* 3 Cartões Inferiores de Pesos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                
                {/* Peso Total Pax */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>PESO TOTAL PAX</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>{pesoTotalPax} KG</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #6366f1, #3b82f6)', width: '55px', height: '55px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '11px' }}>
                      {pesoTotalPax}
                    </div>
                  </div>
                </div>

                {/* Peso Total de Bagagem */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>PESO TOTAL DE BAGAGEM</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#fbbf24' }}>{totalBagagem} KG</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #fbbf24, #d97706)', width: '55px', height: '55px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#070c1b', fontSize: '11px' }}>
                      {totalBagagem}
                    </div>
                  </div>
                </div>

                {/* Peso Total Transp. */}
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>PESO TOTAL TRANSP.</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#f43f5e' }}>{pesoTotalTransp} KG</span>
                  </div>
                  <div style={{ background: '#050814', border: '1px solid #141f38', borderRadius: '12px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(180deg, #f43f5e, #be123c)', width: '65px', height: '55px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '11px' }}>
                      {pesoTotalTransp} KG
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px', fontWeight: '800' }}>📋 PAINEL DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>Nenhum voo registado.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      <h4 style={{ color: '#00b4d8', margin: '0 0 10px 0', fontWeight: '800' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>PAX: {voo.pax} | Bagagem: {voo.bagagem} KG</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>🗑️ APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px', fontWeight: '800' }}>➕ ADICIONAR VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                  {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="text" required placeholder="Rota (Ex: SBBR-SBGR)" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <input type="number" placeholder="Total PAX" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} />
                  <input type="number" placeholder="Peso PAX (KG)" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} />
                  <input type="number" placeholder="Bagagem (KG)" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} />
                </div>
                <button type="submit" style={{ background: '#00b4d8', color: '#070c1b', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(0,180,216,0.3)' }}>🚀 GRAVAR NA NUVEM</button>
              </form>
            </div>
          )}

          {menuAtivo === 'desembarque' && (
            <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Módulo de Desembarque Ativo.</div>
          )}

          {menuAtivo === 'aeronave' && (
            <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px', fontWeight: '800' }}>✈️ GERIR AERONAVES</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nova Aeronave" value={novaAeronave} onChange={e => setNovaAeronave(e.target.value)} style={{ background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '10px', borderRadius: '8px', flex: 1, outline: 'none' }} />
                <button onClick={() => { if(novaAeronave) { setAeronaves([...aeronaves, novaAeronave.toUpperCase()]); setNovaAeronave(''); }}} style={{ background: '#00b4d8', border: 'none', color: '#070c1b', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ADICIONAR</button>
              </div>
              {aeronaves.map(a => <div key={a} style={{ padding: '10px', borderBottom: '1px solid #141f38', color: '#94a3b8' }}>{a}</div>)}
            </div>
          )}

          {menuAtivo === 'relatorio' && (
            <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '30px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#00b4d8', margin: 0, fontWeight: '800' }}>🖨️ IMPRESSÃO DE RELATÓRIO</h3>
                <button onClick={() => window.print()} style={{ background: '#00b4d8', color: '#070c1b', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>IMPRIMIR</button>
              </div>
              <div style={{ background: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
                <h4>Base Aérea de Brasília — Posto CAN BR</h4>
                <p>Total de voos ativos: {totalVoos}</p>
              </div>
            </div>
          )}

          {menuAtivo === 'utilizadores' && (
            <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px', fontWeight: '800' }}>👥 UTILIZADORES</h3>
              <input type="password" placeholder="Nova senha admin" value={novaSenhaAdmin} onChange={e => setNovaSenhaAdmin(e.target.value)} style={{ width: '100%', background: '#050814', border: '1px solid #1a2744', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '15px', outline: 'none' }} />
              <button onClick={() => { if(novaSenhaAdmin) { alert('Senha atualizada!'); setNovaSenhaAdmin(''); }}} style={{ background: '#00b4d8', color: '#070c1b', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ATUALIZAR SENHA</button>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ef4444', marginBottom: '20px', fontWeight: '800' }}>🗑️ LIXEIRA</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ background: '#090e21', border: '1px solid #141f38', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ background: '#090e21', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontWeight: '800' }}>{voo.prefixo}</h4>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ background: '#00b4d8', border: 'none', color: '#070c1b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>EXCLUIR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
