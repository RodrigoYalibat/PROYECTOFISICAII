let resistoresCount = 0;
const resistoresContainer = document.getElementById('resistoresContainer');
const agregarBtn = document.getElementById('agregarResistorBtn');

agregarBtn.addEventListener('click', agregarResistor);

function agregarResistor() {
    if(resistoresCount >= 20) return;
    resistoresCount++;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.placeholder = 'Ω';
    input.id = 'resistor' + resistoresCount;
    resistoresContainer.appendChild(document.createTextNode(`Resistor ${resistoresCount}: `));
    resistoresContainer.appendChild(input);
    resistoresContainer.appendChild(document.createElement('br'));
}

document.getElementById('formCircuito').addEventListener('submit', function(e){
    e.preventDefault();
    calcularCircuito();
});

function calcularCircuito() {
    const voltaje = parseFloat(document.getElementById('voltaje').value);
    const tipo = document.getElementById('tipo').value;
    const resistores = [];
    for(let i=1; i<=resistoresCount; i++){
        const val = parseFloat(document.getElementById('resistor'+i).value);
        if(!isNaN(val) && val>0) resistores.push(val);
    }
    if(resistores.length === 0){
        alert('Ingrese al menos un resistor válido.');
        return;
    }

    let resultados = [];
    let resistencia_eq = 0;
    let corriente_total = 0;

    if(tipo==='serie'){
        resistencia_eq = resistores.reduce((a,b)=>a+b,0);
        corriente_total = voltaje / resistencia_eq;
        resultados = resistores.map(r => ({
            R: r,
            V: corriente_total * r,
            I: corriente_total,
            P: Math.pow(corriente_total,2)*r
        }));
    } else {
        resistencia_eq = 1 / resistores.reduce((a,b)=>a + 1/b,0);
        corriente_total = voltaje / resistencia_eq;
        resultados = resistores.map(r => ({
            R: r,
            V: voltaje,
            I: voltaje / r,
            P: Math.pow(voltaje,2)/r
        }));
    }

    // Mostrar resultados en tabla
    let html = `<h3>Resultados</h3>
    <table>
    <tr><th>Resistor (Ω)</th><th>Voltaje (V)</th><th>Corriente (A)</th><th>Potencia (W)</th></tr>`;
    resultados.forEach(r=>{
        html += `<tr><td>${r.R}</td><td>${r.V.toFixed(2)}</td><td>${r.I.toFixed(2)}</td><td>${r.P.toFixed(2)}</td></tr>`;
    });
    html += `</table>
    <p>Resistencia equivalente: ${resistencia_eq.toFixed(2)} Ω</p>
    <p>Corriente total: ${corriente_total.toFixed(2)} A</p>`;
    document.getElementById('resultados').innerHTML = html;

    // Visualización del circuito
    let vis = document.getElementById('visualizacion');
    vis.innerHTML = `<h3>Visualización del Circuito</h3>`;
    if(tipo==='serie'){
        let line = document.createElement('div');
        resistores.forEach(r=>{
            let res = document.createElement('span');
            res.className='resistor';
            res.innerText = r+'Ω';
            line.appendChild(res);
            let cable = document.createElement('span');
            cable.className='cable';
            line.appendChild(cable);
        });
        vis.appendChild(line);
    } else {
        resistores.forEach(r=>{
            let res = document.createElement('div');
            res.className='resistor';
            res.innerText = r+'Ω';
            vis.appendChild(res);
        });
    }
}
