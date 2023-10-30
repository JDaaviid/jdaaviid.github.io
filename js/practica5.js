var renderer, scene, camera, antes, ahora, animacion_activada, primera_animacion, radio, velocidad_rotacion;

function init(){
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x0000AA), 1.0);
    renderer.shadowMap.enabled  = true; // Habilitar en el motor de render el calculo de sombras
    //renderer.shadowMap.debug = true;

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    //Atención al evento de resize del documento
    window.addEventListener("resize", updateAspectRatio);

    var aspectRatio_CamPrincp = window.innerWidth / window.innerHeight;

    //CAMARA PRINCIPAL
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio_CamPrincp, 0.1, 2000);
    ///camera.position.set(150,200,100);
    camera.position.set(-100,250,125);

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0,100,0);
    //Limitar el zoom
    cameraControls.minDistance = 100; 
    cameraControls.maxDistance = 500; 

    cameraControls.update();

    scene.add(camera);

    // CAMARA CENITAL
    camara_cenital = new THREE.OrthographicCamera(-100, 100, 100, -100, 0, 2000);
    camara_cenital.position.set(0,300,0);
    camara_cenital.lookAt(0,0,0);

    scene.add(camara_cenital);

    //Movimiento del robot sobre el plano del suelo con las flechas del teclado
    keyboard = new THREEx.KeyboardState(renderer.domElement);
    renderer.domElement.setAttribute("tabIndex", "0");
    renderer.domElement.focus();
    
    
    keyboard.domElement.addEventListener('keydown', keydownCallback);
    anadirLuces();
    cargarTexturas();
}

function anadirLuces(){
    //Luz ambiental
    var luzAmbiental = new THREE.AmbientLight("grey");
    scene.add(luzAmbiental);
    

    //Luz direccional -> Va apuntando al robot cuando se mueve (código necesario en función dubujar_escena())
    luzDireccional = new THREE.DirectionalLight("red", 0.3);
    luzDireccional.position.set(100,750,0);
    luzDireccional.castShadow = true;
    luzDireccionalHelper = new THREE.CameraHelper(luzDireccional.shadow.camera);
    scene.add(luzDireccional);
    //scene.add(luzDireccionalHelper);

    //Luz focal
    luzFocal = new THREE.SpotLight("white");
    luzFocal.position.set(-300,400,0);
    luzFocal.penumbra = 0.5;
    luzFocal.distance = 1500;
    luzFocal.castShadow = true;

    luzFocalHelper = new THREE.CameraHelper(luzFocal.shadow.camera);
    //scene.add(luzFocalHelper);
    scene.add(luzFocal);

    // Luz puntual
    luzPuntual = new THREE.PointLight("white", 0.2);
    luzPuntual.distance = 1500;
    luzPuntual.position.set(0,500,500);
    luzPuntual.castShadow = true;
    luzPuntualHelper = new THREE.CameraHelper(luzPuntual.shadow.camera);
    //scene.add(luzPuntualHelper);
    scene.add(luzPuntual);
}

function keydownCallback(){
    if (keyboard.pressed("up")) {
        robot.position.z -= 5;
    }

    if (keyboard.pressed("down")) {
        robot.position.z += 5;
    }

    if (keyboard.pressed("left")) {
        robot.position.x -= 5;
    }

    if (keyboard.pressed("right")) {
        robot.position.x += 5;
    }
}

function convertirGradosARadianes(grados) {
    return grados * (Math.PI / 180);
}

