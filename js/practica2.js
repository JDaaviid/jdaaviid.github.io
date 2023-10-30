var renderer, scene, camera;

function init(){
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x0000AA), 1.0);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 2000);
    camera.position.set(150,200,100);
    camera.lookAt(0,100,0);
 
}

function dibujar_escena(){

    //SUELO
    const material_suelo = new THREE.MeshBasicMaterial( {color: "red", wireframe: true,} );
    const geometria_suelo = new THREE.PlaneGeometry(1000,1000, 15, 15);
    const plano_suelo = new THREE.Mesh( geometria_suelo, material_suelo);
    plano_suelo.rotation.x = -Math.PI/2; //Rotar 90 grados sobre el eje X
    scene.add( plano_suelo );


    //FIGURA 
    const material_figura = new THREE.MeshBasicMaterial( {color: "green", wireframe: true,} );
    // BASE FIGURA ====================================
    const geometria_base_figura = new THREE.CylinderGeometry(50, 50, 15, 30);
    const cilindro_base_figura = new THREE.Mesh(geometria_base_figura, material_figura);


    robot = new THREE.Object3D();
    // BRAZO DEL ROBOT ================================
    brazo_robot = new THREE.Object3D();
    //brazo_cilindro_inferior (base)
    const geometria_eje_cilindro = new THREE.CylinderGeometry(20,20,18,30);
    const brazo_eje = new THREE.Mesh(geometria_eje_cilindro, material_figura);
    brazo_eje.rotation.x = -Math.PI/2;
    brazo_eje.rotation.z = -Math.PI/2;
    brazo_robot.add(brazo_eje);

    //Esparrago: conexion eje y rótula del brazo
    const geometria_brazo_esparrago = new THREE.BoxGeometry(18,120,12);
    const brazo_esparrago = new THREE.Mesh(geometria_brazo_esparrago, material_figura);
    brazo_esparrago.position.set(0,60,0);
    brazo_robot.add(brazo_esparrago);

    //esfera superior (rótula)
    const geometria_brazo_rotula = new THREE.SphereGeometry(20,10,10);
    const brazo_rotula = new THREE.Mesh(geometria_brazo_rotula, material_figura);
    brazo_rotula.position.set(0,120,0);
    brazo_robot.add(brazo_rotula);

    // ANTEBRAZO DEL ROBOT ================================
    antebrazo_robot = new THREE.Object3D();
    antebrazo_robot.position.set(0,120,0);

    // base (disco)
    const geometria_antebrazo_disco = new THREE.CylinderGeometry(22, 22, 6, 30);
    const antebrazo_disco = new THREE.Mesh(geometria_antebrazo_disco, material_figura);
    antebrazo_robot.add(antebrazo_disco);

    //4 Nervios (conexión antebrazo)
    const geometria_antebrazo_nervio = new THREE.BoxGeometry(4, 80, 4);

    const antebrazo_nervio1 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura);
    antebrazo_nervio1.position.set(7,40,-7);
    antebrazo_robot.add(antebrazo_nervio1);

    const antebrazo_nervio2 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura);
    antebrazo_nervio2.position.set(7,40,7);
    antebrazo_robot.add(antebrazo_nervio2);

    const antebrazo_nervio3 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura);
    antebrazo_nervio3.position.set(-7,40,7);
    antebrazo_robot.add(antebrazo_nervio3);

    const antebrazo_nervio4 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura);
    antebrazo_nervio4.position.set(-7,40,-7);
    antebrazo_robot.add(antebrazo_nervio4);

    const geometria_antebrazo_cilindro = new THREE.CylinderGeometry(15, 15, 40, 30);
    const antebrazo_cilindro = new THREE.Mesh(geometria_antebrazo_cilindro, material_figura);
    antebrazo_cilindro.rotation.z = -Math.PI/2;
    antebrazo_cilindro.position.set(0,80,0);
    antebrazo_robot.add(antebrazo_cilindro);

    // PINZAS DEL ROBOT ====================================
    pinzas_robot = new THREE.Object3D();

    const material_pinzas = new THREE.MeshBasicMaterial( { color: "white" , wireframe:true} );
    const geometry_pinza_paralelepipedo = new THREE.BoxGeometry(19, 20, 4);
    const pinza_paralelepipedo = new THREE.Mesh(geometry_pinza_paralelepipedo, material_pinzas);
    pinza_paralelepipedo.position.set(-9.5,10,-2);
    pinzas_robot.add(pinza_paralelepipedo);

    const geometry_pinza_dedos = new THREE.BufferGeometry();
    const vertices_pinza_dedos = new Float32Array( [
        0.0, 0.0, 0.0, // v0
        0.0, 0.0,  -4.0, // v1
        0.0,  20.0,  -4.0, // v2
        0.0,  20.0,  0.0, // v3
        19.0, 5.0, 0.0, //v4
        19.0, 5.0, -2.0, //v5
        19.0, 15.0, -2.0, //v6
        19.0, 15.0, 0.0, //v7
        0.0, 20.0, -2.0, //v8
        0.0, 0.0, -2.0, //v9
    ] );

    const indices_pinza_dedos = [

        //Lado frontal
        0,4,3,
        3,4,7,
        //Lado pequeño
        4,5,7,
        5,6,7,

        //Lado frontal trasero
        2,6,1,
        5,1,6,

        //Lado arriba
        3,6,2,
        3,7,2,
        
        //Lado abajo
        0,1,4,
        0,1,5,

        //Lado pequeño grande
        0,3,1,
        1,3,2,

        //Pequeño triangulo sobrante arriba
        7,6,8, 

        //Pequeño triangulo sobrante abajo
        5,4,9,

      ]; 


    geometry_pinza_dedos.setIndex( indices_pinza_dedos );
    geometry_pinza_dedos.setAttribute( 'position', new THREE.BufferAttribute( vertices_pinza_dedos, 3 ) );
    geometry_pinza_dedos.computeVertexNormals();

    const pinza_dedos = new THREE.Mesh( geometry_pinza_dedos, material_pinzas );

    pinzas_robot.add(pinza_dedos);

    // DUPLICO LA PINZA, PARA TENER 2:
    const pinza_segunda = pinzas_robot.clone();

    //Posiciono la primera pinza
    pinzas_robot.rotation.y = -Math.PI/2;
    pinzas_robot.position.set(7,190,25);

    robot.add(pinzas_robot);

    //Posiciono la segunda pinza:
    pinza_segunda.rotation.x = -Math.PI;
    pinza_segunda.rotation.y = Math.PI/2;
    pinza_segunda.position.set(-7,210,25);

    robot.add(pinza_segunda);
    
    scene.add( cilindro_base_figura );
    robot.add(brazo_robot);
    robot.add(antebrazo_robot);
    scene.add(robot);

}


function update(){

}

function render(){
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

function main(){
    init();
    dibujar_escena();
    render();
}

