import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { BoxLineGeometry } from '../../libs/three/jsm/BoxLineGeometry.js';
import { Stats } from '../../libs/stats.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';


class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();
        
        this.stats = new Stats();
        
        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.workingVector = new THREE.Vector3();
        
        this.initScene();
        this.setupXR();
        
        window.addEventListener('resize', this.resize.bind(this) );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    initScene(){
        this.radius = 0.08;
        
        this.room = new THREE.LineSegments(
					new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ),
					new THREE.LineBasicMaterial( { color: 0x808080 } )
				);
        this.room.geometry.translate( 0, 3, 0 );
        this.scene.add( this.room );
        
        const geometry = new THREE.IcosahedronBufferGeometry( this.radius, 2 );

        for ( let i = 0; i < 200; i ++ ) {

            const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

            object.position.x = this.random( -2, 2 );
            object.position.y = this.random( -2, 2 );
            object.position.z = this.random( -2, 2 );

            this.room.add( object );
        }
        
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        const button = new VRButton( this.renderer );
        
        this.controllers = this.buildControllers();
        
    }
    
    buildControllers(){
        const controllerModelFactory = new XRControllerModelFactory();
        
        const geometry = new THREE.BufferGeometry().setFromPoints( [
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,-1)
        ]);
        const line = new THREE.Line( geometry );
        line.name = 'line';
        line.scale.z = 0;
        
        const controllers = [];
        
        for(let i=0; i<=1; i++){
            const controller = this.renderer.xr.getController( i );
            controller.add( line.clone() );
            controller.userData.selectPressed = false;
            this.scene.add(controller);
            
            controllers.push( controller );
            
            const grip = this.renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ));
            this.scene.add( grip );
        }
        
        return controllers;
    }
    
    handleController( controller ){
        
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        
        if (this.controllers ){
            const self = this;
            this.controllers.forEach( ( controller) => { 
                self.handleController( controller ) 
            });
        }
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };