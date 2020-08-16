import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

import { TeleportMesh } from '../../libs/TeleportMesh.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
                
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        this.camera.lookAt( 0, 1, -4 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );
        this.scene.add( this.camera );
        
        const ambient = new THREE.HemisphereLight( 0xaaaaaa, 0x444444 );
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set(1,1,1);
        this.scene.add(light);
        
        this.clock = new THREE.Clock();
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        const controls = new OrbitControls( this.camera, this.renderer.domElement );
        controls.target.set(0, 1, -4);
        controls.update();
        
		container.appendChild( this.renderer.domElement );
        
        this.workingMatrix = new THREE.Matrix4();
        this.raycaster = new THREE.Raycaster();
        
        this.initScene();
        this.setupXR();
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene( ){
        this.teleport = new TeleportMesh();
        this.teleport.position.set(0, 0, -4);
        this.scene.add( this.teleport );
        this.teleport.fadeIn(2);
    }
    
    setupXR(){
        const self = this;
        
        const btn = new VRButton( this.renderer );
        
        function onSelectStart() {
            this.userData.selectPressed = true;
            if ( self.teleport.selected ){
                if (self.teleport.state == 'inactive'){
                    self.teleport.fadeIn(2);
                }else{
                    self.teleport.fadeOut(2);
                }
            }
        }

        function onSelectEnd() {
            this.userData.selectPressed = false;
        }
        
        this.controllers = this.buildControllers();
        
        this.controllers.forEach( controller => {
            controller.addEventListener( 'selectstart', onSelectStart );
            controller.addEventListener( 'selectend', onSelectEnd );
        });
    }
    
    buildControllers(){
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

        const material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

        const line = new THREE.Line( geometry, material );
        
        const controllers = []
        
        for( let i=0; i<=1; i++){
            const controller = this.renderer.xr.getController( i );
            controller.add( line.clone() );
            this.scene.add( controller );
            controllers.push( controller );
            
            const grip = this.renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ) );
            this.scene.add( grip );
        }
        
        return controllers;
    }
    
    get selected(){
        const selected = this.controllers.filter( controller => controller.userData.selected );    
        return selected.length>0;
    }
    
    handleControllers( controller ){   
        this.workingMatrix.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

        const intersects = this.raycaster.intersectObject( this.teleport.children[0] );

        if (intersects.length>0){
            controller.userData.selected = true;
        }else{
            controller.userData.selected = false;
        }
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {  
        this.controllers.forEach( controller => this.handleControllers(controller) );
        this.teleport.selected = this.selected;
        
        this.teleport.update();
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };