const canvas = document.getElementById('canvasCircuito');
const ctx = canvas.getContext('2d');
const resistoresContainer = document.getElementById('resistoresContainer');
const agregarBtn = document.getElementById('agregarResistorBtn');
const reiniciarBtn = document.getElementById('reiniciarBtn');
const form = document.getElementById('formCircuito');
const descargarBtn = document.getElementById('descargarImagenBtn');
let resistoresCount = 0;
const maxRes = 10;

agregarBtn.addEventListener('click', agregarResistor);
reiniciarBtn.addEventListener('click', reiniciarCircuito);
form.addEventListener('submit', e => { e.preventDefault(); calcularYdibujar(); });
descargarBtn.addEventListener('click', () => { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'circuito_RAYDC.png'; a.click(); });

function agregarResistor() {
  if (resistoresCount >= maxRes) return;
  resistoresCount++;
  const div = document.createElement('div');
  div.id = 'resDiv' + resistoresCount;
  div.style.display = 'flex';
  div.style.gap = '6px';
  const label = document.createElement('label');
  label.textContent = `R${resistoresCount}:`;
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.id = 'resistor' + resistoresCount;
  input.className = 'resistencia';
  input.style.width = '90px';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'X';
  btn.addEventListener('click', () => { div.remove(); reindexar(); agregarBtn.style.display = ''; });
  div.appendChild(label);
  div.appendChild(input);
  div.appendChild(btn);
  resistoresContainer.appendChild(div);
  if (resistoresCount >= maxRes) agregarBtn.style.display = 'none';
}

function reindexar() {
  const grupos = Array.from(resistoresContainer.children);
  resistoresCount = grupos.length;
  grupos.forEach((g, i) => {
    const lbl = g.querySelector('label');
    lbl.textContent = `R${i + 1}:`;
    const inp = g.querySelector('input');
    inp.id = 'resistor' + (i + 1);
  });
}

function reiniciarCircuito() {
  resistoresContainer.innerHTML = '';
  resistoresCount = 0;
  document.getElementById('voltaje').value = '';
  document.getElementById('tipo').value = 'serie';
  document.getElementById('resultados').innerHTML = '';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  agregarBtn.style.display = '';
}

function calcularYdibujar() {
  const voltStr = document.getElementById('voltaje').value;
  const voltaje = parseFloat(voltStr);
  const tipo = document.getElementById('tipo').value;
  if (isNaN(voltaje)) { alert('Ingrese un voltaje válido.'); return; }
  const vals = [];
  for (let i = 1; i <= resistoresCount; i++) {
    const el = document.getElementById('resistor' + i);
    if (!el) continue;
    const v = parseFloat(el.value);
    if (!isNaN(v) && v > 0) vals.push(v);
  }
  if (vals.length === 0) { alert('Ingrese al menos un resistor válido.'); return; }
  let resultados = [], req = 0, itotal = 0;
  if (tipo === 'serie') {
    req = vals.reduce((a, b) => a + b, 0);
    itotal = voltaje / req;
    resultados = vals.map(r => ({ R: r, I: itotal, V: itotal * r }));
  } else {
    const sumaRec = vals.reduce((a, b) => a + 1 / b, 0);
    req = 1 / sumaRec;
    itotal = voltaje / req;
    resultados = vals.map(r => ({ R: r, I: voltaje / r, V: voltaje }));
  }
  mostrarResultados(resultados, req, itotal);
  dibujarCircuito(resultados, tipo, voltaje);
}

function mostrarResultados(resultados, req, itotal) {
  let html = `<h3>Resultados</h3><table><tr><th>Resistor (Ω)</th><th>Corriente (A)</th><th>Voltaje (V)</th></tr>`;
  resultados.forEach((r, i) => { html += `<tr><td>R${i + 1} = ${r.R}</td><td>${r.I.toFixed(2)}</td><td>${r.V.toFixed(2)}</td></tr>`; });
  html += `</table><p>Req: ${req.toFixed(2)} Ω</p><p>Itotal: ${itotal.toFixed(2)} A</p>`;
  document.getElementById('resultados').innerHTML = html;
}

