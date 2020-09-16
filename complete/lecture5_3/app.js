import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { CanvasUI } from '../../libs/CanvasUI.js';
import { BoxLineGeometry } from '../../libs/three/jsm/BoxLineGeometry.js';


class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
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
        
        this.vec3 = new THREE.Vector3();
        
        this.initScene();
        this.setupXR();
        
        this.getInputSources = true;
        
        window.addEventListener('resize', this.resize.bind(this) );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    initScene(){
        this.room = new THREE.LineSegments(
					new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ),
					new THREE.LineBasicMaterial( { color: 0x808080 } )
				);
        
        const geo1 = new THREE.SphereBufferGeometry(0.1, 16, 8);
        const mat1 = new THREE.MeshStandardMaterial( { color: 0x3333ff } );
        const mat2 = new THREE.MeshStandardMaterial( { color: 0x33ff33 } );
        this.materials = [ mat1, mat2 ];
        this.rsphere = new THREE.Mesh( geo1, mat1 );
        this.rsphere.position.set( 0.5, 1.6, -1);
        this.scene.add( this.rsphere );
        this.lsphere = new THREE.Mesh( geo1, mat1 );
        this.lsphere.position.set( -0.5, 1.6, -1);
        this.scene.add( this.lsphere );
        
        this.room.geometry.translate( 0, 3, 0 );
        this.scene.add( this.room );
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        const btn = new VRButton( this.renderer );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( time, frame ) {
        if ( this.renderer.xr.isPresenting ){
            const session = this.renderer.xr.getSession();
            const inputSources = session.inputSources;
            
            if ( this.getInputSources ){    
                const info = [];
                
                inputSources.forEach( inputSource => {
                    const gp = inputSource.gamepad;
                    const axes = gp.axes;
                    const buttons = gp.buttons;
                    const mapping = gp.mapping;
                    this.useStandard = (mapping == 'xr-standard');
                    const gamepad = { axes, buttons, mapping };
                    const handedness = inputSource.handedness;
                    const profiles = inputSource.profiles;
                    this.type = "";
                    profiles.forEach( profile => {
                        if (profile.indexOf('touchpad')!=-1) this.type = 'touchpad';
                        if (profile.indexOf('thumbstick')!=-1) this.type = 'thumbstick';
                    });
                    const targetRayMode = inputSource.targetRayMode;
                    info.push({ gamepad, handedness, profiles, targetRayMode });
                });
                    
                console.log( JSON.stringify(info) );
                
                this.getInputSources = false;
            }else if (this.useStandard && this.type!=""){
                inputSources.forEach( inputSource => {
                    const gp = inputSource.gamepad;
                    const thumbstick = (this.type=='thumbstick');
                    const offset = (thumbstick) ? 2 : 0;
                    const btnIndex = (thumbstick) ? 3 : 2;
                    const btnPressed = gp.buttons[btnIndex].pressed;
                    const material = (btnPressed) ? this.materials[1] : this.materials[0];
                    if ( inputSource.handedness == 'right'){
                        this.rsphere.position.set( 0.5, 1.6, -1 ).add( this.vec3.set( gp.axes[offset], -gp.axes[offset + 1], 0 ));
                        this.rsphere.material = material;
                    }else if ( inputSource.handedness == 'left'){
                        this.lsphere.position.set( -0.5, 1.6, -1 ).add( this.vec3.set( gp.axes[offset], -gp.axes[offset + 1], 0 ));
                        this.lsphere.material = material;
                    }
                })
            }
        }
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };