import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { Stats } from '../../libs/stats.module.js';
import { CanvasUI } from '../../libs/CanvasUI.js'
import { ARButton } from '../../libs/ARButton.js';
import {
	Constants as MotionControllerConstants,
	fetchProfile
} from '../../libs/three/jsm/motion-controllers.module.js';

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles';
const DEFAULT_PROFILE = 'generic-trigger';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		
		this.scene = new THREE.Scene();
        
        this.scene.add ( this.camera );
       
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
        document.body.appendChild( this.stats.dom );
        
        this.origin = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.euler = new THREE.Euler();
        
        this.initScene();
        this.setupXR();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        this.dummyCam = new THREE.Object3D();
        this.camera.add( this.dummyCam );
        
        this.createUI();
    }
    
    createUI() {
        
        const config = {
            panelSize: { width: 0.6, height: 0.3 },
            width: 512,
            height: 256,
            opacity: 0.7,
            body:{
                fontFamily:'Arial', 
                fontSize:20, 
                padding:20, 
                backgroundColor: '#000', 
                fontColor:'#fff', 
                borderRadius: 6,
                opacity: 0.7
            },
            info:{
                type: "text",
                position:{ x:0, y:0 },
                height: 128
            },
            msg:{
                type: "text",
                position:{ x:0, y:128 },
                fontSize: 30,
                height: 128
            }
        }
        const content = {
            info: "info",
            msg: "controller"
        }
        
        const ui = new CanvasUI( content, config );
        ui.mesh.material.opacity = 0.7;
        
        this.ui = ui;
    }
    
    setupXR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller;
        
        function onConnected( event ) {
            if (self.info === undefined){
                const info = {};

                fetchProfile( event.data, DEFAULT_PROFILES_PATH, DEFAULT_PROFILE ).then( ( { profile, assetPath } ) => {
                    console.log( JSON.stringify(profile));

                    info.name = profile.profileId;
                    info.targetRayMode = event.data.targetRayMode;

                    Object.entries( profile.layouts ).forEach( ( [key, layout] ) => {
                        const components = {};
                        Object.values( layout.components ).forEach( ( component ) => {
                            components[component.type] = component.gamepadIndices;
                        });
                        info[key] = components;
                    });

                    self.info = info;
                    self.ui.updateElement( "info", JSON.stringify(info) );

                } );
            }
        }
        
        function onSessionStart(){
            
        }
        
        function onSessionEnd(){
            
        }
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
    createMsg( pos, rot ){
        const msg = `position:${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)} rotation:${rot.x.toFixed(2)},${rot.y.toFixed(2)},${rot.z.toFixed(2)}`;
        return msg;
    }
    
	render( ) {   
        const dt = this.clock.getDelta();
        this.stats.update();
        this.ui.update();
        if (this.renderer.xr.isPresenting){
            const pos = this.controller.getWorldPosition( this.origin );
            this.euler.setFromQuaternion( this.controller.getWorldQuaternion( this.quaternion ));
            
            const msg = this.createMsg( pos, this.euler );
            this.ui.updateElement("msg", msg);
        }
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };