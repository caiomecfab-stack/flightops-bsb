import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar */}
      <div style={{ width: sidebarAberto ? '280px' : '84px', background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ background: '#38bdf8', padding: '10px', borderRadius: '12px', color: '#020617', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#94a3b8' }}>POSTO CAN BR — SBBR</small>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map(item => {
            const ativo = menuAtivo === item.id;
            return (
              <div key={item.id} onClick={() => setMenuAtivo(item.id)} style={{ padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', background: ativo ? (item.danger ? '#ef4444' : '#38bdf8') : 'transparent', color: ativo ? '#020617' : (item.danger ? '#f87171' : '#94a3b8'), fontWeight: ativo ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {sidebarAberto && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#1e293b', border: 'none', color: '#94a3b8', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            {sidebarAberto ? '◀ Recolher' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        <div style={{ height: '70px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>GESTÃO OPERACIONAL DE VOOS</h2>
          <span style={{ background: '#064e3b', color: '#34d399', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>● OPERACIONAL ONLINE</span>
        </div>

        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE VOOS</div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', margin: '15px 0' }}>{totalVoos}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>TOTAL PAX</div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#38bdf8', margin: '15px 0' }}>{totalPax}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f43f5e', margin: '15px 0' }}>{pesoTotalTransp} KG</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>PAINEL DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Nenhum voo registado na base de dados.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px' }}>
                      <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <p style={{ margin: '5px 0', color: '#94a3b8', fontSize: '13px' }}>PAX: {voo.pax} | Bagagem: {voo.bagagem} KG</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>➕ ADICIONAR VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '12px', borderRadius: '8px' }}>
                  {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="text" required placeholder="Rota (Ex: SBBR-SBGR)" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input type="number" placeholder="Total PAX" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                  <input type="number" placeholder="Bagagem (KG)" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                </div>
                <button type="submit" style={{ background: '#38bdf8', color: '#020617', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>GRAVAR NA NUVEM</button>
              </form>
            </div>
          )}

          {menuAtivo === 'desembarque' && (
            <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Módulo de Desembarque Ativo.</div>
          )}

          {menuAtivo === 'aeronave' && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>✈️ GERIR AERONAVES</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nova Aeronave" value={novaAeronave} onChange={e => setNovaAeronave(e.target.value)} style={{ background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '10px', borderRadius: '8px', flex: 1 }} />
                <button onClick={() => { if(novaAeronave) { setAeronaves([...aeronaves, novaAeronave.toUpperCase()]); setNovaAeronave(''); }}} style={{ background: '#38bdf8', border: 'none', color: '#020617', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ADICIONAR</button>
              </div>
              {aeronaves.map(a => <div key={a} style={{ padding: '10px', borderBottom: '1px solid #1e293b' }}>{a}</div>)}
            </div>
          )}

          {menuAtivo === 'relatorio' && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#38bdf8', margin: 0 }}>🖨️ IMPRESSÃO DE RELATÓRIO</h3>
                <button onClick={() => window.print()} style={{ background: '#38bdf8', color: '#020617', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>IMPRIMIR</button>
              </div>
              <div style={{ background: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
                <h4>Relatório Operacional - Posto CAN BR</h4>
                <p>Total de voos ativos: {totalVoos}</p>
              </div>
            </div>
          )}

          {menuAtivo === 'utilizadores' && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>👥 UTILIZADORES</h3>
              <input type="password" placeholder="Nova senha admin" value={novaSenhaAdmin} onChange={e => setNovaSenhaAdmin(e.target.value)} style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '15px' }} />
              <button onClick={() => { if(novaSenhaAdmin) { alert('Senha alterada!'); setNovaSenhaAdmin(''); }}} style={{ background: '#38bdf8', color: '#020617', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ATUALIZAR</button>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ef4444', marginBottom: '20px' }}>🗑️ LIXEIRA</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '20px' }}>
                      <h4 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ background: '#38bdf8', border: 'none', color: '#020617', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR</button>
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
