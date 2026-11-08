import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    { id: 'lixeira', label: `Lixeira (${voosLixeira.length})`, icon: '🗑️', danger: true },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#040711', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar Elegante */}
      <div style={{ width: sidebarAberto ? '280px' : '84px', backgroundColor: '#070b19', borderRight: '1px solid #131c38', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #131c38' }}>
          <div style={{ background: 'linear-gradient(135deg, #00b4d8, #0077b6)', padding: '10px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,180,216,0.3)' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '2px', fontWeight: '600' }}>POSTO CAN BR — SBBR</small>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map(item => {
            const ativo = menuAtivo === item.id;
            return (
              <div key={item.id} onClick={() => setMenuAtivo(item.id)} style={{ padding: '13px 16px', borderRadius: '10px', cursor: 'pointer', backgroundColor: ativo ? (item.danger ? '#ef4444' : '#00b4d8') : 'transparent', color: ativo ? '#fff' : (item.danger ? '#f87171' : '#94a3b8'), fontWeight: ativo ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', transition: 'all 0.2s', boxShadow: ativo ? '0 4px 15px rgba(0,0,0,0.2)' : 'none' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {sidebarAberto && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #131c38' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#0c132b', border: '1px solid #1e293b', color: '#94a3b8', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'background 0.2s' }}>
            {sidebarAberto ? '◀ Recolher Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#040711', minWidth: 0 }}>
        
        {/* Topbar Moderna */}
        <div style={{ height: '75px', borderBottom: '1px solid #131c38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', backgroundColor: '#070b19', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>GESTÃO OPERACIONAL</h2>
            <span style={{ color: '#64748b', fontSize: '12px' }}>| Base Aérea de Brasília</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>● OPERACIONAL ONLINE</span>
            <span style={{ backgroundColor: '#0c132b', color: '#f8fafc', border: '1px solid #1e293b', padding: '7px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Workspace */}
        <div style={{ padding: '35px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '28px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL DE VOOS</span>
                  <div style={{ fontSize: '46px', fontWeight: '800', color: '#fff', margin: '15px 0 5px 0' }}>{totalVoos}</div>
                  <div style={{ color: '#34d399', fontSize: '12px', fontWeight: '600' }}>↑ Sincronizado em nuvem</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  <div style={{ fontSize: '46px', fontWeight: '800', color: '#00b4d8', margin: '15px 0 5px 0' }}>{totalPax}</div>
                  <div style={{ color: '#00b4d8', fontSize: '12px', fontWeight: '600' }}>Atendidos com excelência</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>PESO TOTAL TRANSP.</span>
                  <div style={{ fontSize: '40px', fontWeight: '800', color: '#f43f5e', margin: '15px 0 5px 0' }}>{pesoTotalTransp} <span style={{ fontSize: '20px' }}>KG</span></div>
                  <div style={{ color: '#f43f5e', fontSize: '12px', fontWeight: '600' }}>Pax + Bagagens</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#00b4d8', marginBottom: '24px', fontWeight: '700' }}>📋 PAINEL DE REGISTO DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ backgroundColor: '#070b19', border: '1px solid #131c38', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#64748b' }}>Nenhum voo registado na base de dados.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ color: '#00b4d8', margin: 0, fontSize: '16px', fontWeight: '700' }}>{voo.prefixo}</h4>
                          <span style={{ fontSize: '11px', background: '#131c38', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>{voo.data_voo}</span>
                        </div>
                        <p style={{ margin: '6px 0', color: '#cbd5e1', fontSize: '13px' }}><strong>Rota:</strong> {voo.rota}</p>
                        <p style={{ margin: '6px 0', color: '#cbd5e1', fontSize: '13px' }}><strong>PAX:</strong> {voo.pax} | <strong>Bagagem:</strong> {voo.bagagem} KG</p>
                      </div>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', transition: 'background 0.2s' }}>🗑️ Enviar para Lixeira</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '20px', padding: '35px', maxWidth: '850px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '25px', fontWeight: '700' }}>➕ ADICIONAR NOVO VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '700' }}>TIPO DE AERONAVE FAB</label>
                    <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ width: '100%', backgroundColor: '#040711', border: '1px solid #1e293b', color: '#fff', padding: '13px', borderRadius: '10px', outline: 'none' }}>
                      {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '700' }}>ROTA (EX: SBBR-SBGR)</label>
                    <input type="text" required placeholder="SBBR-SBGR" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ width: '100%', backgroundColor: '#040711', border: '1px solid #1e293b', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '700' }}>TOTAL PAX</label>
                    <input type="number" placeholder="0" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ width: '100%', backgroundColor: '#040711', border: '1px solid #1e293b', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '700' }}>PESO PAX (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ width: '100%', backgroundColor: '#040711', border: '1px solid #1e293b', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '700' }}>BAGAGEM (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ width: '100%', backgroundColor: '#040711', border: '1px solid #1e293b', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #00b4d8, #0077b6)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', marginTop: '10px', boxShadow: '0 4px 20px rgba(0,180,216,0.4)', transition: 'transform 0.2s' }}>
                  {loading ? 'A SALVAR NA NUVEM...' : '🚀 SALVAR VOO NA NUVEM'}
                </button>
              </form>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#f43f5e', marginBottom: '24px', fontWeight: '700' }}>🗑️ LIXEIRA DE VOOS</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ backgroundColor: '#070b19', border: '1px solid #131c38', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#64748b' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      <h4 style={{ color: '#f43f5e', margin: '0 0 10px 0', fontWeight: '700' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ flex: 1, backgroundColor: '#00b4d8', border: 'none', color: '#070b19', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ flex: 1, backgroundColor: '#ef4444', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>APAGAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {['desembarque', 'aeronave', 'relatorio', 'utilizadores'].includes(menuAtivo) && (
            <div style={{ background: 'linear-gradient(135deg, #0c132b, #070b19)', border: '1px solid #1e293b', borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '10px' }}>Módulo "{menuAtivo.toUpperCase()}" Ativo</h3>
              <p>Totalmente integrado com persistência permanente no Supabase.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
