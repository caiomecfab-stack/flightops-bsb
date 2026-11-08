import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // Estados de Cadastro de Voo Completo
  const [formVoo, setFormVoo] = useState({
    aeronave: 'C-95 (BANDEIRANTE)',
    matricula: '',
    rota: '',
    dataVoo: '',
    horaChamada: '',
    horaDecolagem: '',
    horaReal: '',
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
  
  const [utilizadores, setUtilizadores] = useState(['CAIO']);
  const [novoUser, setNovoUser] = useState('');
  const [senhaUser, setSenhaUser] = useState('');
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
        matricula: formVoo.matricula || 'N/D',
        rota: formVoo.rota,
        data_voo: formVoo.dataVoo || '2026-11-08',
        horario: formVoo.horaChamada || '00:00',
        pax: Number(formVoo.pax) || 0,
        peso_pax: Number(formVoo.pesoPax) || 0,
        bagagem: Number(formVoo.bagagem) || 0,
        excluido: false
      };

      const { error } = await supabase.from('voos').insert([novoRegistro]);
      if (error) throw error;

      alert('✈️ Voo registado com sucesso na nuvem!');
      setFormVoo({ aeronave: 'C-95 (BANDEIRANTE)', matricula: '', rota: '', dataVoo: '', horaChamada: '', horaDecolagem: '', horaReal: '', pax: '', pesoPax: '', bagagem: '' });
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
    if (!window.confirm('Deseja excluir este item permanentemente?')) return;
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
      alert('Erro: ' + err.message);
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar Executiva com Efeito Glassmorphism */}
      <div style={{ width: sidebarAberto ? '280px' : '88px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        
        {/* Header da Sidebar */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', padding: '11px', borderRadius: '14px', color: '#0f172a', fontWeight: '900', boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', color: '#fff' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginTop: '3px', fontWeight: '600', letterSpacing: '0.8px' }}>POSTO CAN BR — SBBR</small>
            </div>
          )}
        </div>

        {/* Navegação */}
        <div style={{ padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map(item => {
            const ativo = menuAtivo === item.id;
            return (
              <div key={item.id} onClick={() => setMenuAtivo(item.id)} style={{ padding: '13px 16px', borderRadius: '12px', cursor: 'pointer', background: ativo ? (item.danger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #38bdf8, #0284c7)') : 'transparent', color: ativo ? '#ffffff' : (item.danger ? '#fca5a5' : '#94a3b8'), fontWeight: ativo ? '700' : '500', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: ativo ? '0 8px 20px rgba(0, 0, 0, 0.3)' : 'none' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {sidebarAberto && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        {/* Botão Recolher */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}>
            {sidebarAberto ? '◀ Recolher Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Topbar Superior Moderna */}
        <div style={{ height: '76px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>PAINEL OPERACIONAL DE VOOS</h2>
            <span style={{ color: '#64748b', fontSize: '12px' }}>| Base Aérea de Brasília</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>● POSTO CAN BR ONLINE</span>
            <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '7px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Workspace Dinâmico */}
        <div style={{ padding: '35px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              {/* Filtros Operacionais */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '26px', marginBottom: '28px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '800', marginBottom: '18px', letterSpacing: '0.8px' }}>
                  🔍 FILTROS OPERACIONAIS — POSTO CAN BR
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>MÊS / ANO</label>
                    <input type="text" placeholder("-------- de ----" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>📍 FILTRAR PAX POR LOCALIDADE / DESTINO:</label>
                    <select style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS LOCALIDADES (GERAL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>👤 FILTRAR POR STATUS DE DESEMBARQUE:</label>
                    <select style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODOS OS VOOS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cartões Estatísticos Superiores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '26px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px' }}>TOTAL DE VOOS</span>
                  <div style={{ fontSize: '46px', fontWeight: '900', color: '#fff', margin: '15px 0 5px 0' }}>{totalVoos}</div>
                  <div style={{ color: '#34d399', fontSize: '12px', fontWeight: '700' }}>🟢 Ativos na nuvem</div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '26px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  <div style={{ fontSize: '46px', fontWeight: '900', color: '#38bdf8', margin: '15px 0 5px 0' }}>{totalPax}</div>
                  <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '700' }}>👥 Total embarcado</div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '26px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px' }}>TOTAL DESEMBARCADOS</span>
                  <div style={{ fontSize: '46px', fontWeight: '900', color: '#fbbf24', margin: '15px 0 5px 0' }}>0</div>
                  <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700' }}>⏳ Aguardando ciclo</div>
                </div>
              </div>

              {/* Cartões Inferiores de Pesos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.5px' }}>PESO TOTAL PAX</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8' }}>{pesoTotalPax} KG</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.5px' }}>PESO TOTAL DE BAGAGEM</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#fbbf24' }}>{totalBagagem} KG</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.5px' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#f43f5e' }}>{pesoTotalTransp} KG</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#38bdf8', marginBottom: '24px', fontWeight: '800' }}>📋 PAINEL DE REGISTO DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#64748b' }}>Nenhum voo registado na base de dados em nuvem.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '16px', fontWeight: '800' }}>{voo.prefixo}</h4>
                          <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', padding: '5px 12px', borderRadius: '8px', fontWeight: '700' }}>{voo.data_voo}</span>
                        </div>
                        <p style={{ margin: '6px 0', color: '#e2e8f0', fontSize: '13px' }}><strong>Rota:</strong> {voo.rota}</p>
                        <p style={{ margin: '6px 0', color: '#e2e8f0', fontSize: '13px' }}><strong>PAX:</strong> {voo.pax} | <strong>Bagagem:</strong> {voo.bagagem} KG</p>
                      </div>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '11px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>🗑️ Enviar para Lixeira</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '35px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '25px', fontWeight: '800' }}>➕ ADICIONAR NOVO VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '800' }}>TIPO DE AERONAVE FAB</label>
                    <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', outline: 'none' }}>
                      {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '800' }}>ROTA (EX: SBBR-SBGR)</label>
                    <input type="text" required placeholder="SBBR-SBGR" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '800' }}>TOTAL PAX</label>
                    <input type="number" placeholder="0" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '800' }}>PESO PAX (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '800' }}>BAGAGEM (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: '#fff', border: 'none', padding: '15px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', marginTop: '10px', boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)' }}>
                  🚀 SALVAR VOO NA NUVEM
                </button>
              </form>
            </div>
          )}

          {menuAtivo === 'desembarque' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '35px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '10px', fontWeight: '800' }}>🛬 GESTÃO E FILTRO DE DESEMBARQUE</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '25px' }}>Selecione os voos e indique o total de passageiros desembarcados.</p>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>Nenhum voo disponível.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
                      <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontWeight: '800' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>Rota: {voo.rota}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'aeronave' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '35px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px', fontWeight: '800' }}>✈️ GERIR AERONAVES FAB</h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <input type="text" placeholder="EX: C-130 HÉRCULES" value={novaAeronave} onChange={e => setNovaAeronave(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', outline: 'none' }} />
                <button onClick={() => { if(novaAeronave) { setAeronaves([...aeronaves, novaAeronave.toUpperCase()]); setNovaAeronave(''); }}} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '13px 24px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>ADICIONAR</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aeronaves.map(a => (
                  <div key={a} style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600' }}>
                    <span>{a}</span>
                    <button onClick={() => setAeronaves(aeronaves.filter(item => item !== a))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>APAGAR</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menuAtivo === 'relatorio' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '35px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#38bdf8', margin: 0, fontWeight: '800' }}>🖨️ GERADOR E IMPRESSÃO DE RELATÓRIO</h3>
                <button onClick={() => window.print()} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '11px 22px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>IMPRMIR / EXPORTAR</button>
              </div>
              <div style={{ background: '#fff', color: '#000', padding: '30px', borderRadius: '16px' }}>
                <h3 style={{ textAlign: 'center', margin: 0 }}>COMANDO DA AERONÁUTICA</h3>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#555' }}>BASE AÉREA DE BRASÍLIA — POSTO CAN BR</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>DATA</th>
                      <th style={{ padding: '8px' }}>AERONAVE</th>
                      <th style={{ padding: '8px' }}>ROTA</th>
                      <th style={{ padding: '8px' }}>PAX</th>
                      <th style={{ padding: '8px' }}>PESO TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voosAtivos.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '8px' }}>{v.data_voo}</td>
                        <td style={{ padding: '8px' }}>{v.prefixo}</td>
                        <td style={{ padding: '8px' }}>{v.rota}</td>
                        <td style={{ padding: '8px' }}>{v.pax}</td>
                        <td style={{ padding: '8px' }}>{v.peso_pax + v.bagagem} KG</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {menuAtivo === 'utilizadores' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '35px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px', fontWeight: '800' }}>👥 SEGURANÇA E GESTÃO DE UTILIZADORES</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input type="password" placeholder="NOVA SENHA DO ADMINISTRADOR CAIO" value={novaSenhaAdmin} onChange={e => setNovaSenhaAdmin(e.target.value)} style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '13px', borderRadius: '12px', outline: 'none' }} />
                <button onClick={() => { if(novaSenhaAdmin) { alert('Senha atualizada!'); setNovaSenhaAdmin(''); }}} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>ATUALIZAR SENHA</button>
              </div>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#f43f5e', marginBottom: '24px', fontWeight: '800' }}>🗑️ LIXEIRA DE VOOS</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#64748b' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '20px', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                      <h4 style={{ color: '#f43f5e', margin: '0 0 10px 0', fontWeight: '800' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ flex: 1, background: '#38bdf8', border: 'none', color: '#0f172a', padding: '11px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '11px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' }}>APAGAR</button>
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
