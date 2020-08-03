import * as THREE from '../../libs/three/three.module.js';
import { RingProgressMesh } from '../../libs/RingProgressMesh.js'

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
                
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );
        this.scene.add( this.camera );
        
        this.clock = new THREE.Clock();
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.initScene();
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        this.ring = new RingProgressMesh(0.2);
        this.ring.position.set(0,0,-1);
        
        this.camera.add( this.ring );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.ring.progress = (this.clock.getElapsedTime() % 1) ;
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };