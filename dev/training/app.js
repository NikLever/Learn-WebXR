
import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { CanvasGUI } from '../../libs/CanvasGUI.js';
import Questions from './questions.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        
        this.dolly = new THREE.Group();
        this.dolly.position.set(0, 0, 2.0);
        this.dolly.add( this.camera );
        this.scene.add( this.dolly );
        
		const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 1);
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight(0xFFFFFF, 3);
        light.position.set(1,1,1);
        this.scene.add(light)
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setClearColor( 0xcccccc );
		container.appendChild( this.renderer.domElement );

		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
        window.addEventListener( 'resize', this.resize.bind(this) );
        
        this.clock = new THREE.Clock();
        this.up = new THREE.Vector3(0,1,0);
        this.origin = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        
		this.loadingBar = new LoadingBar();
		
		this.loadRoom();
        
        this.createGUI();
        
        window.addEventListener( 'resize', this.resize.bind(this) );
	}
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	loadRoom(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'hospital-room.glb',
			// called when the resource is loaded
			function ( gltf ) {

                const room = gltf.scene;
				self.scene.add( room );
                self.room = room;
                
                const animation = gltf.animations[1];
                const details = animation.name.split('|');
                const patient = room.getObjectByName(details[0]);
                self.mixer = new THREE.AnimationMixer( room );//patient );
                const action = self.mixer.clipAction( gltf.animations[1] );
                action.play();
				
                room.traverse(function (child) {
    				if (child.isMesh){
                        child.material.metalness = 0;
					}
				});
                        
                self.loadingBar.visible = false;
			
                self.setupVR();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
	}
    
    /*An element is defined by 
type: text|image|shape|button
hover: hex
active: hex
position: x,y in pixels of canvas
width: pixels
height: pixels
overflow: fit | scroll | hidden
textAlign: center | left | right
fontSize: pixels
fontColor: hex
fontFamily: string
padding: pixels
backgroundColor: hex
borderRadius: pixels
border: width color style
*/
    createGUI() {
        const css = {
            panelSize: { width: 0.8, height: 1.3 },
            width: 512,
            height: 512,
            opacity: 0.7,
            body:{
                fontFamily:'sans', 
                fontSize:30, 
                padding:10, 
                backgroundColor: '#000', 
                fontColor:'#fff', 
                borderRadius: 6,
                border:{ width: 2, color:"#fff", style:"solid" },
                opacity: 0.7
            },
            header:{
                type: "text",
                position:{ x:0, y:0 },
                height: 40
            },
            panel:{
                type: "text",
                position:{ x:0, y:40 },
                height: 432,
                backgroundColor: "#ffa",
                fontColor: "#000",   
                overflow: "scroll"
            },
            prev:{
                type: "button",
                position: { x:0, y: 472 },
                width: 40,
                height: 40
            },
            next:{
                type: "button",
                position: { x:40, y: 472 },
                width: 40,
                height: 40
            },
            continue:{
                type: "button",
                position: { x:212, y: 472 },
                width: 300,
                height: 40
            }
        }
        const content = {
            header: "Intro",
            panel: Questions.intro,
            prev: "<path>m 5 20 l 35 35 l 35 5 z</path>",
            next: "<path>m 35 20 l 5 5 l 5 35 z</path>",
            continue: "Continue"
        }
        
        const gui = new CanvasGUI( content, css );
        gui.mesh.position.set(-0.5, 1.0, -1.2);
        gui.mesh.rotation.x = -0.2;
        gui.mesh.material.opacity = 0.7;
        
        this.dolly.add( gui.mesh );
        
        this.gui = gui;
    }
    
    setupVR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        const button = new VRButton( this.renderer );
        
        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', this.onSelectStart.bind(this) );
        this.controller.addEventListener( 'selectend', this.onSelectEnd.bind(this) );
        this.controller.addEventListener( 'disconnected', this.controllerDisconnected.bind(this) );
        this.dolly.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.dolly.add( this.controllerGrip );
        
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 0;

        this.controller.add( line.clone() );
        
        this.selectPressed = false;
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    controllerDisconnected(){
        this.controller.remove( this.controller.children[0] );
        this.controller = null;
        this.controllerGrip = null;
    }
    
    onSelectStart( event ) {
        
        this.children[0].scale.z = 10;
        this.userData.selectPressed = true;
        
    }

    onSelectEnd( event ) {
        
        this.children[0].scale.z = 10;
        this.userData.selectPressed = false;
        
    }
    
    handleController( controller ){
        
    }
		
	render( ){
        ThreeMeshUI.update();
        const dt = this.clock.getDelta();
        if ( this.mixer !== undefined ) this.mixer.update(dt);
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
