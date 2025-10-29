const canvas = document.getElementById('canvasCircuito');
const ctx = canvas.getContext('2d');

let resistoresCount = 0;
const resistoresContainer = document.getElementById('resistoresContainer');
const agregarBtn = document.getElementById('agregarResistorBtn');
const reiniciarBtn = document.getElementById('reiniciarBtn');

agregarBtn.addEventListener('click', agregarResistor);
reiniciarBtn.addEventListener('click', reiniciarCircuito);

document.getElementById('formCircuito').addEventListener('submit', e=>{
    e.preventDefault();
    dibujarCircuito();
});

// Función para agregar un resistor
function agregarResistor() {
    if (resistoresCount >= 6) return;
    resistoresCount++;

    const divRes = document.createElement('div');
    divRes.id = 'resDiv' + resistoresCount;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.placeholder = 'Ω';
    input.id = 'resistor' + resistoresCount;
    input.required = true;

    const label = document.createTextNode(`R${resistoresCount}: `);

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'X';
    btnEliminar.style.marginLeft = '5px';
    btnEliminar.onclick = () => {
        resistoresContainer.removeChild(divRes);
        resistoresCount--;
        if (resistoresCount < 5) {
            agregarBtn.style.display = '';
        }
    };

    divRes.appendChild(label);
    divRes.appendChild(input);
    divRes.appendChild(btnEliminar);
    resistoresContainer.appendChild(divRes);

    if (resistoresCount >= 6) {
        agregarBtn.style.display = 'none';
    }
}

// Función para reiniciar todo el circuito
function reiniciarCircuito() {
    resistoresContainer.innerHTML = '';
    resistoresCount = 0;
    document.getElementById('voltaje').value = '';
    document.getElementById('tipo').value = 'serie';
    document.getElementById('resultados').innerHTML = '';
    ctx.clearRect(0,0,canvas.width,canvas.height);
    agregarBtn.style.display = '';
}

// Función principal para dibujar el circuito
function dibujarCircuito() {
    const voltaje = parseFloat(document.getElementById('voltaje').value);
    const tipo = document.getElementById('tipo').value;

    if (isNaN(voltaje)) {
        alert('Por favor ingrese un voltaje válido.');
        return;
    }

    const resistores = [];
    for(let i=1; i<=resistoresCount; i++){
        const el = document.getElementById('resistor'+i);
        if (!el) continue;
        const val = parseFloat(el.value);
        if(!isNaN(val) && val>0) resistores.push(val);
    }
    if(resistoresCount === 0){
        alert('Ingrese al menos un resistor.');
        return;
    }

    if (resistores.length === 0) {
        alert('Por favor, ingrese valores válidos para los resistores.');
        return;
    }

    let resultados=[];
    let req=0, itotal=0;

    if(tipo==='serie'){
        req = resistores.reduce((a,b)=>a+b,0);
        itotal = voltaje / req;
        resultados = resistores.map(r=>{
            const I = itotal;
            const V = I * r; // caída de voltaje por resistor en serie
            return {R:r, I, V};
        });
    } else {
        const sumaReciprocos = resistores.reduce((a,b)=>a+1/b,0);
        req = 1 / sumaReciprocos;
        itotal = voltaje / req;
        resultados = resistores.map(r=>{
            const I = voltaje / r; // corriente en cada rama en paralelo
            const V = voltaje; // voltaje igual en cada rama (ideal)
            return {R:r, I, V};
        });
    }

    mostrarResultados(resultados, req, itotal, voltaje);
    dibujarCanvas(resultados, tipo, voltaje);
}

// Función para mostrar resultados en tabla
function mostrarResultados(resultados, req, itotal, voltaje){
    let html=`<h3>Resultados</h3><table><tr><th>Resistor (Ω)</th><th>Corriente (A)</th><th>Voltaje (V)</th></tr>`;
    resultados.forEach((r,i)=>{
        html+=`<tr><td>R${i+1} = ${r.R}</td><td>${r.I.toFixed(2)}</td><td>${r.V.toFixed(2)}</td></tr>`;
    });
    html+=`</table><p>Resistencia equivalente: ${req.toFixed(2)} Ω</p>`;
    html+=`<p>Corriente total: ${itotal.toFixed(2)} A</p>`;
    document.getElementById('resultados').innerHTML=html;
}

