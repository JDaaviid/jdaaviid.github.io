/*
dibujapuntosVBO.js
Programa que dibuja puntos que el usuario va marcando
*/

// SHADER DE VERTICES
const VSHADER_SOURCE = `
attribute vec3 posicion;
void main(){
    gl_Position = vec4(posicion,1.0);
    gl_PointSize = 10.0;
}
`;  

// SHADER DE FRAGMENTOS
const FSHADER_SOURCE = `
uniform highp vec3 color;
void main(){
    gl_FragColor = vec4(color,1.0);
}
`;

// VARIABLES GLOBALES
const clicks = []; // Array de clicks del usuario
let colorFragmento = [1.0,0.0,0.0]; // Color del fragmento

function main(){
    // Recuperar el canvas (lienzo)
    const canvas = document.getElementById("canvas");
    if(!canvas){
        console.log("Fallo al recuperar el canvas");
        return;
    }

    // Obtener el contexto de render (herramientas de dibujo)
    const gl = getWebGLContext(canvas);
    if(!gl){
        console.log("Fallo al recuperar el contexto");
        return;
    }

    // Cargar, compilar y montar los shaders en un programa
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
        console.log("Fallo al cargar los shaders");
        return;
    }

    // Color de fondo del canvas
    gl.clearColor(0.0,0.0,0.3,1.0);

    // Obtener el atributo de posición del vertice
    const coordenadas = gl.getAttribLocation(gl.program,"posicion");

    // Crear el buffer, activarlo y enlazarlo
    const bufferVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferVertices);
    gl.vertexAttribPointer(coordenadas,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(coordenadas);

    // Obtener la ubicación de la variable uniforme del color
    colorFragmento = gl.getUniformLocation(gl.program,"color");

    // Registrar el evento mousedown
    canvas.onmousedown = function(evento){
        click(evento,gl,canvas,canvas);
    };

    render(gl);
   
}

function click(evento,gl,canvas){
    // Coordenadas del click
    const x = evento.clientX;
    const y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Convertir las coordenadas al sistema de coordenadas de webgl
    const xCanvas = ((x-rect.left)-canvas.width/2)/(canvas.width/2);
    const yCanvas = (canvas.height/2-(y-rect.top))/(canvas.height/2);


    // Guardar las coordenadas en el array
    clicks.push(xCanvas);
    clicks.push(yCanvas);
    clicks.push(0.0);

    // Dibujar los puntos
    render(gl);
}

function render(gl){
    // Borrar el canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    const puntos = new Float32Array(clicks);

    gl.uniform3f(colorFragmento,1.0,1.0,0.0);

    // Rellenar el buffer con los puntos
    gl.bufferData(gl.ARRAY_BUFFER,puntos,gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS,0,clicks.length/3);
}