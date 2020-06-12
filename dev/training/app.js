
import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 500 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        
        this.dolly = new THREE.Group();
        this.dolly.position.set(0, 0, 2.3);
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
                self.mixer = new THREE.AnimationMixer( patient );
                const action = self.mixer.clipAction( gltf.animations[1] );
                action.play();
				
                room.traverse(function (child) {
    				if (child.isMesh){
                        //console.log(child.material.name);
                        //const material = new THREE.MeshBasicMaterial( { map: child.material.map });
                        //child.material = material;
                        child.material.metalness = 0;
					}else{
                        //console.log(child.name);
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
    
    setupVR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        const button = new VRButton( this.renderer );
        
        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', this.onSelectStart.bind(this) );
        this.controller.addEventListener( 'selectend', this.onSelectEnd.bind(this) );
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
    
    onSelectStart( event ) {
        
        this.selectPressed = true;
        
    }

    onSelectEnd( event ) {
        
        this.selectPressed = false;
        
    }
		
	render( timestamp, frame ){
        const dt = this.clock.getDelta();
        if (this.mixer) this.mixer.update(dt);
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
