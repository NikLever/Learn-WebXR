import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { Stats } from '../../libs/stats.module.js';
import { CanvasGUI } from '../../libs/CanvasGUI.js'
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Player } from '../../libs/Player.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		
		this.scene = new THREE.Scene();
       
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
        
        this.debug = false;
        
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
				const scale = 0.005;
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
        
        const gestures = new Hammer(this.renderer.domElement);
        gestures.get('pinch').set({ enable: true });
        gestures.get('rotate').set({ enable: true });
        gestures.on('pan', function(ev) {
            console.log(ev);
            self.gui.updateElement( "info", 'pan:'+ev );
        });
        gestures.on('swipe', function(ev) {
            console.log(ev);
            self.gui.updateElement( "info", 'swipe'+ev );
        });
        gestures.on('pinch', function(ev) {
            console.log(ev);
            self.gui.updateElement( "info", 'pinch:'+ev );
        });
        gestures.on('rotate', function(ev) {
            console.log(ev);
            self.gui.updateElement( "info", 'rotate:'+ev );
        });
    }
    
    createGUI() {
        
        const css = {
            panelSize: { width: 0.8, height: 0.3 },
            width: 512,
            height: 256,
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
            info: "Debug info",
        }
        
        const gui = new CanvasGUI( content, css );
        gui.mesh.material.opacity = 0.7;
        
        this.gui = gui;
    }
    
    setupVR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller;
        
        function onSessionStart(){
            self.gui.mesh.position.set( 0, 0, - 1 ).applyMatrix4( controller.matrixWorld );
            self.gui.mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
            self.scene.add( self.gui.mesh );
        }
        
        function onSessionEnd(){
            self.scene.remove( self.gui.mesh );
        }
        
        function onSelect() {
            if (!self.knight.object.visible){
                self.knight.object.visible = true;
                self.knight.object.position.set( 0, 0, - 1 ).applyMatrix4( controller.matrixWorld );
                self.knight.object.quaternion.setFromRotationMatrix( controller.matrixWorld );
                self.scene.add( self.knight.object );
            }
            this.debug = !this.debug;
        }

        const btn = new ARButton( this.renderer, onSessionStart, onSessionEnd );
        
        controller = this.renderer.xr.getController( 0 );
        controller.addEventListener( 'select', onSelect );
        this.scene.add( controller );
        this.controller = controller;
        
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
        this.gui.update();
        if (this.renderer.xr.isPresenting && this.debug){
            const pos = this.controller.position;
            const rot = this.controller.rotation;
            const infoStr = `position:${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)} rotation:${rot.x.toFixed(2)},${rot.y.toFixed(2)},${rot.z.toFixed(2)}`
            this.gui.updateElement("info", infoStr);
            this.gui.mesh.position.set( 0, 0, - 1 ).applyMatrix4( this.controller.matrixWorld );
            this.gui.mesh.quaternion.setFromRotationMatrix( this.controller.matrixWorld );
        }
        if ( this.knight !== undefined ) this.knight.update(dt);
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };