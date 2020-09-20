
import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { CanvasUI } from '../../libs/CanvasUI.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        
        this.dolly = new THREE.Group();
        this.dolly.position.set(0, 0, 2.0);
        this.dolly.add( this.camera );
        this.scene.add( this.dolly );
        
		const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 1);
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight(0xFFFFFF, 3);
        light.position.set(1,1,1);
        this.scene.add(light)
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setClearColor( 0xcccccc );
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();

		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
        window.addEventListener( 'resize', this.resize.bind(this) );
        
        this.clock = new THREE.Clock();
        this.up = new THREE.Vector3(0,1,0);
        this.origin = new THREE.Vector3();
        this.workingMatrix = new THREE.Matrix4();
        this.raycaster = new THREE.Raycaster();
        
        // create an AudioListener and add it to the camera
        this.listener = new THREE.AudioListener();
        this.camera.add( this.listener );
        
        const self = this;
        fetch( 'questions.json' ).then( response => response.json() ).then( obj =>{
            self.questions = obj;
            self.createUI();
        });
        
		this.loadingBar = new LoadingBar();
		
		this.loadRoom();
        
        
        window.addEventListener( 'resize', this.resize.bind(this) );
	}
	
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	loadRoom(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'hospital-room.glb',
			// called when the resource is loaded
			function ( gltf ) {

                const room = gltf.scene;
				self.scene.add( room );
                self.room = room;
                
                const animation = gltf.animations[1];
                const details = animation.name.split('|');
                const patient = room.getObjectByName(details[0]);
                self.mixer = new THREE.AnimationMixer( patient );
                const action = self.mixer.clipAction( gltf.animations[1] );
                action.play();
                        
                self.loadingBar.visible = false;
			
                self.setupXR();
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
    
    createUI() {
        const headerHeight = 50;
        const panelHeight = 512;
        const footerHeight = headerHeight;
        
        const self = this;
        
        let questionIndex = -1;
        let answerIndex = 0;
        
        function showIntro(){
            self.ui.updateElement( "header", "Intro");
            self.ui.updateElement("panel", self.questions.intro);
            self.ui.updateConfig("prev", "display", "none");
            self.ui.updateConfig("next", "display", "none");
            self.playSound(`intro`); 
            questionIndex = 0;
            answerIndex = -1;
        }
        
        function showOption(){
            const options = self.questions.questions[questionIndex].options;
            if (answerIndex<0) answerIndex = 0;
            if (answerIndex>=options.length) answerIndex = options.length - 1;
            let display = (answerIndex>0) ? "block" : "none";
            self.ui.updateConfig("prev", "display", display);
            display = (answerIndex<(options.length-1)) ? "block" : "none";
            self.ui.updateConfig("next", "display", display);
            self.ui.updateElement( "header", "Select a response");
            self.ui.updateElement("panel", options[answerIndex].text);
        }
        
        function showQuestion(){
            const question = self.questions.questions[questionIndex];
            self.ui.updateElement( "header", "Heather");
            self.ui.updateElement("panel", question.text);
            self.ui.updateConfig("prev", "display", "none");
            self.ui.updateConfig("next", "display", "none");
            self.playSound(`option${questionIndex + 1}`);
        }
        
        function onPrev(){
            answerIndex--;
            showOption();
        }
        
        function onNext(){
            answerIndex++;
            showOption();
        }
        
        function onContinue(){
            if (questionIndex<0){
                //Coming from intro
                questionIndex = 0;
                showQuestion()
                answerIndex = -1;
            }else if (answerIndex==-1){
                //Show first option
                answerIndex = 0;
                showOption();
            }else{
                //Option selected
                const question = self.questions.questions[questionIndex];
                questionIndex = question.options[answerIndex].next;
                if (questionIndex==-1){
                    showIntro();
                }else{
                    answerIndex = -1;
                    showQuestion();
                }
            }
        }
        
        const config = {
            renderer: this.renderer,
            panelSize: { width: 0.8, height: 1.3 },
            width: 512,
            height: panelHeight,
            opacity: 0.7,
            body:{
                fontFamily:'Arial', 
                fontSize:30, 
                padding:20, 
                backgroundColor: '#000', 
                fontColor:'#fff', 
                borderRadius: 6,
                border:{ width: 2, color:"#fff", style:"solid" },
                opacity: 0.7
            },
            header:{
                type: "text",
                position:{ x:0, y:0 },
                height: headerHeight
            },
            panel:{
                type: "text",
                position:{ x:0, y:headerHeight },
                height: panelHeight - headerHeight - footerHeight,
                backgroundColor: "#ffa",
                fontColor: "#000",   
                overflow: "scroll", 
                leading: 5
            },
            prev:{
                display: 'none',
                type: "button",
                position: { x:0, y: panelHeight - footerHeight + 5},
                width: footerHeight,
                height: footerHeight,
                fontColor: "#ff4",
                onSelect: onPrev
            },
            next:{
                display: 'none',
                type: "button",
                position: { x:footerHeight, y: panelHeight - footerHeight + 5},
                width: footerHeight,
                height: footerHeight,
                fontColor: "#ff4",
                onSelect: onNext
            },
            continue:{
                type: "button",
                position: { x:212, y: panelHeight - footerHeight },
                textAlign: "right",
                width: 300,
                height: footerHeight,
                hover: "#ff0",
                fontColor: "#ff4",
                onSelect: onContinue
            }
        }
        
        const content = {
            header: "Intro",
            panel: self.questions.intro,
            prev: "<path>m 5 20 l 35 35 l 35 5 z</path>",
            next: "<path>m 35 20 l 5 5 l 5 35 z</path>",
            continue: "Continue"
        }
        
        const ui = new CanvasUI( content, config );
        ui.mesh.position.set(-0.5, 1.0, -2);
        ui.mesh.rotation.x = -0.2;
        ui.mesh.material.opacity = 0.7;
        
        this.dolly.add( ui.mesh );
        
        this.ui = ui;
    }
    
    playSound( sndname ){
        // load a sound and set it as the Audio object's buffer
        const sound = this.speech;
        
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( `audio/${sndname}.mp3`, ( buffer ) => {
            if (sound.isPlaying) sound.stop();
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 1.0 );
            sound.play();
        });
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        function onSessionStart(){
            // create a global audio source
            if (self.speech === undefined){
                const atmos = new THREE.Audio( self.listener );

                // load a sound and set it as the Audio object's buffer
                const audioLoader = new THREE.AudioLoader();
                audioLoader.load( 'audio/atmos.mp3', ( buffer ) => {
                    atmos.setBuffer( buffer );
                    atmos.setLoop( true );
                    atmos.setVolume( 0.5 );
                    atmos.play();
                });
                
                self.atmos = atmos;
                
                self.speech = new THREE.Audio( self.listener );
            }else{
                self.atmos.play();
            }
            self.playSound( 'intro' );
        }
        
        function onSessionEnd(){
            if (self.speech && self.speech.isPlaying) self.speech.stop();
            if (self.atmos && self.atmos.isPlaying) self.atmos.pause();
        }
        
        function onDisconnected( event ){
            const controller = event.target;
            if (controller.children.length>0) controller.remove( controller.children[0] );
            if (controller == self.controller){
                self.controller = null;
                self.controllerGrip = null;
            }else{
                self.controller1 = null;
                self.controllerGrip1 = null;
            }
        }
    
        function onSelect( event ) {

            if ( self.ui!==undefined ) self.ui.select( );

        }

        const button = new VRButton( this.renderer, { onSessionStart, onSessionEnd } );
        
        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        //this.controller.addEventListener( 'disconnected', onDisconnected );
        this.dolly.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.dolly.add( this.controllerGrip );
        
        // controller
        this.controller1 = this.renderer.xr.getController( 1 );
        this.controller1.addEventListener( 'select', onSelect );
        //this.controller.addEventListener( 'disconnected', onDisconnected );
        this.dolly.add( this.controller1 );

        this.controllerGrip1 = this.renderer.xr.getControllerGrip( 1 );
        this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
        this.dolly.add( this.controllerGrip1 );
        
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 0;

        this.controller.add( line.clone() );
        this.controller1.add( line.clone() );
        
        this.selectPressed = false;
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    handleController( controller ){
        this.workingMatrix.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

        const intersects = this.raycaster.intersectObject( this.ui.mesh );

        if (intersects.length>0){
            this.ui.hover( intersects[0].point );
            controller.children[0].scale.z = intersects[0].distance;
        }else{
            this.ui.hover();
            controller.children[0].scale.z = 10;
        }
    }
		
	render( ){
        const dt = this.clock.getDelta();
        if ( this.mixer !== undefined ) this.mixer.update(dt);
        if (this.renderer.xr.isPresenting){
            if (this.ui !== undefined) this.ui.update();
            this.handleController( this.controller );
        }
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
