import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
// allow to create animation in camera position
import TWEEN from "https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.5.0/dist/tween.esm.js";
//allow to create smooth animations
import { gsap } from 'https://cdn.skypack.dev/gsap';

if (document.getElementById('Card') != null) {
    let canvasform = document.getElementById('Card');
    let width = canvasform.offsetWidth;
    let height = canvasform.offsetHeight;
    //create a THREE.js scence

    let scene = new THREE.Scene();

    //create a camera

    let camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 900);

    //To keep a 3D Object
    let object;

    //To add Orbit Controlls to the camera
    let controls;

    //instaniate a loader for the .gilf file

    let loaderer = new GLTFLoader();
    loaderer.load(
        "models/card.glb",
        function (gltf) {
            object = gltf.scene;
            scene.add(object);
            object.position.y = -1.5
            object.rotation.y = -1.78
        }
    );
    let renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    document.getElementById('Card').appendChild(renderer.domElement);

    //set camera
    camera.position.set(5, 0, 1); //x,y,z

    //add light
    let ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    let directionLight = new THREE.DirectionalLight(0xffffff, 2);
    scene.add(directionLight);

    //add controls to the camera
    controls = new OrbitControls(camera, renderer.domElement);

    //render the scene

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        TWEEN.update();
        if(object){
            gsap.to(object.rotation,{
                y: 1.38,
                duration: 5
            })
        }
    }
    animate();
}