function showRobotControlsGUI(){
    //GUI
    const gui = new lil.GUI(); 

    var configuracionGUI = { 
        anguloBase:0, 
        anguloBrazo:0, 
        anguloAntebrazoY:0,
        anguloAntebrazoZ:0,
        anguloPinzaZ:0,
        separacionPinzas:5,
        setWireframe:true,
        funcionAnimar:animar,
        setLuzCameraHelpers: false,
    }; 

    const controlesRobot = gui.addFolder('Control Robot');

    controlesRobot.add(configuracionGUI, "anguloBase", -180, 180).name("Giro Base").onChange(function (anguloGrados) {
        robot.rotation.y = convertirGradosARadianes(anguloGrados);
    });

    controlesRobot.add(configuracionGUI, "anguloBrazo", -45, 45).name("Giro Brazo").onChange(function (anguloGrados) {
        brazo_robot.rotation.z = convertirGradosARadianes(anguloGrados);
    });

    controlesRobot.add(configuracionGUI, "anguloAntebrazoY", -180, 180).name("Giro Antebrazo Y").onChange(function (anguloGrados) {
        antebrazo_robot.rotation.y = convertirGradosARadianes(anguloGrados);
    });

    controlesRobot.add(configuracionGUI, "anguloAntebrazoZ", -90, 90).name("Giro Antebrazo Z").onChange(function (anguloGrados) {
        antebrazo_robot.rotation.z = convertirGradosARadianes(anguloGrados);
    });

    controlesRobot.add(configuracionGUI, "anguloPinzaZ", -40, 220).name("Giro Pinza").onChange(function (anguloGrados) {
        pinza1_completa.rotation.y = -convertirGradosARadianes(anguloGrados);
        pinza2_completa.rotation.y = -convertirGradosARadianes(anguloGrados);
    });

    controlesRobot.add(configuracionGUI, "separacionPinzas", 0, 15).name("Separacion Pinza").onChange(function (distancia) {
        pinza1_completa.position.y = -distancia + 5;
        pinza2_completa.position.y = distancia - 5;
        
    });

    controlesRobot.add(configuracionGUI, "setWireframe").name("alambres").onChange(function (value) {
        scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.wireframe = value;
            }
        });
    });

    controlesRobot.add(configuracionGUI, "funcionAnimar").name("Anima");

    controlesRobot.add(configuracionGUI, "setLuzCameraHelpers").name("Mostrar Luz Camera Helpers").onChange(function (value) {
        if(value){
            scene.add(luzPuntualHelper);
            scene.add(luzFocalHelper);
            scene.add(luzDireccionalHelper);
        }
        else{
            scene.remove(luzPuntualHelper);
            scene.remove(luzFocalHelper);
            scene.remove(luzDireccionalHelper);
        }
    });


}

function animar(){

    antes = Date.now();
    ahora = Date.now();
    var tiempoTranscurrido = (ahora - antes) / 1000; 
    velocidad_rotacion=1;
    radio=100;
    var angulo = velocidad_rotacion * tiempoTranscurrido;

    var tween_robot = new TWEEN.Tween(robot.position)
        .to({ x: radio * Math.cos(angulo), y: robot.position.y, z:radio * Math.sin(angulo)}, 5000)
        .onComplete(function(){
            animacion_activada = true;
            primera_animacion = true;
        });   
        
    var tween_antebrazo = new TWEEN.Tween(antebrazo_robot.rotation)
    .to({x:0, y:convertirGradosARadianes(80), z:0}, 5000)
    .easing(TWEEN.Easing.Elastic.InOut);


    var tween_brazo1 = new TWEEN.Tween(brazo_robot.rotation)
    .to({x:0, y:0, z:convertirGradosARadianes(45)}, 5000)
    .easing(TWEEN.Easing.Bounce.InOut);

    var tween_brazo2 = new TWEEN.Tween(brazo_robot.rotation)
    .to({x:0, y:0, z:0}, 5000)
    .easing(TWEEN.Easing.Exponential.In);


    tween_antebrazo.chain(tween_brazo1);
    tween_brazo1.chain(tween_brazo2);
    tween_brazo2.chain(tween_robot);

    tween_antebrazo.start();
    
    
}

