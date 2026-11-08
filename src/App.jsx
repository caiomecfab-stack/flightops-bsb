import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('painel');
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
    const confirmar = window.confirm(`Deseja realmente excluir o voo ${prefixo}?`);
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('voos')
        .update({ excluido: true })
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir voo: ' + err.message);
    }
  }

  async function excluirDefinitivo(id) {
    const confirmar = window.confirm('Deseja excluir este item permanentemente?');
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('voos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir definitivamente: ' + err.message);
    }
  }

  async function restaurarVoo(id) {
    try {
      const { error } = await supabase
        .from('voos')
        .update({ excluido: false })
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao restaurar voo: ' + err.message);
    }
  }

  const voosAtivos = voos.filter(v => !v.excluido);
  const voosLixeira = voos.filter(v => v.excluido);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b132b', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #1c2541', transition: 'width 0.3s', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1c2541' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#00b4d8' }}>FLIGHTOPS BSB</span>}
        </div>

        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div 
            onClick={() => setMenuAtivo('painel')}
            style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'painel' ? '#1d3557' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            📊 {sidebarAberto && <span>Painel de Voos</span>}
          </div>

          <div 
            onClick={() => setMenuAtivo('lixeira')}
            style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'lixeira' ? '#1d3557' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff6b6b' }}
          >
            🗑️ {sidebarAberto && <span>Lixeira ({voosLixeira.length})</span>}
          </div>
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid #1c2541', textAlign: 'center' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ background: 'transparent', border: 'none', color: '#8d99ae', cursor: 'pointer' }}>
            {sidebarAberto ? '◀ Ocultar Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Topbar */}
        <div style={{ height: '70px', borderBottom: '1px solid #1c2541', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>FLIGHTOPS BSB</h2>
            <small style={{ color: '#8d99ae' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#06d6a0', color: '#000', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>POSTO CAN BR OPERACIONAL</span>
            <span style={{ backgroundColor: '#1d3557', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Área de Trabalho */}
        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'painel' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>PAINEL DE REGISTO DE VOOS — POSTO CAN BR</h3>
                <span style={{ color: '#8d99ae' }}>{voosAtivos.length} REGISTOS</span>
              </div>

              {voosAtivos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8d99ae' }}>
                  Nenhum voo registado na base de dados no momento.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#4cc9f0', fontSize: '18px' }}>{voo.prefixo}</h4>
                          <small style={{ color: '#8d99ae' }}>ROTA: {voo.rota}</small>
                        </div>
                        <span style={{ backgroundColor: '#1d3557', color: '#4cc9f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>{voo.status || 'REGISTADO'}</span>
                      </div>

                      <div style={{ backgroundColor: '#0b132b', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span>Horário: <strong>{voo.horario}</strong></span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1c2541', paddingTop: '10px' }}>
                        <small style={{ color: '#8d99ae' }}>Sincronizado Nuvem</small>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px' }}>APAGAR</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#ff6b6b' }}>🗑️ LIXEIRA DE VOOS</h3>
                <small style={{ color: '#8d99ae' }}>Voos movidos para a lixeira podem ser restaurados ou excluídos permanentemente.</small>
              </div>

              {voosLixeira.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8d99ae' }}>
                  A lixeira está vazia.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #ff6b6b33', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#ff6b6b', fontSize: '18px' }}>{voo.prefixo}</h4>
                        <small style={{ color: '#8d99ae' }}>ROTA: {voo.rota}</small>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1c2541', paddingTop: '10px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ background: '#1d3557', border: 'none', color: '#4cc9f0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ background: '#ff6b6b22', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>EXCLUIR DEFINITIVO</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
