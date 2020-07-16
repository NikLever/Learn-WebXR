import * as THREE from '../../libs/three/three.module.js';
import { BoxLineGeometry } from '../../libs/three/jsm/BoxLineGeometry.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { VRButton } from '../../libs/VRButton.js';
import {  THREEx } from './threex.htmlmixer.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
        
        this.lights = { ambient, light };
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( this.renderer.domElement );
        
        this.mixerContext= new THREEx.HtmlMixer.Context( this.renderer, this.scene, this.camera );

        this.initScene();
        this.setupXR();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        this.room = new THREE.LineSegments(
					new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ),
					new THREE.LineBasicMaterial( { color: 0x808080 } )
				);
        this.room.geometry.translate( 0, 3, 0 );
        this.scene.add( this.room );
        
        // set up rendererCss
        const rendererCss		= this.mixerContext.rendererCss;
        rendererCss.setSize( window.innerWidth, window.innerHeight );
        // set up rendererWebgl
        const rendererWebgl	= this.mixerContext.rendererWebgl;


        const css3dElement		= rendererCss.domElement
        css3dElement.style.position	= 'absolute'
        css3dElement.style.top		= '0px'
        css3dElement.style.width	= '100%'
        css3dElement.style.height	= '100%'
        document.body.appendChild( css3dElement );

        const webglCanvas			= rendererWebgl.domElement
        webglCanvas.style.position	= 'absolute'
        webglCanvas.style.top		= '0px'
        webglCanvas.style.width		= '100%'
        webglCanvas.style.height	= '100%'
        webglCanvas.style.pointerEvents	= 'none'
        css3dElement.appendChild( webglCanvas );

        //////////////////////////////////////////////////////////////////////////////////
        //		create a Plane for THREEx.HtmlMixer				//
        //////////////////////////////////////////////////////////////////////////////////


        // create the iframe element
        const url		= 'https://threejs.org/';
        const domElement	= document.createElement('iframe')
        domElement.src	= url;
        domElement.style.border	= 'none';

        // create the plane
        const mixerPlane	= new THREEx.HtmlMixer.Plane( this.mixerContext, domElement);
        mixerPlane.object3d.scale.multiplyScalar(2);
        mixerPlane.object3d.position.set( 0, 1.5, -1 );
        this.scene.add(mixerPlane.object3d);
    }
    
    setupXR(){this.renderer.xr.enabled = true; 
        
        const self = this;
        
        const btn = new VRButton( this.renderer );
        
        const controllerModelFactory = new XRControllerModelFactory();

        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.scene.add( this.controller );
        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.scene.add( this.controllerGrip );
        
        // controller
        this.controller1 = this.renderer.xr.getController( 1 );
        this.scene.add( this.controller1 );
        this.controllerGrip1 = this.renderer.xr.getControllerGrip( 1 );
        this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
        this.scene.add( this.controllerGrip1 );
        
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 10;

        this.controller.add( line.clone() );
        this.controller1.add( line.clone() );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
        this.mixerContext.rendererCss.setSize( window.innerWidth, window.innerHeight )
    }
    
	render( timestamp, frame ) {
        const dt = this.clock.getDelta();
        const now = this.clock.getElapsedTime();
        this.mixerContext.update(dt, now);
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };