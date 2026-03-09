// Smooth navigation - Toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');
navToggle.onclick = () => navList.classList.toggle('open');
document.querySelectorAll('.navbar a').forEach(link => {
  link.addEventListener('click', () => navList.classList.remove('open'));
});
// Smooth scroll for nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.onclick = function(e) {
    const targetId = this.getAttribute('href');
    if(targetId && document.querySelector(targetId)) {
      e.preventDefault();
      document.querySelector(targetId).scrollIntoView({behavior:'smooth'});
    }
  }
});

// Mark active TOC nav
window.addEventListener('scroll', function() {
  const fromTop = window.scrollY + 80, links = document.querySelectorAll('.navbar a');
  links.forEach(link => {
    let sec = document.querySelector(link.hash);
    if(sec && sec.offsetTop <= fromTop && sec.offsetTop + sec.offsetHeight > fromTop) {
      links.forEach(l=>l.classList.remove('active-link'));
      link.classList.add('active-link');
    }
  });
});

/* --------------------------
   3Dmol.js -- 3D PMMA Model
--------------------------- */
// Use example SMILES for a PMMA oligomer fragment
const pmma3dStr = 'CC(C)(C(=O)OCC)C(C(=O)OCC)C';
let viewer;
function load3DViewer() {
  viewer = $3Dmol.createViewer("pmma-3d", {backgroundColor:"#eef6fa"});
  viewer.addModel(pmma3dStr, "smiles");
  viewer.setStyle({}, {stick:{radius:.18}, sphere:{scale:.24}});
  viewer.zoomTo();
  viewer.render();
}
function resetView() {viewer.zoomTo(); viewer.render();}
function zoom(d) {viewer.zoom(d); viewer.render();}
window.addEventListener('DOMContentLoaded', load3DViewer);

/* ----------------------------
   Interactive Tacticity Viewer
---------------------------- */
const tacticitySvgs = {
  isotactic: [[10,30],[50,30],[90,30],[130,30],[170,30]],
  syndiotactic: [[10,30],[50,70],[90,30],[130,70],[170,30]],
  atactic: [[10,70],[50,30],[90,70],[130,30],[170,70]],
};
const tacticityDesc = {
  isotactic: 'Isotactic: All side groups on the same side of the polymer backbone.',
  syndiotactic: 'Syndiotactic: Side groups alternate positions along the chain.',
  atactic: 'Atactic: Random arrangement of side groups along the chain.',
};
function drawTacticity(type='isotactic') {
  const svg = document.getElementById('tacticity-svg');
  svg.innerHTML = '';
  // Main backbone
  svg.innerHTML += `<rect x="0" y="40" width="400" height="10" rx="5" fill="#2699cd"/>`;
  for(let i=0;i<5;i++) {
    svg.innerHTML += `<circle cx="${40+80*i}" cy="45" r="10" fill="#ffb348"  stroke="#fe7700" stroke-width="1.5" />`;
    svg.innerHTML += `<rect x="${37+80*i}" y="15" width="6" height="30" fill="#95d7ff"/>`;
    svg.innerHTML += `<circle cx="${tacticitySvgs[type][i][0]+30*i}" cy="${tacticitySvgs[type][i][1]}" r="8" fill="#97e04a" />`;
  }
  document.getElementById('tacticity-desc').textContent = tacticityDesc[type];
}
drawTacticity('isotactic');
document.querySelectorAll('.tacticity-buttons button').forEach(btn => {
  btn.onclick = function() {
    document.querySelectorAll('.tacticity-buttons button').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    drawTacticity(this.dataset.type);
  }
});

/* --------------------------
   Polymerization Simulation
--------------------------- */
function startReactor() {
  const canvas = document.getElementById('reactor-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw vessel
  ctx.fillStyle = "#b5cff7";
  ctx.fillRect(70,30,180,120);
  ctx.strokeStyle = "#397bbe";
  ctx.lineWidth = 5;
  ctx.strokeRect(70,30,180,120);

  // Animate chains
  let chains = Array.from({length:16},()=>[
    Math.random()*180+80, Math.random()*100+40
  ]);
  let frame=0;
  function animate() {
    ctx.fillStyle = "#bee9fc";
    ctx.fillRect(72,32,176,116);
    // Show initiators
    for(let c=0; c<chains.length; c++) {
      ctx.beginPath();
      ctx.arc(chains[c][0],chains[c][1],6,0,2*Math.PI);
      ctx.fillStyle = "#ff7e79";
      ctx.fill();
      ctx.strokeStyle="#be3753"; ctx.lineWidth=1.7;
      ctx.stroke();
    }
    // Draw growing chains ("snake" lines)
    ctx.strokeStyle = "#4062b7";
    ctx.lineWidth = 2.5;
    for(let c=0; c<chains.length; c++) {
      ctx.beginPath();
      ctx.moveTo(chains[c][0],chains[c][1]);
      for(let seg=1; seg<1+frame/10; seg++) {
        let px = chains[c][0] + Math.sin(0.7*seg+c)*seg*5;
        let py = chains[c][1] + Math.cos(0.7*seg-c)*seg*4;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    frame+=1;
    if(frame<80) requestAnimationFrame(animate);
  }
  animate();
}

/* --------------------------
   Interactive Stress-Strain
--------------------------- */
const ctx = document.getElementById('stressStrainChart').getContext('2d');
let stressData = Array.from({length:101},(_,i)=> {
  let strain = i/10, E = 2100, yield=6, max=8.5, y, 
      eps_y=3.5, eps_u=7.6;
  if(strain<eps_y) y=E*strain/100;
  else if(strain<eps_u) y=yield + (max-yield)*(strain-eps_y)/(eps_u-eps_y);
  else y = max-(strain-eps_u)*2;
  return y>0? y:0;
});
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array.from({length:101},(_,i)=> (i/10).toFixed(1)),
    datasets: [{
      label: 'Stress (MPa)',
      data: stressData,
      borderColor: '#1976d2',
      borderWidth: 2.7,
      pointRadius: 0,
      fill: false,
      tension: 0.20,
    }]
  },
  options: {
    responsive:true,
    scales:{
      x: {title:{display:true, text:'Strain (%)'}, min:0, max:10},
      y: {title:{display:true, text:'Stress (MPa)'}, min:0, max:10}
    },
    plugins: {
      legend: {display: false},
      tooltip: {
        callbacks: {
          label: v => ` ${v.parsed.y.toFixed(2)} MPa, Strain ${v.label}%`
        }
      }
    }
  }
});
const slider = document.getElementById('strain-slider'), sval = document.getElementById('strain-value');
slider.oninput = function() {
  sval.textContent = this.value;
  let idx = Math.round(this.value*10);
  chart.options.plugins.annotation = {
    annotations: {
      marker: {
        type: 'point',
        xValue: this.value,
        yValue: stressData[idx],
        radius:7,
        backgroundColor:'#eb4336'
      }
    }
  };
  chart.update();
}
sval.textContent = slider.value;

// End main.js