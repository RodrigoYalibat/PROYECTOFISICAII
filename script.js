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
    if(resistoresCount >= 10) return;
    resistoresCount++;

    const divRes = document.createElement('div');
    divRes.id = 'resDiv' + resistoresCount;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.placeholder = 'Ω';
    input.id = 'resistor' + resistoresCount;

    const label = document.createTextNode(`R${resistoresCount}: `);

    // Botón para eliminar resistor
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'X';
    btnEliminar.style.marginLeft = '5px';
    btnEliminar.onclick = () => {
        resistoresContainer.removeChild(divRes);
        resistoresCount--;
    };

    divRes.appendChild(label);
    divRes.appendChild(input);
    divRes.appendChild(btnEliminar);
    resistoresContainer.appendChild(divRes);
}

// Función para reiniciar todo el circuito
function reiniciarCircuito() {
    resistoresContainer.innerHTML = '';
    resistoresCount = 0;
    document.getElementById('voltaje').value = '';
    document.getElementById('tipo').value = 'serie';
    document.getElementById('resultados').innerHTML = '';
    ctx.clearRect(0,0,canvas.width,canvas.height);
}

// Función principal para dibujar el circuito
function dibujarCircuito() {
    const voltaje = parseFloat(document.getElementById('voltaje').value);
    const tipo = document.getElementById('tipo').value;

    const resistores = [];
    for(let i=1; i<=resistoresCount; i++){
        const val = parseFloat(document.getElementById('resistor'+i).value);
        if(!isNaN(val) && val>0) resistores.push(val);
    }
    if(resistores.length===0){
        alert('Ingresa al menos un resistor válido.');
        return;
    }

    let resultados=[];
    let req=0, itotal=0;

    if(tipo==='serie'){
        req = resistores.reduce((a,b)=>a+b,0);
        itotal = voltaje / req;
        resultados = resistores.map(r=>({R:r, I:itotal}));
    } else {
        req = 1/resistores.reduce((a,b)=>a+1/b,0);
        itotal = voltaje / req;
        resultados = resistores.map(r=>({R:r, I:voltaje/r}));
    }

    mostrarResultados(resultados, req, itotal);
    dibujarCanvas(resultados, tipo, voltaje);
}

// Función para mostrar resultados en tabla
function mostrarResultados(resultados, req, itotal){
    let html=`<h3>Resultados</h3><table><tr><th>Resistor (Ω)</th><th>Corriente (A)</th></tr>`;
    resultados.forEach((r,i)=>{
        html+=`<tr><td>R${i+1} = ${r.R}</td><td>${r.I.toFixed(2)}</td></tr>`;
    });
    html+=`</table><p>Resistencia equivalente: ${req.toFixed(2)} Ω</p>`;
    html+=`<p>Corriente total: ${itotal.toFixed(2)} A</p>`;
    document.getElementById('resultados').innerHTML=html;
}

// Función para dibujar flechas de corriente
function dibujarFlecha(x, y, direccion){
    ctx.beginPath();
    if(direccion==='right'){
        ctx.moveTo(x, y);
        ctx.lineTo(x+15, y);
        ctx.lineTo(x+10, y-5);
        ctx.moveTo(x+15, y);
        ctx.lineTo(x+10, y+5);
    } else if(direccion==='down'){
        ctx.moveTo(x, y);
        ctx.lineTo(x, y+15);
        ctx.lineTo(x-5, y+10);
        ctx.moveTo(x, y+15);
        ctx.lineTo(x+5, y+10);
    }
    ctx.stroke();
}

// Función para dibujar el circuito en canvas
function dibujarCanvas(resultados, tipo, voltaje){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Dibujar batería
    ctx.fillStyle='#FF0000';
    ctx.fillRect(20, canvas.height/2-40, 20, 80);
    ctx.fillStyle='black';
    ctx.font='16px Arial';
    ctx.fillText(`${voltaje}V`, 30, canvas.height/2 -50);

    const margenX=60;
    const margenY=canvas.height/2;
    const sizeRes=50;
    const espacio=30;
    ctx.lineWidth=3;
    ctx.textAlign='center';

    if(tipo==='serie'){
        let x=margenX+50;
        // Línea inicial
        ctx.beginPath();
        ctx.moveTo(40, margenY);
        ctx.lineTo(x, margenY);
        ctx.stroke();

        resultados.forEach((r,i)=>{
            // Dibujar resistor cuadrado
            ctx.fillStyle='orange';
            ctx.fillRect(x, margenY-sizeRes/2, sizeRes, sizeRes);
            ctx.strokeRect(x, margenY-sizeRes/2, sizeRes, sizeRes);
            ctx.fillStyle='black';
            ctx.fillText(`R${i+1}`, x+sizeRes/2, margenY);
            ctx.fillText(`${r.I.toFixed(2)}A`, x+sizeRes/2, margenY+sizeRes/2+15);

            // Línea y flecha
            let xNext=x+sizeRes+espacio;
            ctx.beginPath();
            ctx.moveTo(x+sizeRes, margenY);
            ctx.lineTo(xNext, margenY);
            ctx.stroke();
            dibujarFlecha(x+sizeRes+10, margenY, 'right');
            x=xNext;
        });

        // Línea final
        ctx.beginPath();
        ctx.moveTo(x, margenY);
        ctx.lineTo(canvas.width-20, margenY);
        ctx.stroke();

    } else { // paralelo
    const xStart = margenX + 50;
    const yBase = margenY;
    const espacioY = 100; // separación vertical entre resistores
    const num = resultados.length;

    // Línea principal horizontal (entrada y salida)
    ctx.beginPath();
    ctx.moveTo(40, yBase);
    ctx.lineTo(canvas.width - 20, yBase);
    ctx.stroke();

    // Dibujar cada resistor en paralelo
    resultados.forEach((r,i)=>{
        const yRes = yBase - ((num-1)/2 - i) * espacioY; // centrado verticalmente

        // Línea vertical de entrada al resistor
        ctx.beginPath();
        ctx.moveTo(xStart, yBase);
        ctx.lineTo(xStart, yRes);
        ctx.stroke();

        // Dibujar resistor cuadrado
        ctx.fillStyle = 'orange';
        ctx.fillRect(xStart, yRes - sizeRes/2, sizeRes, sizeRes);
        ctx.strokeRect(xStart, yRes - sizeRes/2, sizeRes, sizeRes);

        // Etiquetas del resistor y corriente
        ctx.fillStyle = 'black';
        ctx.fillText(`R${i+1}`, xStart + sizeRes/2, yRes);
        ctx.fillText(`${r.I.toFixed(2)}A`, xStart + sizeRes/2, yRes + sizeRes/2 + 15);

        // Línea vertical de salida
        ctx.beginPath();
        ctx.moveTo(xStart + sizeRes, yRes);
        ctx.lineTo(xStart + sizeRes, yBase);
        ctx.stroke();

        // Flecha de corriente antes del resistor
        dibujarFlecha(xStart + sizeRes/2, yRes - sizeRes/2 - 10, 'down');
        });
    }
}
