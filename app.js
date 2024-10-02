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
    let ambientLight = new THREE.AmbientLight(0x404040, 5);
    scene.add(ambientLight);

    let directionLight = new THREE.DirectionalLight(0x404040, 5);
    scene.add(directionLight);

    //add controls to the camera
    controls = new OrbitControls(camera, renderer.domElement);

    //render the scene

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        TWEEN.update();
        if (object) {
            gsap.to(object.rotation, {
                y: 1.38,
                duration: 5
            })
        }
    }
    animate();
    document.getElementById('showmore').onclick = () => {
        window.location.href = "info.html";

    }
}
if (document.getElementById('container3D') != null) {
    const camera = new THREE.PerspectiveCamera(
        1,// vieweing Angle 👁️<
        window.innerWidth / window.innerHeight, // aspect
        0.1, //near
        1000 //distance
    );
    camera.position.z = 13; //to see everything inthe scene

    const scene = new THREE.Scene();
    let object;
    let mixer;
    const loader = new GLTFLoader(); // reader glb files
    loader.load('models/mech_drone.glb', //3D Model Path
        function (gltf) {   //This will run when the model loder prosses is done 
            object = gltf.scene;
            scene.add(object);
            object.position.y = -0.3;
            object.position.z = -20;
            object.rotation.y = 3.2;

            mixer = new THREE.AnimationMixer(object);
            mixer.clipAction(gltf.animations[0]).play();
        },
        function (xhr) { },//This will run until the code ends
        function (error) { } //This will run when there is an error while importing your 3D model
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true /*to make the bacjkground transparent */ }); //to to create a renderer to render the 3D model
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container3D').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3); //light
    scene.add(ambientLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 15);
    topLight.position.set(500, 5000, 400);
    scene.add(topLight);

    const reRender3D = () => {
        requestAnimationFrame(reRender3D);
        renderer.render(scene, camera); //to render everything
        if (mixer) mixer.update(0.005); //animations
    };
    reRender3D();

    let arrPositionModel = [
        {
            id: 'banner',
            position: { x: 0, y: -0.3, z: -20 },
            rotation: { x: 0, y: 3.2, z: 0 }
        },
        {
            id: 'intro',
            position: { x: -0.5, y: -0.3, z: -20 },
            rotation: { x: 0, y: -1, z: 0 }
        },
        {
            id: 'description',
            position: { x: 0.3, y: -0.3, z: -20 },
            rotation: { x: 0, y: 2.5, z: 0 }
        },
        {
            id: 'contact',
            position: { x: 0.7, y: -0.5, z: -50 },
            rotation: { x: 0.5, y: 1, z: 0 }
        }
    ]


    const modelMove = () => {
        const section = document.querySelectorAll('.section');
        let currentSection;
        section.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 1.5) {
                currentSection = section.id;
            }
        });
        let position_active = arrPositionModel.findIndex(
            (val) => val.id == currentSection
        );
        if (position_active >= 0) {
            let new_coordinates = arrPositionModel[position_active];
            gsap.to(object.position, {
                x: new_coordinates.position.x,
                y: new_coordinates.position.y,
                z: new_coordinates.position.z,
                duration: 2,
                ease: "power1.out"
            });
            gsap.to(object.rotation, {
                x: new_coordinates.rotation.x,
                y: new_coordinates.rotation.y,
                z: new_coordinates.rotation.z,
                duration: 2,
                ease: "power1.out"
            });
        }
    }
    window.addEventListener("scroll", () => {
        if (object) {
            modelMove();
        }
    })

    document.getElementById('goback').onclick = () => {
        window.location.href = "index.html";
    }
}

