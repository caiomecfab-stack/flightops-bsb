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

      alert('Voo registado com sucesso!');
      setFormVoo({ aeronave: 'C-95 (BANDEIRANTE)', matricula: '', rota: '', dataVoo: '', horaChamada: '', horaDecolagem: '', horaReal: '', pax: '', pesoPax: '', bagagem: '' });
      setMenuAtivo('painel');
      carregarVoos();
    } catch (err) {
      alert('Erro ao adicionar voo: ' + err.message);
    }
  }

  async function moverParaLixeira(id, prefixo) {
    if (!window.confirm(`Deseja realmente enviar o voo ${prefixo || ''} para a lixeira?`)) return;
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
      alert('Erro ao excluir definitivamente: ' + err.message);
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b19', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #141c3a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #141c3a' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '10px', borderRadius: '10px', color: '#070b19', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#8d99ae' }}>POSTO CAN BR</small>
            </div>
          )}
        </div>

        <div style={{ padding: '15px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <div onClick={() => setMenuAtivo('dashboard')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'dashboard' ? '#00b4d8' : 'transparent', color: menuAtivo === 'dashboard' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'dashboard' ? 'bold' : 'normal' }}>
            📊 {sidebarAberto && 'Dashboard'}
          </div>
          <div onClick={() => setMenuAtivo('painel')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'painel' ? '#00b4d8' : 'transparent', color: menuAtivo === 'painel' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'painel' ? 'bold' : 'normal' }}>
            📋 {sidebarAberto && 'Painel de Voos'}
          </div>
          <div onClick={() => setMenuAtivo('adicionar')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'adicionar' ? '#00b4d8' : 'transparent', color: menuAtivo === 'adicionar' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'adicionar' ? 'bold' : 'normal' }}>
            ➕ {sidebarAberto && 'Adicionar Voo'}
          </div>
          <div onClick={() => setMenuAtivo('desembarque')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'desembarque' ? '#00b4d8' : 'transparent', color: menuAtivo === 'desembarque' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'desembarque' ? 'bold' : 'normal' }}>
            🛬 {sidebarAberto && 'Desembarque'}
          </div>
          <div onClick={() => setMenuAtivo('aeronave')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'aeronave' ? '#00b4d8' : 'transparent', color: menuAtivo === 'aeronave' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'aeronave' ? 'bold' : 'normal' }}>
            ✈️ {sidebarAberto && 'Adicionar Aeronave'}
          </div>
          <div onClick={() => setMenuAtivo('relatorio')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'relatorio' ? '#00b4d8' : 'transparent', color: menuAtivo === 'relatorio' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'relatorio' ? 'bold' : 'normal' }}>
            🖨️ {sidebarAberto && 'Imprimir Relatório'}
          </div>
          <div onClick={() => setMenuAtivo('utilizadores')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'utilizadores' ? '#00b4d8' : 'transparent', color: menuAtivo === 'utilizadores' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'utilizadores' ? 'bold' : 'normal' }}>
            👥 {sidebarAberto && 'Utilizadores'}
          </div>
          <div onClick={() => setMenuAtivo('lixeira')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'lixeira' ? '#ff4d4d' : 'transparent', color: menuAtivo === 'lixeira' ? '#fff' : '#ff6b6b', fontWeight: menuAtivo === 'lixeira' ? 'bold' : 'normal', marginTop: '10px', border: '1px dashed rgba(255, 107, 107, 0.4)' }}>
            🗑️ {sidebarAberto && `Lixeira (${voosLixeira.length})`}
          </div>
        </div>

        <div style={{ padding: '15px 12px', borderTop: '1px solid #141c3a' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#111936', border: '1px solid #1c2541', color: '#8d99ae', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
            {sidebarAberto ? '◀ Ocultar' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b19' }}>
        <div style={{ height: '70px', borderBottom: '1px solid #141c3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>FLIGHTOPS BSB</h2>
          <span style={{ backgroundColor: '#0b2b24', color: '#06d6a0', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>OPERACIONAL</span>
        </div>

        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          {menuAtivo === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE VOOS</div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', margin: '15px 0' }}>{totalVoos}</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL PAX</div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', margin: '15px 0' }}>{totalPax}</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b', margin: '15px 0' }}>{pesoTotalTransp} KG</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>PAINEL DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Nenhum voo registado.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#00b4d8', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>➕ ADICIONAR VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }}>
                  {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="text" required placeholder="Rota (Ex: SBBR-SBGR)" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input type="number" placeholder="Total PAX" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                  <input type="number" placeholder="Bagagem (KG)" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                </div>
                <button type="submit" style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>GRAVAR NA NUVEM</button>
              </form>
            </div>
          )}

          {menuAtivo === 'desembarque' && (
            <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Módulo de Desembarque Ativo.</div>
          )}

          {menuAtivo === 'aeronave' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>✈️ GERIR AERONAVES</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nova Aeronave" value={novaAeronave} onChange={e => setNovaAeronave(e.target.value)} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px', flex: 1 }} />
                <button onClick={() => { if(novaAeronave) { setAeronaves([...aeronaves, novaAeronave.toUpperCase()]); setNovaAeronave(''); }}} style={{ backgroundColor: '#00b4d8', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ADICIONAR</button>
              </div>
              {aeronaves.map(a => <div key={a} style={{ padding: '8px', borderBottom: '1px solid #1c2541' }}>{a}</div>)}
            </div>
          )}

          {menuAtivo === 'relatorio' && (
            <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Módulo de Relatórios Ativo.</div>
          )}

          {menuAtivo === 'utilizadores' && (
            <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Módulo de Utilizadores Ativo.</div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ff6b6b', marginBottom: '20px' }}>🗑️ LIXEIRA</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#ff6b6b', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ backgroundColor: '#00b4d8', border: 'none', color: '#070b19', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ backgroundColor: '#ff6b6b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR</button>
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
