//REFERENCIAS DE COSAS UTILIZADAS DE INTERNET:
// MODELO 3D DEL COCHE: https://sketchfab.com/3d-models/low-poly-car-93971323324243468f24d7da9d18f617
// MODELO 3D ROCA: https://sketchfab.com/3d-models/western-stylised-rock-24c821bbe0a1469ba66b9d5894546d9a


var renderer, scene, camera, carModel, rockModel, plano_suelo, sphereRadius, lista_rocas, carModelBoundingBox, isColliding, tween_mundo, rocksBoundingBoxes, antes, tiempo_partida_text, juegoEmpezado, numRocas;

 function init(){
    renderer = new THREE.WebGLRenderer({antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x04B0C1), 1.0);
    renderer.shadowMap.enabled  = true; // Habilitar en el motor de render el calculo de sombras

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    mundo = new THREE.Object3D();

    //Atención al evento de resize del documento
    window.addEventListener("resize", updateAspectRatio);

    var aspectRatio_CamPrincp = window.innerWidth / window.innerHeight;

    //CAMARA PRINCIPAL
    camera = new THREE.PerspectiveCamera(75, aspectRatio_CamPrincp, 0.1, 10000);
    camera.position.set(0,415,0);

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(20,400,0); 

    //Limitar el zoom
    cameraControls.minDistance = 20; 
    cameraControls.maxDistance = 30; 

    cameraControls.update();

    scene.add(camera);

    // CAMARA CENITAL
    camara_cenital = new THREE.OrthographicCamera(-25, 25, 25, -25, 0, 2000);
    camara_cenital.position.set(7.5,420,0);
    camara_cenital.lookAt(7.5,410,0);

    scene.add(camara_cenital);

    //Movimiento del coche sobre el plano del suelo con las flechas del teclado
    keyboard = new THREEx.KeyboardState(renderer.domElement);
    renderer.domElement.setAttribute("tabIndex", "0");
    renderer.domElement.focus();
    
    
    keyboard.domElement.addEventListener('keydown', keydownCallback);
    anadirLuces();
    cargarTexturas();
    
    movLateralCoche = 0;
    sphereRadius = 400;

    carModelBoundingBox = new THREE.Box3();
    lista_rocas = [];
    rocksBoundingBoxes = [];
   
    tiempo_partida_text = document.createElement('div');
    tiempo_partida_text.style.position = 'absolute';
    tiempo_partida_text.style.width = 100;
    tiempo_partida_text.style.height = 100;
    tiempo_partida_text.style.fontWeight = 'bold'; 
    tiempo_partida_text.style.backgroundColor = "green";
    tiempo_partida_text.innerHTML = "TIEMPO DE PARTIDA: 0 segundos";
    tiempo_partida_text.style.top = window.innerHeight- (window.innerHeight - window.innerHeight / 4) + 'px';
    tiempo_partida_text.style.left = 0 + 'px';
    document.body.appendChild(tiempo_partida_text);

    boton_select_text = document.createElement('div');
    boton_select_text.style.position = 'absolute';
    boton_select_text.style.width = 100;
    boton_select_text.style.height = 100;
    boton_select_text.style.backgroundColor = "grey";
    boton_select_text.innerHTML = "Selecciona: Comenzar Partida";
    boton_select_text.style.top = window.innerHeight- (window.innerHeight - window.innerHeight / 4) + 50 + 'px';
    boton_select_text.style.left = 0 + 'px';
    document.body.appendChild(boton_select_text);

}

function anadirLuces(){
   

    //Luz ambiental
    var luzAmbiental = new THREE.AmbientLight("grey");
    scene.add(luzAmbiental); 

    //Luz direccional 
    luzDireccional = new THREE.DirectionalLight("brown");
    luzDireccional.position.set(0,450,0);
    luzDireccional.castShadow = true;
    luzDireccionalHelper = new THREE.CameraHelper(luzDireccional.shadow.camera);
    scene.add(luzDireccional);
    //scene.add(luzDireccionalHelper); 

    //Luz focal
    luzFocal = new THREE.SpotLight("orange");
    luzFocal.position.set(-100,500,0);
    luzFocal.penumbra = 0.1;
    luzFocal.distance = 1500;
    luzFocal.castShadow = true;

    luzFocalHelper = new THREE.CameraHelper(luzFocal.shadow.camera);
    //scene.add(luzFocalHelper);
    scene.add(luzFocal);  

    // Luz puntual
    luzPuntual = new THREE.PointLight("red", 0.1);
    luzPuntual.distance = 1500;
    luzPuntual.position.set(0,800,-400);
    luzPuntual.castShadow = true;
    luzPuntualHelper = new THREE.CameraHelper(luzPuntual.shadow.camera);
    //scene.add(luzPuntualHelper);
    scene.add(luzPuntual);  
}

