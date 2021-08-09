import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		this.camera=new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight,0.1, 100);
		this.camera.position.set(0,0,4);

		this.scene = new THREE.Scene();
		this.scene.background=new THREE.Color (0xaaaaaa);
		this.renderer= new THREE.WebGLRenderer({antialias:true});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize (window.innerWidth, window.innerHeight);
		container.appendChild(this.renderer.domElement);

		this.renderer.setAnimationLoop(this.render.bind(this));

    
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    resize(){
        
    }
    
	render( ) {  
		this.renderer.render(this.scene, this.camera);
        
    }
}

export { App };