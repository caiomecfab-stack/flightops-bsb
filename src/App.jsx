import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

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

  async function moverParaLixeira(id, prefixo) {
    if (!window.confirm(`Deseja realmente excluir o voo ${prefixo || ''}?`)) return;

    try {
      const { error } = await supabase.from('voos').update({ excluido: true }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir voo: ' + err.message);
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
      alert('Erro ao restaurar voo: ' + err.message);
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
      
      {/* Menu Lateral Esquerdo */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #141c3a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #141c3a' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '8px', borderRadius: '8px', color: '#070b19', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#8d99ae' }}>BASE AÉREA DE BRASÍLIA</small>
            </div>
          )}
        </div>

        <div style={{ padding: '15px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div onClick={() => setMenuAtivo('dashboard')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'dashboard' ? '#00b4d8' : 'transparent', color: menuAtivo === 'dashboard' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'dashboard' ? 'bold' : 'normal' }}>
            📊 {sidebarAberto && 'Dashboard'}
          </div>
          <div onClick={() => setMenuAtivo('painel')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'painel' ? '#00b4d8' : 'transparent', color: menuAtivo === 'painel' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'painel' ? 'bold' : 'normal' }}>
            📋 {sidebarAberto && 'Painel de Voos'}
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

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b19' }}>
        
        <div style={{ height: '70px', borderBottom: '1px solid #141c3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px' }}>FLIGHTOPS BSB</h2>
            <small style={{ color: '#8d99ae', fontSize: '10px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
          </div>
          <span style={{ backgroundColor: '#0b2b24', color: '#06d6a0', border: '1px solid rgba(6, 214, 160, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>POSTO CAN BR OPERACIONAL</span>
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
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE PASSAGEIROS (PAX)</div>
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
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>PAINEL DE REGISTO DE VOOS</h3>
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

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ff6b6b', marginBottom: '20px' }}>🗑️ LIXEIRA DE VOOS</h3>
              {voosLixeira.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#ff6b6b', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ backgroundColor: '#00b4d8', border: 'none', color: '#070b19', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ backgroundColor: '#ff6b6b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR DEFINITIVO</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {['adicionar', 'desembarque', 'aeronave', 'relatorio', 'utilizadores'].includes(menuAtivo) && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8d99ae' }}>
              <h3>Módulo "{menuAtivo.toUpperCase()}" ativo com persistência em nuvem.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