function showGameGUI(){
    const gui = new lil.GUI(); 

    var configuracionGUI = { 
        funcDarVueltaCoche: animarCoche,
        funcComJuego: startGame,
        funcReinicJuego: restartGame,
        numObstaculos: numRocas,
    }; 

    const partida = gui.addFolder('Partida');

    partida.add(configuracionGUI, "funcComJuego").name("Comenzar Partida");

    partida.add(configuracionGUI, "funcReinicJuego").name("Reiniciar Partida");

    const configPartida = gui.addFolder('Configuración Antes de Comenzar Partida');

    configPartida.add(configuracionGUI, "funcDarVueltaCoche").name("Animar Coche");
}

function animarCoche(){
    tween_coche = new TWEEN.Tween(carModel.rotation).to(
        {
          y: carModel.rotation.y - Math.PI,
        },
        800,
        TWEEN.Easing.Back.In
    );
    
    tween_coche.start();
}

function keydownCallback(){
    if (!isColliding){
        if (keyboard.pressed("up")) {
            if (carModel.position.x < 17.5){
                carModel.position.x += 1;
                carModel.position.y = calculateYValueOnSphere(carModel.position.x, carModel.position.z, sphereRadius);
            } 
        }
    
        if (keyboard.pressed("down")) {
            if (carModel.position.x > 8.5){
                carModel.position.x -= 1;
                carModel.position.y = calculateYValueOnSphere(carModel.position.x, carModel.position.z, sphereRadius);
            } 
        }
    
        if (keyboard.pressed("left")) {
            if (movLateralCoche > -20){
                carModel.position.z -=1.0;
                movLateralCoche--;
            }
        }
    
        if (keyboard.pressed("right")) {
            if (movLateralCoche < 20){
                carModel.position.z +=1.0;
                movLateralCoche++;
            }
            
        }
    }
}

function animar(){
    tween_mundo = new TWEEN.Tween(mundo.rotation).to(
        {
          z: Math.PI * 2,
        },
        20000,
        TWEEN.Easing.Linear
    );
    tween_mundo.repeat(Infinity);
   
    tween_mundo.start();
}

function calculateYValueOnSphere(x, z, radius) {
    return Math.sqrt(radius ** 2 - x ** 2 - z ** 2);
}

