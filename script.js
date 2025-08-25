const API_BASE='/.netlify/functions';
const els={
  players:document.getElementById('players'),
  loser:document.getElementById('loserBadge'),
  add:document.getElementById('addBtn'),
  input:document.getElementById('newPlayer'),
  reset:document.getElementById('resetBtn'),
};

async function fetchJSON(url,opts){const r=await fetch(url,opts);if(!r.ok)throw new Error(await r.text());return r.json();}

async function loadPlayers(){
  try {
    const players=await fetchJSON(`${API_BASE}/get-players`);
    render(players);
  } catch(e){
    console.error('Error loadPlayers:', e);
    els.players.innerHTML='<p style="color:red">Error cargando jugadores. Revisa la DB.</p>';
    els.loser.textContent='Error al conectar';
  }
}

function render(players){
  players.sort((a,b)=>a.points-b.points);
  els.players.innerHTML='';
  const min = players.length? players[0].points : null;
  els.loser.textContent = players.length ? `Perdedor actual: ${players.filter(p=>p.points===min).map(p=>p.name).join(', ')} (${min} pts)` : 'Sin jugadores';

  players.forEach((p,idx)=>{
    const card=document.createElement('div');
    card.className='card';
    card.innerHTML=`
      <div class="info">
        <div class="rank">${idx+1}</div>
        <div>
          <div class="name">${p.name}</div>
          <div class="points">${p.points} puntos</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn minus" data-n="${p.name}" data-d="-1">-1</button>
        <button class="btn plus" data-n="${p.name}" data-d="1">+1</button>
        <button class="btn del" data-del="${p.name}">×</button>
      </div>
    `;
    els.players.appendChild(card);
  });
}

async function updatePoints(name,delta){
  try {
    const res = await fetchJSON(`${API_BASE}/update-players`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name, delta})
    });
    await loadPlayers();
  } catch(e){
    console.error('Error updatePoints:', e);
  }
}

async function deletePlayer(name){
  try{
    await fetchJSON(`${API_BASE}/update-players`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({delete:true,name})
    });
    await loadPlayers();
  } catch(e){console.error('Error deletePlayer:', e);}
}

async function addPlayer(){
  const name=els.input.value.trim();
  if(!name) return;
  try{
    await fetchJSON(`${API_BASE}/update-players`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,delta:0})
    });
    els.input.value='';
    await loadPlayers();
  } catch(e){console.error('Error addPlayer:', e);}
}

async function resetAll(){
  if(!confirm('¿Resetear todos los puntos a 0?')) return;
  try{
    await fetchJSON(`${API_BASE}/update-players`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({reset:true})
    });
    await loadPlayers();
  } catch(e){console.error('Error resetAll:', e);}
}

els.add.addEventListener('click',addPlayer);
els.input.addEventListener('keydown',e=>{if(e.key==='Enter') addPlayer();});
els.reset.addEventListener('click',resetAll);
els.players.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn) return;
  if(btn.dataset.n && btn.dataset.d){ updatePoints(btn.dataset.n, Number(btn.dataset.d)); }
  if(btn.dataset.del){ if(confirm('¿Eliminar jugador?')) deletePlayer(btn.dataset.del); }
});

loadPlayers();