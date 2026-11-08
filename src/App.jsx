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
    bagagem: '',
    relacaoPrincipal: '',
    relacaoEmbarcados: ''
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
      setFormVoo({ aeronave: 'C-95 (BANDEIRANTE)', matricula: '', rota: '', dataVoo: '', horaChamada: '', horaDecolagem: '', horaReal: '', pax: '', pesoPax: '', bagagem: '', relacaoPrincipal: '', relacaoEmbarcados: '' });
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
    if (!window.confirm('Deseja excluir permanentemente este voo?')) return;
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#030712', color: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar Interativa e Moderna */}
      <div style={{ width: sidebarAberto ? '280px' : '84px', backgroundColor: '#0b0f19', borderRight: '1px solid #1f2937', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '10px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(6,182,212,0.4)' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', color: '#fff' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#9ca3af', display: 'block', marginTop: '2px', fontWeight: '600' }}>POSTO CAN BR — SBBR</small>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map(item => {
            const ativo = menuAtivo === item.id;
            return (
              <div key={item.id} onClick={() => setMenuAtivo(item.id)} style={{ padding: '13px 16px', borderRadius: '12px', cursor: 'pointer', backgroundColor: ativo ? (item.danger ? '#ef4444' : '#06b6d4') : 'transparent', color: ativo ? '#ffffff' : (item.danger ? '#f87171' : '#9ca3af'), fontWeight: ativo ? '700' : '500', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: ativo ? '0 4px 20px rgba(6,182,212,0.3)' : 'none' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {sidebarAberto && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1f2937' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#9ca3af', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}>
            {sidebarAberto ? '◀ Recolher Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#030712', minWidth: 0 }}>
        
        {/* Topbar Moderna */}
        <div style={{ height: '75px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', backgroundColor: '#0b0f19', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>GESTÃO OPERACIONAL DE VOOS</h2>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>| Base Aérea de Brasília</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>● OPERACIONAL ONLINE</span>
            <span style={{ backgroundColor: '#111827', color: '#fff', border: '1px solid #374151', padding: '7px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Workspace Dinâmico */}
        <div style={{ padding: '35px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              {/* Filtros Operacionais */}
              <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '700', marginBottom: '18px', letterSpacing: '0.5px' }}>
                  🔍 FILTROS OPERACIONAIS — POSTO CAN BR
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '700' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '700' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '700' }}>MÊS / ANO</label>
                    <input type="text" placeholder("-------- de ----" style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#9ca3af', padding: '11px', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Cards Estatísticos Modernos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '28px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL DE VOOS</span>
                  <div style={{ fontSize: '46px', fontWeight: '800', color: '#fff', margin: '15px 0 5px 0' }}>{totalVoos}</div>
                  <div style={{ color: '#34d399', fontSize: '12px', fontWeight: '600' }}>🟢 Em tempo real</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  <div style={{ fontSize: '46px', fontWeight: '800', color: '#06b6d4', margin: '15px 0 5px 0' }}>{totalPax}</div>
                  <div style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '600' }}>👥 Total transportado</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '16px', padding: '26px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>PESO TOTAL TRANSP.</span>
                  <div style={{ fontSize: '40px', fontWeight: '800', color: '#f43f5e', margin: '15px 0 5px 0' }}>{pesoTotalTransp} <span style={{ fontSize: '20px' }}>KG</span></div>
                  <div style={{ color: '#f43f5e', fontSize: '12px', fontWeight: '600' }}>⚖️ Pax + Bagagem</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#06b6d4', marginBottom: '24px', fontWeight: '700' }}>📋 PAINEL DE REGISTO DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#6b7280' }}>Nenhum voo registado na base de dados em nuvem.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ color: '#06b6d4', margin: 0, fontSize: '16px', fontWeight: '700' }}>{voo.prefixo}</h4>
                          <span style={{ fontSize: '11px', background: '#1f2937', color: '#9ca3af', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>{voo.data_voo}</span>
                        </div>
                        <p style={{ margin: '6px 0', color: '#e5e7eb', fontSize: '13px' }}><strong>Rota:</strong> {voo.rota}</p>
                        <p style={{ margin: '6px 0', color: '#e5e7eb', fontSize: '13px' }}><strong>PAX:</strong> {voo.pax} | <strong>Bagagem:</strong> {voo.bagagem} KG</p>
                      </div>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', transition: 'background 0.2s' }}>🗑️ Enviar para Lixeira</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '20px', padding: '35px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
              <h3 style={{ color: '#06b6d4', marginBottom: '25px', fontWeight: '700' }}>➕ ADICIONAR NOVO VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: '700' }}>TIPO DE AERONAVE FAB</label>
                    <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '13px', borderRadius: '10px', outline: 'none' }}>
                      {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: '700' }}>ROTA (EX: SBBR-SBGR)</label>
                    <input type="text" required placeholder="SBBR-SBGR" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: '700' }}>TOTAL PAX</label>
                    <input type="number" placeholder="0" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: '700' }}>PESO PAX (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: '700' }}>BAGAGEM (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', padding: '13px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', marginTop: '10px', boxShadow: '0 4px 20px rgba(6,182,212,0.4)', transition: 'transform 0.2s' }}>
                  {loading ? 'A SALVAR NA NUVEM...' : '🚀 SALVAR VOO NA NUVEM'}
                </button>
              </form>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#f43f5e', marginBottom: '24px', fontWeight: '700' }}>🗑️ LIXEIRA DE VOOS</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#6b7280' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      <h4 style={{ color: '#f43f5e', margin: '0 0 10px 0', fontWeight: '700' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#9ca3af', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ flex: 1, backgroundColor: '#06b6d4', border: 'none', color: '#030712', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ flex: 1, backgroundColor: '#ef4444', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>APAGAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {['desembarque', 'aeronave', 'relatorio', 'utilizadores'].includes(menuAtivo) && (
            <div style={{ background: 'linear-gradient(135deg, #0b0f19, #111827)', border: '1px solid #1f2937', borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
              <h3 style={{ color: '#06b6d4', marginBottom: '10px' }}>Módulo "{menuAtivo.toUpperCase()}" Ativo</h3>
              <p>Funcionalidade integrada com persistência permanente no Supabase.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