function cargarTexturas(){
    // Textura suelo
    suelo_textura = new THREE.TextureLoader().load("../images/pisometalico_1024.jpg");
    suelo_textura.wrapS = THREE.RepeatWrapping;
    suelo_textura.wrapT = THREE.RepeatWrapping; 

    //Textura base, eje, parte del brazo
    base_textura = new THREE.TextureLoader().load("../images/metal_128.jpg");
    base_textura.wrapS = THREE.RepeatWrapping;
    base_textura.wrapT = THREE.RepeatWrapping;   

    //Textura nervios
    nervios_textura = new THREE.TextureLoader().load("../images/wood512.jpg");
    nervios_textura.wrapS = THREE.RepeatWrapping;
    nervios_textura.wrapT = THREE.RepeatWrapping; 

    //Textura mano
    mano_textura = new THREE.TextureLoader().load("../images/burberry_256.jpg");
    mano_textura.wrapS = THREE.RepeatWrapping;
    mano_textura.wrapT = THREE.RepeatWrapping; 

    //Textura esfera (rótula)
    rotula_textura_loader = new THREE.CubeTextureLoader().setPath("../images/");
    //rotula_textura.wrapS = THREE.RepeatWrapping;
    //rotula_textura.wrapT = THREE.RepeatWrapping; 
    rotula_textura = rotula_textura_loader.load([
        "posx.jpg", "negx.jpg",
        "posy.jpg", "negy.jpg",
        "posz.jpg", "negz.jpg"
    ]);

    // Texturas entorno (habitación)
    lado1_textura = new THREE.TextureLoader().load('../images/posx.jpg');
    lado2_textura = new THREE.TextureLoader().load('../images/negx.jpg');
    lado3_textura = new THREE.TextureLoader().load('../images/posy.jpg');
    lado4_textura = new THREE.TextureLoader().load('../images/negy.jpg');
    lado5_textura = new THREE.TextureLoader().load('../images/posz.jpg');
    lado6_textura = new THREE.TextureLoader().load('../images/negz.jpg');

}

function dibujar_escena(){

    //MATERIALES
    const material_suelo = new THREE.MeshLambertMaterial({ wireframe: true, color:"white", map:suelo_textura});
    const material_figura = new THREE.MeshPhongMaterial({ wireframe: true, color: "green", specular: "brown", shininess: 25});
    const material_figura_base = new THREE.MeshPhongMaterial({ wireframe: true, specular: "grey", shininess: 25, map:base_textura});
    const material_figura_nervios = new THREE.MeshLambertMaterial({ wireframe: true, color: "orange", map:nervios_textura});
    const material_figura_mano = new THREE.MeshPhongMaterial({ wireframe: true, specular: "green", shininess: 25, map:mano_textura});
    const material_figura_rotula = new THREE.MeshPhongMaterial({ wireframe: true, specular: "brown", shininess: 25, envMap:rotula_textura});


    const materiales_habitacion = [
        new THREE.MeshBasicMaterial({map: lado1_textura, side: THREE.BackSide}),
        new THREE.MeshBasicMaterial({map: lado2_textura, side: THREE.BackSide}),
        new THREE.MeshBasicMaterial({map: lado3_textura, side: THREE.BackSide}),
        new THREE.MeshBasicMaterial({map: lado4_textura, side: THREE.BackSide}),
        new THREE.MeshBasicMaterial({map: lado5_textura, side: THREE.BackSide}),
        new THREE.MeshBasicMaterial({map: lado6_textura, side: THREE.BackSide}),
      ];

    // HABITACIÓN
    const geoHabitacion = new THREE.BoxGeometry(1000,1000,1000);
    const habitacion = new THREE.Mesh(geoHabitacion, materiales_habitacion);
    scene.add(habitacion);  

    //SUELO
    //const material_suelo = new THREE.MeshBasicMaterial( {color: "red", wireframe: true} );
    const geometria_suelo = new THREE.PlaneGeometry(1000,1000, 15, 15);
    const plano_suelo = new THREE.Mesh( geometria_suelo, material_suelo);
    plano_suelo.rotation.x = -Math.PI/2; //Rotar 90 grados sobre el eje X

    plano_suelo.castShadow = true;
    plano_suelo.receiveShadow = true;
    scene.add( plano_suelo );

    //FIGURA 
    robot = new THREE.Object3D();

    luzFocal.target = robot;
    luzPuntual.target = robot;

    
    //const material_figura = new THREE.MeshBasicMaterial( {color: "green", wireframe: true,} );
    // BASE FIGURA ====================================
    const geometria_base_figura = new THREE.CylinderGeometry(50, 50, 15, 30);
    const cilindro_base_figura = new THREE.Mesh(geometria_base_figura, material_figura_base);

    cilindro_base_figura.castShadow = true;
    cilindro_base_figura.receiveShadow = true;

    robot.add(cilindro_base_figura);

    // BRAZO DEL ROBOT ================================
    brazo_robot = new THREE.Object3D();
    //brazo_cilindro_inferior (base del brazo)
    const geometria_eje_cilindro = new THREE.CylinderGeometry(20,20,18,30);
    const brazo_eje = new THREE.Mesh(geometria_eje_cilindro, material_figura_base);
    brazo_eje.rotation.x = -Math.PI/2;
    brazo_eje.castShadow = true;
    brazo_eje.receiveShadow = true;
    brazo_robot.add(brazo_eje);

    //Esparrago: conexion eje y rótula del brazo
    const geometria_brazo_esparrago = new THREE.BoxGeometry(18,120,12);
    const brazo_esparrago = new THREE.Mesh(geometria_brazo_esparrago, material_figura_base);
    brazo_esparrago.position.set(0,60,0);
    brazo_esparrago.castShadow = true;
    brazo_esparrago.receiveShadow = true;
    brazo_robot.add(brazo_esparrago);

    //esfera superior (rótula)
    const geometria_brazo_rotula = new THREE.SphereGeometry(20,10,10);
    const brazo_rotula = new THREE.Mesh(geometria_brazo_rotula, material_figura_rotula);
    brazo_rotula.position.set(0,120,0);
    brazo_rotula.castShadow = true;
    brazo_rotula.receiveShadow = true;
    brazo_robot.add(brazo_rotula);

    luzDireccional.target = brazo_rotula;

    // ANTEBRAZO DEL ROBOT ================================
    antebrazo_robot = new THREE.Object3D();
    antebrazo_robot.position.set(0,120,0);
    antebrazo_robot.rotation.y = -Math.PI/2;

    // base (disco)
    const geometria_antebrazo_disco = new THREE.CylinderGeometry(22, 22, 6, 30);
    const antebrazo_disco = new THREE.Mesh(geometria_antebrazo_disco, material_figura_nervios);
    antebrazo_disco.castShadow = true;
    antebrazo_disco.receiveShadow = true;
    antebrazo_robot.add(antebrazo_disco);
    

    //4 Nervios (conexión antebrazo)
    const geometria_antebrazo_nervio = new THREE.BoxGeometry(4, 80, 4);

    const antebrazo_nervio1 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura_nervios);
    antebrazo_nervio1.position.set(7,40,-7);
    antebrazo_nervio1.castShadow = true;
    antebrazo_nervio1.receiveShadow = true;
    antebrazo_robot.add(antebrazo_nervio1);

    const antebrazo_nervio2 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura_nervios);
    antebrazo_nervio2.position.set(7,40,7);
    antebrazo_nervio2.castShadow = true;
    antebrazo_nervio2.receiveShadow = true;
    antebrazo_robot.add(antebrazo_nervio2);

    const antebrazo_nervio3 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura_nervios);
    antebrazo_nervio3.position.set(-7,40,7);
    antebrazo_nervio3.castShadow = true;
    antebrazo_nervio3.receiveShadow = true;
    antebrazo_robot.add(antebrazo_nervio3);

    const antebrazo_nervio4 = new THREE.Mesh(geometria_antebrazo_nervio, material_figura_nervios);
    antebrazo_nervio4.position.set(-7,40,-7);
    antebrazo_nervio4.castShadow = true;
    antebrazo_nervio4.receiveShadow = true;
    antebrazo_robot.add(antebrazo_nervio4);

    const geometria_antebrazo_cilindro = new THREE.CylinderGeometry(15, 15, 40, 30);
    const antebrazo_cilindro = new THREE.Mesh(geometria_antebrazo_cilindro, material_figura_mano);
    antebrazo_cilindro.rotation.z = -Math.PI/2;
    antebrazo_cilindro.position.set(0,80,0);
    antebrazo_cilindro.castShadow = true;
    antebrazo_cilindro.receiveShadow = true;

    // PINZAS DEL ROBOT ====================================
    pinza = new THREE.Object3D();
    pinza1_completa = new THREE.Object3D();

    const geometry_pinza_paralelepipedo = new THREE.BoxGeometry(19, 20, 4);
    const pinza_paralelepipedo = new THREE.Mesh(geometry_pinza_paralelepipedo, material_figura_nervios);
    pinza_paralelepipedo.position.set(-9.5,10,-2);
    pinza_paralelepipedo.castShadow = true;
    pinza_paralelepipedo.receiveShadow = true;
    pinza.add(pinza_paralelepipedo);

    const geometry_pinza_dedos = new THREE.BufferGeometry();
    const vertices_pinza_dedos = new Float32Array([
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
    ]);

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

    const uvs = new Float32Array([
        0.0, 0.0, // v0
        0.0, 1.0, // v1
        1.0, 1.0, // v2
        1.0, 0.0, // v3
        0.0, 0.0, // v4
        0.0, 1.0, // v5
        1.0, 1.0, // v6
        1.0, 0.0, // v7
        0.0, 0.0, // v8
        0.0, 1.0, // v9
    ]);  

    geometry_pinza_dedos.setIndex(indices_pinza_dedos);
    geometry_pinza_dedos.setAttribute("position", new THREE.BufferAttribute( vertices_pinza_dedos, 3 ));
    geometry_pinza_dedos.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry_pinza_dedos.computeVertexNormals();

    const pinza_dedos = new THREE.Mesh(geometry_pinza_dedos, material_figura_nervios);
    pinza_dedos.castShadow = true;
    pinza_dedos.receiveShadow = true;

    pinza.add(pinza_dedos);
    pinza.rotation.z = -Math.PI/2;
    pinza.rotation.x = -Math.PI/2;
    pinza.position.set(-10,-5,25);
    pinza1_completa.add(pinza);


    pinza2_completa = pinza1_completa.clone();
    pinza2_completa.rotation.z = Math.PI;

    antebrazo_cilindro.add(pinza2_completa);
    antebrazo_cilindro.add(pinza1_completa);
    antebrazo_robot.add(antebrazo_cilindro);

    brazo_robot.add(antebrazo_robot);
    
    robot.add(brazo_robot);
    //robot.castShadow = true;
    //robot.receiveShadow = true;
    scene.add(robot);

}