function drawZigzagHoriz(x, y, length, amp, peaks) {
  const seg = length / (peaks * 2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < peaks * 2; i++) {
    const nx = x + seg * (i + 1);
    const ny = (i % 2 === 0) ? y - amp : y + amp;
    ctx.lineTo(nx, ny);
  }
  ctx.stroke();
}

function drawZigzagVert(x, y, length, amp, peaks) {
  const seg = length / (peaks * 2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < peaks * 2; i++) {
    const ny = y + seg * (i + 1);
    const nx = (i % 2 === 0) ? x + amp : x - amp;
    ctx.lineTo(nx, ny);
  }
  ctx.stroke();
}

function dibujarCircuito(resultados, tipo, voltaje) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'black';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  const centerY = canvas.height / 2;
  const batX = 30;
  const longH = 50;
  const shortH = 18;
  const gap = 12;
  ctx.beginPath(); ctx.moveTo(batX, centerY - longH / 2); ctx.lineTo(batX, centerY + longH / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(batX + gap, centerY - shortH / 2); ctx.lineTo(batX + gap, centerY + shortH / 2); ctx.stroke();
  ctx.fillText(`${voltaje} V`, batX + gap + 36, centerY - longH / 2 - 6);
  const sizeRes = 120;
  const amp = 18;
  const peaks = 6;
  if (tipo === 'serie') {
    const startX = batX + 80;
    const yLine = centerY;
    const espacio = 60;
    let x = startX;
    ctx.beginPath(); ctx.moveTo(batX + gap + 20, yLine); ctx.lineTo(startX, yLine); ctx.stroke();
    for (let i = 0; i < resultados.length; i++) {
      drawZigzagHoriz(x, yLine, sizeRes, amp, peaks);
      ctx.fillText(`R${i + 1}`, x + sizeRes / 2, yLine - 40);
      ctx.fillText(`${resultados[i].R} Ω`, x + sizeRes / 2, yLine - 22);
      x += sizeRes + espacio;
      ctx.beginPath(); ctx.moveTo(x - espacio / 2, yLine); ctx.lineTo(x, yLine); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x, yLine); ctx.lineTo(x, yLine + 90); ctx.lineTo(batX + gap + 20, yLine + 90); ctx.lineTo(batX + gap + 20, yLine); ctx.stroke();
  } else {
    const leftX = batX + 80;
    const rightX = canvas.width - 80;
    const topY = centerY - 150;
    const bottomY = centerY + 150;
    ctx.beginPath(); ctx.moveTo(batX + gap + 20, centerY); ctx.lineTo(leftX, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(leftX, topY); ctx.lineTo(rightX, topY); ctx.lineTo(rightX, bottomY); ctx.lineTo(leftX, bottomY); ctx.stroke();
    const n = resultados.length;
    const innerWidth = rightX - leftX - 120;
    const stepX = (n === 1) ? innerWidth / 2 : innerWidth / (n - 1);
    const startX = leftX + 60;
    for (let i = 0; i < n; i++) {
      const x = startX + i * stepX;
      const zigStartY = topY + 10;
      ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, zigStartY); ctx.stroke();
      drawZigzagVert(x, zigStartY, sizeRes, amp, peaks);
      ctx.beginPath(); ctx.moveTo(x, zigStartY + sizeRes); ctx.lineTo(x, bottomY); ctx.stroke();
      ctx.fillText(`R${i + 1}`, x, bottomY + 18);
      ctx.fillText(`${resultados[i].R} Ω`, x, bottomY + 36);
    }
    ctx.beginPath(); ctx.moveTo(rightX, centerY); ctx.lineTo(batX + gap + 20, centerY); ctx.stroke();
  }
}