function cargarTexturas(){
    // Textura suelo
    suelo_textura = new THREE.TextureLoader().load("../textures/sand1.jpg"); // RUTA TEMPORAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    suelo_textura.wrapS = THREE.RepeatWrapping;
    suelo_textura.wrapT = THREE.RepeatWrapping;

    // Create a GLTF loader
    const gltfLoader = new THREE.GLTFLoader();

    // Load a glTF resource
    gltfLoader.load(
       //"../../Texturas/toyota_supra_a80_1993.glb",
       //"../../Texturas/toyota_texture/scene.gltf", 
       "../textures/low_poly_car_texture/scene.gltf", 
       // called when the resource is loaded
        function ( car ) {
            /* car.scene.traverse(c => {
                c.castShadow = true;
                c.receiveShadow = true;
            }); */
            luzDireccional.target = car.scene;
            luzFocal.target = car.scene;
            y_value = calculateYValueOnSphere(7.5, 0, sphereRadius);
            car.scene.position.set(7.5,y_value,0);
            car.scene.receiveShadow = true;
            car.scene.scale.set(0.006,0.006,0.006);
            car.scene.rotation.y = Math.PI/2;
            carModel = car.scene;

            scene.add( carModel );

            car.animations; // Array<THREE.AnimationClip>
            car.scene; // THREE.Group
            car.scenes; // Array<THREE.Group>
            car.cameras; // Array<THREE.Camera>
            car.asset; // Object
            console.log("Coche loaded completo");

        },
        // called while loading is progressing
        function ( xhr ) {

            console.log("car " + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened loading the car model: ', error );

        }
    );

    gltfLoader.load(
        "../textures/western_stylised_rock.glb",
         // called when the resource is loaded
         function ( rock ) {
            y_value = calculateYValueOnSphere(50, 0, sphereRadius);
            rock.scene.position.set(50,y_value,0);
            rock.scene.receiveShadow = true;
            rock.scene.castShadow = true;
            rock.scene.scale.set(0.01,0.01,0.009);
            //rock.scene.rotation.y = Math.PI/2;
            rockModel = rock.scene;
            //mundo.add( rockModel );

            rockModel.traverse(function(node){
                if(node.isMesh){
                    node.castShadow = true;
                }
            });
            rockModel.castShadow = true;
            rockModel.receiveShadow = true;
            rock.animations; 
            rock.scene; 
            rock.scenes; 
            rock.cameras; 
            rock.asset; 
            console.log("Roca loaded completo");
            dibujar_escena();
         },
         // called while loading is progressing
         function ( xhr ) {
 
             console.log( "rock " + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
 
         },
         // called when loading has errors
         function ( error ) {
 
             console.log( 'An error happened loading the rock model: ', error );
 
         }
     ); 

     console.log("FIN CARG TEX");

}

function startGame(){
    if (!isColliding){
        juegoEmpezado = true;
        antes = Date.now();
        animar();
        boton_select_text.innerHTML = "";
    }  
}

function restartGame(){

    juegoEmpezado = false;
    isColliding = false;
    scene = new THREE.Scene();
    mundo = new THREE.Object3D();
    scene.add(camara_cenital);
    scene.add(camera);
    anadirLuces();
    cargarTexturas();
    tiempo_partida_text.innerHTML = "TIEMPO DE PARTIDA: " + 0 + " segundos";
    boton_select_text.innerHTML = "Selecciona: Comenzar Partida";

}

function dibujarTodasRocas(){

    lista_rocas = [];
    rocksBoundingBoxes = [];

    numRocas = 43;
    incremento = (Math.PI/2) / (numRocas/4);

    for(i = 0; i<Math.PI/2; i += incremento){
        new_rock = rockModel.clone();
        const z_random = Math.floor(Math.random() * (20 - (-20) + 1) + (-20)); //[-20,20]
        const x_random = sphereRadius * Math.sin(i);
        y_value = calculateYValueOnSphere(x_random, z_random, sphereRadius);
        new_rock.position.set(x_random ,y_value, z_random);
        new_rock.rotation.z = -i;

        new_rock.receiveShadow = true;
        new_rock.castShadow = true;
        mundo.add(new_rock); 

        rockModelBoundingBox = new THREE.Box3();
        rockModelBoundingBox.setFromObject(new_rock);
        lista_rocas.push(new_rock);
        rocksBoundingBoxes.push(rockModelBoundingBox);  
    }

    for(i = 0; i<Math.PI/2; i += incremento){
        new_rock = rockModel.clone();
        const z_random = Math.floor(Math.random() * (20 - (-20) + 1) + (-20)); //[-20,20]
        const x_random = - sphereRadius * Math.sin(i);
        y_value = calculateYValueOnSphere(x_random, z_random, sphereRadius);
        new_rock.position.set(x_random ,y_value, z_random);
        new_rock.rotation.z = i;

        new_rock.receiveShadow = true;
        new_rock.castShadow = true;
        mundo.add(new_rock); 

        rockModelBoundingBox = new THREE.Box3();
        rockModelBoundingBox.setFromObject(new_rock);
        lista_rocas.push(new_rock);
        rocksBoundingBoxes.push(rockModelBoundingBox); 
    } 
    
    for(i = incremento+Math.PI/2; i<Math.PI; i += incremento){
        new_rock = rockModel.clone();
        const z_random = Math.floor(Math.random() * (20 - (-20) + 1) + (-20)); //[-20,20]
        const x_random = -sphereRadius * Math.sin(i);
        y_value = calculateYValueOnSphere(x_random, z_random, sphereRadius);
        new_rock.position.set(x_random ,-y_value, z_random);
        new_rock.rotation.z = i;

        new_rock.receiveShadow = true;
        new_rock.castShadow = true;
        mundo.add(new_rock); 

        rockModelBoundingBox = new THREE.Box3();
        rockModelBoundingBox.setFromObject(new_rock);
        lista_rocas.push(new_rock);
        rocksBoundingBoxes.push(rockModelBoundingBox); 
    }  

    for(i = incremento+Math.PI/2; i<Math.PI; i += incremento){
        new_rock = rockModel.clone();
        const z_random = Math.floor(Math.random() * (20 - (-20) + 1) + (-20)); //[-20,20]
        const x_random = sphereRadius * Math.sin(i);
        y_value = -calculateYValueOnSphere(x_random, z_random, sphereRadius);
        new_rock.position.set(x_random ,y_value, z_random);
        new_rock.rotation.z = -i;

        new_rock.receiveShadow = true;
        new_rock.castShadow = true;
        mundo.add(new_rock); 

        rockModelBoundingBox = new THREE.Box3();
        rockModelBoundingBox.setFromObject(new_rock);
        lista_rocas.push(new_rock);
        rocksBoundingBoxes.push(rockModelBoundingBox); 
    } 

    
}

function dibujar_escena(){

    //MATERIALES
    const material_suelo = new THREE.MeshLambertMaterial({ wireframe: false, color:"white", map: suelo_textura});


    //SUELO
    //const material_suelo = new THREE.MeshBasicMaterial( {color: "red", wireframe: true} );
    //const geometria_suelo = new THREE.PlaneGeometry(1000,1000, 15, 15);
    
    const geometria_suelo = new THREE.SphereGeometry(sphereRadius, 150, 150 ); 
    
    plano_suelo = new THREE.Mesh( geometria_suelo, material_suelo);
    plano_suelo.rotation.x = -Math.PI/2; //Rotar 90 grados sobre el eje X
    plano_suelo.position.set(0,0,0);

    plano_suelo.castShadow = true;
    plano_suelo.receiveShadow = true;


    dibujarTodasRocas();
    //mundo.add(rockModel);

    //scene.add(rockModel);
    
    mundo.add( plano_suelo );


    mundo.castShadow = true;
    mundo.receiveShadow = true;

    //scene.add(rockModel); 
    scene.add(mundo);


    //lista_rocas.push(rockModel);
    console.log("Añadido");
    console.log("Añadido.length: ", lista_rocas.length);

    carModelBoundingBox.setFromObject(carModel);
    

}

function checkCollisions(rocksBoundingBoxes, carModelBoundingBox) {
    for(i = 0; i<rocksBoundingBoxes.length; i++){
        if (rocksBoundingBoxes[i].intersectsBox(carModelBoundingBox)){
            return true;
        }  
    }
}

function updateBoundingBoxes() {
    carModelBoundingBox.setFromObject(carModel);
    for(i = 0; i<rocksBoundingBoxes.length; i++){
        rocksBoundingBoxes[i].setFromObject(lista_rocas[i]);
    }
}

function update(){

    TWEEN.update(); 

    if (!isColliding & juegoEmpezado){
        var ahora = Date.now();
        tiempo_partida = ahora - antes;
    
        tiempo_partida_text.innerHTML = "TIEMPO DE PARTIDA: " + tiempo_partida/1000 + " segundos";

        updateBoundingBoxes();
        //const isColliding = checkCollision(rockModelBoundingBox, carModelBoundingBox);
        isColliding = checkCollisions(rocksBoundingBoxes, carModelBoundingBox);


        if (isColliding) {
            console.log("Collision");
            tween_mundo.stop();
            juegoEmpezado = false;
            boton_select_text.innerHTML = "Selecciona: Reiniciar Partida";
        }
    }
}

function updateAspectRatio(){
    //Renueva la relación de aspecto por cambio del documento
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;

    tiempo_partida_text.style.top = window.innerHeight- (window.innerHeight - window.innerHeight / 4) + 'px';
    boton_select_text.style.top = window.innerHeight- (window.innerHeight - window.innerHeight / 4) + 50 + 'px';
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
    //dibujar_escena();
    showGameGUI();
    render();
}