function update(){
    TWEEN.update();
   
    if (animacion_activada){
        if(primera_animacion){
            primera_animacion = false;
            antes=Date.now();
            ahora = Date.now();
        }
        else{
            ahora = Date.now();
        }
        // El robot da vueltas en circulos
        var tiempoTranscurrido = (ahora - antes) / 1000; 
        var angulo = velocidad_rotacion * tiempoTranscurrido;

        robot.position.x = radio * Math.cos(angulo);
        robot.position.z = radio * Math.sin(angulo);

    }
    
}

function updateAspectRatio(){
    //Renueva la relación de aspecto por cambio del documento
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    //Hay que actualizar la projection
    camera.updateProjectionMatrix();

}

function render(){
    requestAnimationFrame(render);
    update();

    //CAMARA GENERAL
    renderer.setViewport (0,0,window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    renderer.setScissorTest(true);

    var aspectRatio = window.innerWidth / window.innerHeight;

    if (aspectRatio > 1.0){
        renderer.setScissor(0, window.innerHeight - window.innerHeight / 4, window.innerHeight/4, window.innerHeight/4);
        renderer.setViewport (0,window.innerHeight - window.innerHeight / 4,window.innerHeight/4, window.innerHeight/4);
    }
    else{
        renderer.setScissor(0, window.innerHeight - window.innerWidth / 4, window.innerWidth/4, window.innerWidth/4);
        renderer.setViewport (0,window.innerHeight - window.innerWidth / 4,window.innerWidth/4, window.innerWidth/4);
    }
     
    renderer.render(scene, camara_cenital);

    renderer.setScissorTest(false);
}

function main(){
    init();
    dibujar_escena();
    showRobotControlsGUI();
    render();
}

