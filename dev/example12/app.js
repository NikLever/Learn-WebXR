import * as THREE from '../../libs/three/three.module.js';
import { ARButton } from '../../libs/three/jsm/ARButton.js';
import { XRWorldMeshes } from '../../libs/XRWorldMeshes.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();

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
		this.renderer.xr.enabled = true;
		container.appendChild( this.renderer.domElement );
		
		document.body.appendChild( ARButton.createButton( this.renderer, { requiredFeatures: [ 'hit-test', 'worldSensing' ] } ) );
        
        this.initScene();
        
        this.sessionNeedsInitialising = true;
        this.hitTestSource = null;
        
        const self = this;

        function onSelect() {
            
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        this.scene.add( this.controller );
        
        this.renderer.setAnimationLoop((timestamp, frame)=>{ self.render(timestamp, frame)});
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();
    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
	}	
    
    initScene(){
        
        this.workingMatrix = new THREE.Matrix4();
        this.workingVec3 = new THREE.Vector3();

        this.savedOrigin = new THREE.Vector3(0,0,0);
        this.savedDirection = new THREE.Vector3(0,0,-1);
        
        this.reticle = new THREE.Object3D()
            
        this.reticle.userData.trackedColor = new THREE.Color( 0xDDFFDD );
        this.reticle.userData.notTrackedColor = new THREE.Color( 0xFF6666 );
            
        const reticleMaterial = new THREE.MeshStandardMaterial({ color: this.reticle.userData.trackedColor })
        this.requestNextHit = true

        const mesh = new THREE.Mesh(
            new THREE.RingGeometry(0.04, 0.05, 36, 64),
            reticleMaterial
        );

        mesh.geometry.rotateX( -Math.PI/2 );
        this.reticle.add(mesh);

        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        
        this.scene.add(this.reticle);
    }
    
    updateScene(frame){
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const session = this.renderer.xr.getSession();
        
        const self = this;

        if ( this.sessionNeedsInitialising ) {

            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                    self.hitTestSource = source;

                } );

            } ); 
            
            // initialize world sensing
            session.updateWorldSensingState({
                illuminationDetectionState : {
                    enabled : true
                },
                meshDetectionState : {
                    enabled : true,
                    normals: true
                }
            });

            session.addEventListener( 'end', function () {

                self.sessionNeedsInitialising = true;
                self.hitTestSource = null;
                self.xrWorldMeshes.clearAll();

            } );

            session.requestReferenceSpace('local').then( (refSpace) => {
                self.localReferenceSpace = refSpace;
            });
            
            this.sessionNeedsInitialising = false;
            
            this.xrWorldMeshes = new XRWorldMeshes();

        }

        if ( this.hitTestSource ) {

            const hitTestResults = frame.getHitTestResults( this.hitTestSource );

            if ( hitTestResults.length ) {

                const hit = hitTestResults[ 0 ];

                this.reticle.visible = true;
                this.reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

            } else {

                this.reticle.visible = false;

            }

        }
        
        const worldInfo = frame.worldInformation;
        
        if (worldInfo){
            if(worldInfo.estimatedLight){
                let ambientIntensity = worldInfo.estimatedLight.ambientIntensity
                this.lights.ambient.intensity = ambientIntensity;
                this.lights.light.intensity = ambientIntensity * 0.5;
            }

            if(worldInfo.meshes){
                this.xrWorldMeshes.update( worldInfo.meshes ); 
            }
        }
    }
    
	render( timestamp, frame ) {
        if (frame) this.updateScene(frame);         
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };