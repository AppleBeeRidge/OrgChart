const companies={
  'Applebridge Family':{color:'#DC4405',logo:'family.png'},
  'Applebridge Geoenvironmental':{color:'#E86A99',logo:'geo.png'},
  'AD Plant Hire':{color:'#0072CE',logo:'ad-plant.png'},
  'ZTL Contracting':{color:'#97D700',logo:'ztl.png'},
  'Applebridge':{color:'#00B2A9',logo:'applebridge.png'},
  'Hughes Bros':{color:'#F2A900',logo:'hughes.png'},
  'Applebridge Utilities':{color:'#007C58',logo:'utilities.png'},
  'Jig':{color:'#F2A900',logo:'jig.png'},
  'Tarcon':{color:'#829995',logo:'tarcon.png'}
};
const $=s=>document.querySelector(s);
const makeId=()=>globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function'?globalThis.crypto.randomUUID():`person-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
let state=load()||{company:'Applebridge Family',tiers:4,people:[]};
let zoom=1;

function load(){try{return JSON.parse(localStorage.getItem('applebridge-organigram'));}catch{return null}}
function save(){localStorage.setItem('applebridge-organigram',JSON.stringify(state));$('#saveStatus').textContent='Saved';}
function init(){
  Object.keys(companies).forEach(name=>$('#companySelect').add(new Option(name,name)));
  for(let i=1;i<=8;i++){$('#tierSelect').add(new Option(`${i} tier${i>1?'s':''}`,i));}
  $('#companySelect').value=state.company;$('#tierSelect').value=state.tiers;
  bind();render();
}
function bind(){
  $('#companySelect').onchange=e=>{state.company=e.target.value;save();render()};
  $('#tierSelect').onchange=e=>{state.tiers=+e.target.value;state.people.forEach(p=>p.tier=Math.min(p.tier,state.tiers));save();render()};
  $('#staffForm').onsubmit=submitPerson;$('#cancelEdit').onclick=resetForm;
  $('#exportBtn').onclick=()=>{showToast('Opening print options — choose “Save as PDF”');setTimeout(()=>window.print(),350)};
  $('#clearBtn').onclick=()=>{if(confirm('Start a new chart? This will remove all current team members.')){state.people=[];resetForm();save();render()}};
  $('#zoomIn').onclick=()=>setZoom(Math.min(1.35,zoom+.1));$('#zoomOut').onclick=()=>setZoom(Math.max(.65,zoom-.1));
  window.addEventListener('resize',()=>requestAnimationFrame(drawConnectors));window.addEventListener('beforeprint',()=>requestAnimationFrame(()=>requestAnimationFrame(drawConnectors)));window.addEventListener('afterprint',()=>requestAnimationFrame(drawConnectors));
}
function setZoom(v){zoom=Math.round(v*10)/10;$('#printSheet').style.transform=`scale(${zoom})`;$('#zoomValue').textContent=`${Math.round(zoom*100)}%`;drawConnectors();setTimeout(drawConnectors,50);}
function tierOptions(){const s=$('#staffTier'),current=s.value;s.innerHTML='';for(let i=1;i<=state.tiers;i++)s.add(new Option(`Tier ${i}`,i));s.value=Math.min(+current||1,state.tiers)}
function reportingOptions(editId){const s=$('#reportsTo'),current=s.value;s.innerHTML='';s.add(new Option('No manager / top level',''));state.people.filter(p=>p.id!==editId).sort((a,b)=>a.tier-b.tier).forEach(p=>s.add(new Option(`${p.forename} ${p.surname} — ${p.position}`,p.id)));s.value=current;}
function submitPerson(e){
  e.preventDefault();const id=$('#staffId').value;const person={id:id||makeId(),forename:$('#forename').value.trim(),surname:$('#surname').value.trim(),position:$('#position').value.trim(),tier:+$('#staffTier').value,reportsTo:$('#reportsTo').value||null};
  if(person.reportsTo){const manager=state.people.find(p=>p.id===person.reportsTo);if(manager&&manager.tier>=person.tier){showToast('A manager must be in a higher tier');return}}
  const idx=state.people.findIndex(p=>p.id===id);if(idx>=0)state.people[idx]=person;else state.people.push(person);save();resetForm();render();showToast(idx>=0?'Team member updated':'Team member added');
}
function editPerson(id){const p=state.people.find(x=>x.id===id);if(!p)return;$('#staffId').value=p.id;$('#forename').value=p.forename;$('#surname').value=p.surname;$('#position').value=p.position;tierOptions();$('#staffTier').value=p.tier;reportingOptions(p.id);$('#reportsTo').value=p.reportsTo||'';$('#formHeading').textContent='Edit team member';$('#submitStaff').textContent='Save changes';$('#cancelEdit').classList.remove('hidden');$('.control-panel').scrollTo({top:160,behavior:'smooth'});}
function removePerson(id){const p=state.people.find(x=>x.id===id);if(!confirm(`Remove ${p.forename} ${p.surname}?`))return;state.people=state.people.filter(x=>x.id!==id).map(x=>x.reportsTo===id?{...x,reportsTo:null}:x);save();render();}
function resetForm(){ $('#staffForm').reset();$('#staffId').value='';$('#formHeading').textContent='Add a person';$('#submitStaff').textContent='Add to organigram';$('#cancelEdit').classList.add('hidden');tierOptions();reportingOptions();}
function render(){
  const c=companies[state.company];document.documentElement.style.setProperty('--accent',c.color);$('#companyName').textContent=state.company;$('#companyLogo').src=c.logo;$('#footerLogo').src=c.logo;$('#footerTitle').textContent=`${state.company.toUpperCase()} · COMPANY ORGANIGRAM`;$('#footerDate').textContent=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  tierOptions();reportingOptions($('#staffId').value);renderPeople();renderChart();save();
}
function renderPeople(){const list=$('#peopleList');$('#peopleCount').textContent=state.people.length;if(!state.people.length){list.innerHTML='<div class="people-empty">No team members added yet.</div>';return}list.innerHTML=state.people.slice().sort((a,b)=>a.tier-b.tier||a.surname.localeCompare(b.surname)).map(p=>`<div class="person-row"><div class="person-avatar">${esc(p.forename[0]+p.surname[0])}</div><div><strong>${esc(p.forename)} ${esc(p.surname)}</strong><small>${esc(p.position)} · Tier ${p.tier}</small></div><div class="row-actions"><button data-edit="${p.id}">Edit</button><button data-delete="${p.id}">×</button></div></div>`).join('');list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPerson(b.dataset.edit));list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removePerson(b.dataset.delete));}
function renderChart(){const tiers=$('#tiers');tiers.innerHTML='';for(let i=1;i<=state.tiers;i++){const row=document.createElement('div');row.className='tier-row';row.dataset.tier=i;state.people.filter(p=>p.tier===i).forEach(p=>{const card=document.createElement('div');card.className='org-card';card.dataset.id=p.id;card.innerHTML=`<span class="tier-badge">${i}</span><strong>${esc(p.forename)} ${esc(p.surname)}</strong><span>${esc(p.position)}</span>`;card.onclick=()=>editPerson(p.id);row.appendChild(card)});tiers.appendChild(row)}$('#emptyState').classList.toggle('hidden',state.people.length>0);drawConnectors();setTimeout(drawConnectors,50);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(drawConnectors);}
function drawConnectors(){const svg=$('#connectors'),area=svg.getBoundingClientRect(),scale=area.width/svg.clientWidth||zoom||1,w=svg.clientWidth,h=svg.clientHeight;svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');svg.innerHTML='';state.people.forEach(p=>{if(!p.reportsTo)return;const child=document.querySelector(`[data-id="${CSS.escape(p.id)}"]`),parent=document.querySelector(`[data-id="${CSS.escape(p.reportsTo)}"]`);if(!child||!parent)return;const a=parent.getBoundingClientRect(),b=child.getBoundingClientRect();const x1=(a.left+a.width/2-area.left)/scale,y1=(a.bottom-area.top)/scale,x2=(b.left+b.width/2-area.left)/scale,y2=(b.top-area.top)/scale,mid=(y1+y2)/2;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('class','connector');path.setAttribute('d',`M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`);svg.appendChild(path);[[x1,y1],[x2,y2]].forEach(([cx,cy])=>{const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('class','connector-dot');dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.setAttribute('r','3.5');svg.appendChild(dot)})});}
function esc(v=''){return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
let toastTimer;function showToast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
init();