// Función para dibujar flechas de corriente
// Función para dibujar el circuito en canvas (sin flechas, y con lado izquierdo en línea recta)
function dibujarCanvas(resultados, tipo, voltaje){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const centerY = canvas.height / 2;
    const centerX = canvas.width / 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    // Dibujar batería (dos placas) y etiqueta de voltaje (izquierda)
    const batX = 20;
    const longLineH = 50;
    const shortLineH = 18;
    const gap = 12;
    // placa larga
    ctx.beginPath();
    ctx.moveTo(batX, centerY - longLineH/2);
    ctx.lineTo(batX, centerY + longLineH/2);
    ctx.stroke();
    // placa corta
    ctx.beginPath();
    ctx.moveTo(batX + gap, centerY - shortLineH/2);
    ctx.lineTo(batX + gap, centerY + shortLineH/2);
    ctx.stroke();
    ctx.fillText('+', batX - 8, centerY - longLineH/2 - 6);
    ctx.fillText('-', batX + gap + 8, centerY + shortLineH/2 + 14);
    ctx.fillText(`${voltaje} V`, batX + gap + 30, centerY - longLineH/2 - 6);

    const margenX = batX + 80;
    const sizeRes = 60; // ancho/alto aproximado para cada resistor (zigzag)
    const espacio = 40; // espacio entre resistores o ramas

    // util: zigzag horizontal (para serie)
    function drawZigzagHoriz(x, y, width, amplitude, peaks){
        const seg = width / (peaks * 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < peaks * 2; i++){
            const nx = x + seg * (i + 1);
            const ny = (i % 2 === 0) ? y - amplitude : y + amplitude;
            ctx.lineTo(nx, ny);
        }
        ctx.stroke();
    }
    // util: zigzag vertical (para paralelo "volteado")
    function drawZigzagVert(x, y, width, height, peaks){
        const seg = height / (peaks * 2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < peaks * 2; i++){
            const ny = y + seg * (i + 1);
            const nx = (i % 2 === 0) ? x + width : x - width;
            ctx.lineTo(nx, ny);
        }
        ctx.stroke();
    }

    // util: dibujar una sola línea (en lugar de dos rails)
    function drawLine(x1,y1,x2,y2){
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    if(tipo === 'serie'){
        // dimensiones del rectángulo
        const circuitGapY = 120; // altura del rectángulo
        const topY = centerY - circuitGapY/2;
        const bottomY = centerY + circuitGapY/2;
        const startX = margenX;
        const totalWidth = resultados.length * (sizeRes + espacio) - espacio;

        // Lado izquierdo en línea recta vertical
        drawLine(batX + gap + 20, centerY, startX, centerY); // conexión horizontal desde batería hasta la columna izquierda
        drawLine(startX, topY, startX, bottomY);            // columna izquierda completamente recta (vertical)

        // resto del rectángulo
        drawLine(startX, topY, startX + totalWidth, topY);         // línea superior
        drawLine(startX + totalWidth, topY, canvas.width - 40, topY); // hacia la derecha (si se quiere extender)
        drawLine(canvas.width - 40, topY, canvas.width - 40, bottomY); // lado derecho
        drawLine(canvas.width - 40, bottomY, startX + totalWidth, bottomY); // línea inferior
        drawLine(startX + totalWidth, bottomY, startX, bottomY);     // conectar con columna izquierda

        // Dibujar resistencias como zigzags sobre la línea superior, distribuídas
        let x = startX;
        resultados.forEach((r, i) => {
            const segX = x;
            // conductor corto antes
            drawLine(segX, topY, segX + 6, topY);

            // zigzag centrado en la porción sizeRes
            drawZigzagHoriz(segX + 6, topY, sizeRes - 12, 12, 4);

            // etiquetas: nombre, I y V
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText(`R${i+1} = ${r.R} Ω`, segX + sizeRes/2, topY - 30);
            ctx.fillText(`${r.I.toFixed(2)} A`, segX + sizeRes/2, topY + 28);
            ctx.fillText(`${r.V.toFixed(2)} V`, segX + sizeRes/2, topY - 44);

            // línea entre resistencias
            drawLine(segX + sizeRes, topY, segX + sizeRes + espacio, topY);

            x += sizeRes + espacio;
        });
    } else { // paralelo -> rectángulo vertical (una sola línea por borde)
        // calcular altura total según cantidad de resistores
        const totalHeight = resultados.length * (sizeRes + espacio) - espacio;
        const startY = centerY - totalHeight/2;
        const leftX = centerX - 120;
        const rightX = centerX + 120;
        const topY = startY;
        const bottomY = startY + totalHeight;

        // Lado izquierdo en línea recta vertical
        drawLine(batX + gap + 20, centerY, leftX, centerY); // conexión horizontal desde batería hasta la columna izquierda
        drawLine(leftX, topY, leftX, bottomY);              // columna izquierda completamente recta (vertical)

        // Dibujar rectángulo simple
        drawLine(leftX, topY, rightX, topY);                  // línea superior
        drawLine(rightX, topY, rightX, bottomY);              // lado derecho
        drawLine(rightX, bottomY, leftX, bottomY);            // línea inferior
        drawLine(leftX, bottomY, batX + gap + 20, centerY);   // volver a la batería

        // Dibujar resistencias como zigzags verticales a lo largo del lado izquierdo
        let y = startY;
        resultados.forEach((r, i) => {
            const segY = y;
            // conductor corto antes del zigzag
            drawLine(leftX, segY, leftX, segY + 6);

            // zigzag vertical centrado en la porción sizeRes (alto)
            drawZigzagVert(leftX, segY + 6, 12, sizeRes - 12, 4);

            // etiquetas: nombre, I y V (a la derecha de cada resistor)
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.fillText(`R${i+1} = ${r.R} Ω`, leftX + 24, segY + sizeRes/2 - 12);
            ctx.fillText(`${r.I.toFixed(2)} A`, leftX + 24, segY + sizeRes/2 + 6);
            ctx.fillText(`${r.V.toFixed(2)} V`, leftX + 24, segY + sizeRes/2 + 24);

            // línea entre resistencias (vertical conductor hacia abajo)
            drawLine(leftX, segY + sizeRes, leftX, segY + sizeRes + espacio);

            y += sizeRes + espacio;
        });
    }
}
