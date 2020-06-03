import * as THREE from '../../libs/three/three.module.js';
import { ARButton } from '../../libs/three/jsm/ARButton.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.5, 0.5, 1 );
		this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.xr.enabled = true;
		container.appendChild( this.renderer.domElement );
		
		document.body.appendChild( ARButton.createButton( this.renderer, { requiredFeatures: [ 'hit-test' ] } ) );
        
        const self = this;
        
        const geometry = new THREE.CylinderBufferGeometry( 0, 0.05, 0.2, 32 );
        const material = new THREE.MeshLambertMaterial( { color: 0x0022ff });
        this.mesh = new THREE.Mesh( geometry, material );

        function onSelect() {
            const mesh = self.mesh.clone();
            mesh.position.set( 0, 0, -0.3 ).applyMatrix4( self.controller.matrixWorld );
            mesh.quaternion.setFromRotationMatrix( self.controller.matrixWorld );
            self.scene.add( mesh );
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        this.scene.add( this.controller );
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();
    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
	render() {

        this.renderer.render( this.scene, this.camera );

    }
}

export { App };
