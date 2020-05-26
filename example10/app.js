import * as THREE from '../libs/three/three.module.js';
import { GLTFLoader } from '../libs/three/jsm/GLTFLoader.js';
import { ARButton } from '../libs/three/jsm/ARButton.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { Player } from '../libs/Player.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
        this.loadingBar = new LoadingBar();

		this.assetsPath = '../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.xr.enabled = true;
		container.appendChild( this.renderer.domElement );
		
		document.body.appendChild( ARButton.createButton( this.renderer, { requiredFeatures: [ 'hit-test' ] } ) );
        
        const self = this;

        function onSelect() {
            if (self.fred===undefined) return;
            self.fred.object.position.set( 0, 0, - 0.3 ).applyMatrix4( self.controller.matrixWorld );
            self.fred.object.quaternion.setFromRotationMatrix( self.controller.matrixWorld );
            self.fred.object.visible = true;
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        this.scene.add( this.controller );
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();
    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
        
        this.loadFred();
	}
	
    loadFred(){
	   const loader = new GLTFLoader().setPath(this.assetsPath);
		const self = this;
		
		const anims = [
					{start:30, end:59, name:"backpedal", loop:true},
					{start:90, end:129, name:"bite", loop:false},
					{start:164, end:193, name:"crawl", loop:true},
					{start:225, end:251, name:"die", loop:false},
					{start:255, end:294, name:"hitBehind", loop:false},
					{start:300, end:344, name:"hitFront", loop:false},
					{start:350, end:384, name:"hitLeft", loop:false},
					{start:390, end:424, name:"hitRight", loop:false},
					{start:489, end:548, name:"idle", loop:true},
					{start:610, end:659, name:"jump", loop:false},
					{start:665, end:739, name:"roar", loop:false},
					{start:768, end:791, name:"run", loop:true},
					{start:839, end:858, name:"shuffleLeft", loop:true},
					{start:899, end:918, name:"shuffleRight", loop:true},
					{start:940, end:979, name:"spawn", loop:false},
					{start:1014, end:1043, name:"strafeRight", loop:true},
					{start:1104, end:1133, name:"strafeRight", loop:true},
					{start:1165, end:1229, name:"swipe", loop:false},
					{start:1264, end:1293, name:"walk", loop:true}
				];
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`fred.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				const object = gltf.scene.children[0];
				
				object.traverse(function(child){
					if (child.isMesh){
						child.castShadow = true;
					}
				});
				
				const options = {
					object: object,
					speed: 5,
					assetsPath: self.assetsPath,
					loader: loader,
					anims: anims,
					clip: gltf.animations[0],
					app: self,
					name: 'fred',
					npc: false
				};
				
				self.fred = new Player(options);
                self.fred.object.visible = false;
				
				self.fred.action = 'idle';
				const scale = 0.0015;
				self.fred.object.scale.set(scale, scale, scale); 
				
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( () => { self.render(); } );
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
    
	render( ) {
        const dt = this.clock.getDelta();
        if (this.fred) this.fred.update(dt);
        
        this.renderer.render( this.scene, this.camera );

    }
}

export { App };
