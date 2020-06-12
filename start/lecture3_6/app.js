import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { BoxLineGeometry } from '../../libs/three/jsm/BoxLineGeometry.js';
import { Stats } from '../../libs/stats.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import {
	Constants as MotionControllerConstants,
	fetchProfile,
	MotionController
} from '../../libs/three/jsm/motion-controllers.module.js';

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles';
const DEFAULT_PROFILE = 'generic-trigger';

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
        this.setupVR();
        
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
        
        this.highlight = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide } ) );
        this.highlight.scale.set(1.2, 1.2, 1.2);
        
        this.gui = this.createTextPanel();
    }
    
    createTextPanel(){
         const container = ThreeMeshUI.Block({
            width: 1.2,
            height: 0.5,
            padding: 0.05,
            justifyContent: 'center',
            alignContent: 'left',
            fontFamily: '../../assets/fonts/roboto/Roboto-msdf.json',
            fontTexture: '../../assets/fonts/roboto/Roboto-msdf.png'
        });

	    container.position.set( 0, 1, -1.8 );
	    container.rotation.x = -0.55;
        
        this.guiText = ThreeMeshUI.Text({
                content: "This will display debugging information",
                fontSize: 0.055
            });

        container.add( this.guiText );
        
        this.scene.add( container );
        
        return container;
    }
    
    //{"trigger":{"button":0},"touchpad":{"button":2,"xAxis":0,"yAxis":1}},"squeeze":{"button":1},"thumbstick":{"button":3,"xAxis":2,"yAxis":3},"button":{"button":6}}}
    createButtonStates(components){

        this.buttonStates = {};
        this.gamepadIndices = components;
        
        if ( components.trigger !== undefined ){
            this.buttonStates.trigger = 0;
        }
        
        if ( components.squeeze !== undefined ){
            this.buttonStates.squeeze = 0;
        }
        
        if ( components.button !== undefined ){
            this.buttonStates.button = 0;
        }
        
        if ( components.touchpad !== undefined ){
            this.buttonStates.touchpad = { button: 0, xAxis: 0, yAxis: 0 };
        }
        
        if ( components.thumbstick !== undefined ){
            this.buttonStates.thumbstick = { button: 0, xAxis: 0, yAxis: 0 };
        }
        
    }
    
    updateGUI(){
        this.guiText.set( { content: JSON.stringify( this.buttonStates )});
        ThreeMeshUI.update();    
    }
    
    updateGamepadState(){
        const session = this.renderer.xr.getSession();
        
        const inputSource = session.inputSources[0];
        
        if (inputSource && inputSource.gamepad && this.gamepadIndices && this.gui && this.buttonStates){
            const gamepad = inputSource.gamepad;
            try{
                Object.entries( this.buttonStates ).forEach( ( [ key, value ] ) => {
                    const buttonIndex = this.gamepadIndices[key].button;
                    if ( key == 'touchpad' || key == 'thumbstick'){
                        const xAxisIndex = this.gamepadIndices[key].xAxis;
                        const yAxisIndex = this.gamepadIndices[key].yAxis;
                        this.buttonStates[key].button = gamepad.buttons[buttonIndex].value; 
                        this.buttonStates[key].xAxis = gamepad.axes[xAxisIndex].toFixed(2); 
                        this.buttonStates[key].yAxis = gamepad.axes[yAxisIndex].toFixed(2); 
                    }else{
                        this.buttonStates[key] = gamepad.buttons[buttonIndex].value;
                    }
                    
                    this.updateGUI();
                });
            }catch(e){
                console.warn("An error occurred setting the gui");
            }
        }
    }
    
    setupVR(){
        this.renderer.xr.enabled = true;
        
        const button = new VRButton( this.renderer );
        
        this.controllerModelFactory = new XRControllerModelFactory();
        
        const self = this;
        
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'connected', function ( event ) {
            const info = {};
            
            fetchProfile( event.data, DEFAULT_PROFILES_PATH, DEFAULT_PROFILE ).then( ( { profile, assetPath } ) => {
                info.name = profile.profileId;
                info.targetRayMode = event.data.targetRayMode;

                Object.entries( profile.layouts ).forEach( ( [key, value] ) => {
                    const layout = value;
                    const components = {};
                    Object.values( layout.components ).forEach( ( component ) => {
                        components[component.type] = component.gamepadIndices;
                    });
                    info[key] = components;
                });

                self.createButtonStates( info.right );
                
                console.log( JSON.stringify(info) );

                self.updateControllers( info );

            } );
            
        });
        this.controller.addEventListener( 'disconnected', (event) => {
            while( self.controller.children.length > 0) self.controller.remove( self.controller.children[0] );
            self.controller = null;
            self.controllerGrip = null;
            while( self.controller1.children.length > 0) self.controller1.remove( self.controller1.children[0] );
            self.controller1 = null;
            self.controllerGrip1 = null;
        })
        this.scene.add( this.controller );
        
        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( this.controllerModelFactory.createControllerModel( this.controllerGrip ));
        this.scene.add( this.controllerGrip );
        
        this.controller1 = this.renderer.xr.getController( 1 );
        this.scene.add( this.controller1 );
        
        this.controllerGrip1 = this.renderer.xr.getControllerGrip( 1 );
        this.controllerGrip1.add( this.controllerModelFactory.createControllerModel( this.controllerGrip1 ));
        this.scene.add( this.controllerGrip1 );
        
        this.scene.add(this.highlight);

    }
    
    updateControllers(info){
        
        const self = this;
        
        function onSelectStart( ){
            this.userData.selectPressed = true;
        }

        function onSelectEnd( ){
            this.children[0].scale.z = 0;
            this.userData.selectPressed = false;
            this.userData.selected = undefined;
        }

        function onSqueezeStart( ){
            this.userData.squeezePressed = true;
            if (this.userData.selected !== undefined ){
                this.attach( this.userData.selected );
                this.userData.attachedObject = this.userData.selected;
            }
        }

        function onSqueezeEnd( ){
            this.userData.squeezePressed = false;
            if (this.userData.attachedObject !== undefined){
                self.room.attach( this.userData.attachedObject );
                this.userData.attachedObject = undefined;
            }
        }

        self.controller = self.renderer.xr.getController(0);
        self.controller1 = self.renderer.xr.getController(1);
        
        if (info.right !== undefined){
            
            self.buildController( self.controller );
            
            if (info.right.trigger){
                self.controller.addEventListener( 'selectstart', onSelectStart );
                self.controller.addEventListener( 'selectend', onSelectEnd );
            }

            if (info.right.squeeze){
                self.controller.addEventListener( 'squeezestart', onSqueezeStart );
                self.controller.addEventListener( 'squeezeend', onSqueezeEnd );
            }
        }
        
    }
    
    buildController( controller ) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
                
        const material = new THREE.LineBasicMaterial( );

        const mesh = new THREE.Line( geometry, material );
        mesh.scale.z = 0;
        
        controller.add(mesh);
    }
    
    
    handleController( controller ){
        if (controller.userData.selectPressed ){
            controller.children[0].scale.z = 10;

            this.workingMatrix.identity().extractRotation( controller.matrixWorld );

            this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
            this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

            const intersects = this.raycaster.intersectObjects( this.room.children );

            if (intersects.length>0){
                intersects[0].object.add(this.highlight);
                this.highlight.visible = true;
                controller.children[0].scale.z = intersects[0].distance;
                controller.userData.selected = intersects[0].object;
            }else{
                this.highlight.visible = false;
            }
        }
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        if (this.controller ) this.handleController( this.controller );
        if (this.renderer.xr.isPresenting) this.updateGamepadState();
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };