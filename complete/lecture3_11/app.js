import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { Stats } from '../../libs/stats.module.js';
import { CanvasUI } from '../../libs/CanvasUI.js'
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Player } from '../../libs/Player.js';
import { ControllerGestures } from '../../libs/ControllerGestures.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 20 );
		
		this.scene = new THREE.Scene();
        
        this.scene.add(this.camera);
       
		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        this.stats = new Stats();
        
        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();
        
        this.initScene();
        this.setupVR();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        this.loadingBar = new LoadingBar();
        
        this.assetsPath = '../../assets/';
        const loader = new GLTFLoader().setPath(this.assetsPath);
		const self = this;
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`knight2.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				const object = gltf.scene.children[5];
				
				object.traverse(function(child){
					if (child.isMesh){
                        child.material.metalness = 0;
                        child.material.roughness = 1;
					}
				});
				
				const options = {
					object: object,
					speed: 0.5,
					animations: gltf.animations,
					clip: gltf.animations[0],
					app: self,
					name: 'knight',
					npc: false
				};
				
				self.knight = new Player(options);
                self.knight.object.visible = false;
				
				self.knight.action = 'Dance';
				const scale = 0.003;
				self.knight.object.scale.set(scale, scale, scale); 
				
                self.loadingBar.visible = false;
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
        
        this.createGUI();
    }
    
    createGUI() {
        
        const css = {
            panelSize: { width: 0.2, height: 0.05 },
            width: 512,
            height: 128,
            opacity: 0.7,
            body:{
                fontFamily:'Arial', 
                fontSize:30, 
                padding:20, 
                backgroundColor: '#000', 
                fontColor:'#fff', 
                borderRadius: 6,
                opacity: 0.7
            },
            info:{
                type: "text",
                position:{ x:0, y:0 }
            }
        }
        const content = {
            info: "Debug info"
        }
        
        const gui = new CanvasUI( content, css );
        gui.mesh.material.opacity = 0.7;
        
        this.gui = gui;
    }
    
    setupVR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller, controller1;
        
        function onSessionStart(){
            self.gui.mesh.position.set( 0, -0.2, -0.3 );
            self.camera.add( self.gui.mesh );
        }
        
        function onSessionEnd(){
            self.camera.remove( self.gui.mesh );
        }
        
        const btn = new ARButton( this.renderer, onSessionStart, onSessionEnd );
        
        this.gestures = new ControllerGestures( this.renderer );
        this.gestures.addEventListener( 'tap', (ev)=>{
            console.log( 'tap' ); 
            self.gui.updateElement('info', 'tap' );
            if (!self.knight.object.visible){
                self.knight.object.visible = true;
                self.knight.object.position.set( 0, -0.3, -0.5 ).add( ev.position );
                self.scene.add( self.knight.object ); 
            }
        });
        this.gestures.addEventListener( 'doubletap', (ev)=>{
            console.log( 'doubletap'); 
            self.gui.updateElement('info', 'doubletap' );
        });
        this.gestures.addEventListener( 'press', (ev)=>{
            console.log( 'press' );    
            self.gui.updateElement('info', 'press' );
        });
        this.gestures.addEventListener( 'pan', (ev)=>{
            console.log( ev );
            if (ev.initialise !== undefined){
                self.startPosition = self.knight.object.position.clone();
            }else{
                const pos = self.startPosition.clone().add( ev.delta.multiplyScalar(3) );
                self.knight.object.position.copy( pos );
                self.gui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}` );
            } 
        });
        this.gestures.addEventListener( 'swipe', (ev)=>{
            console.log( ev );   
            self.gui.updateElement('info', `swipe ${ev.direction}` );
            if (self.knight.object.visible){
                self.knight.object.visible = false;
                self.scene.remove( self.knight.object ); 
            }
        });
        this.gestures.addEventListener( 'pinch', (ev)=>{
            console.log( ev );  
            if (ev.initialise !== undefined){
                self.startScale = self.knight.object.scale.clone();
            }else{
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.knight.object.scale.copy( scale );
                self.gui.updateElement('info', `pinch delta:${ev.delta.toFixed(3)} scale:${ev.scale.toFixed(2)}` );
            }
        });
        this.gestures.addEventListener( 'rotate', (ev)=>{
            console.log( ev ); 
            if (ev.initialise !== undefined){
                self.startQuaternion = self.knight.object.quaternion.clone();
            }else{
                self.knight.object.quaternion.copy( self.startQuaternion );
                self.knight.object.rotateY( ev.theta );
                self.gui.updateElement('info', `rotate ${ev.theta.toFixed(3)}`  );
            }
        });
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        const dt = this.clock.getDelta();
        this.stats.update();
        if ( this.renderer.xr.isPresenting ){
            this.gestures.update();
            this.gui.update();
        }
        if ( this.knight !== undefined ) this.knight.update(dt);
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };