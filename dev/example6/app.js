import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { VRButton } from '../../libs/three/jsm/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Player } from '../../libs/Player.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Pathfinding } from '../../libs/three/jsm/three-pathfinding.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 3000 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0x555555, 0x999999);
		this.scene.add(ambient);
		
		this.sun = new THREE.DirectionalLight( 0xAAAAFF, 2.5 );
		this.sun.castShadow = true;

		const lightSize = 5;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 17;
		this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -lightSize;
		this.sun.shadow.camera.right = this.sun.shadow.camera.top = lightSize;

        //this.sun.shadow.bias = 0.0039;
        this.sun.shadow.mapSize.width = 1024;
        this.sun.shadow.mapSize.height = 1024;
        
		this.sun.position.set( 0, 10, 10 );
		this.scene.add( this.sun );
		
		this.debug = { showShadowHelper:false, showPath:true, offset: 0.2 };
		//Create a helper for the shadow camera
		this.helper = new THREE.CameraHelper( this.sun.shadow.camera );
		this.helper.visible = this.debug.showShadowHelper;
		this.scene.add( this.helper );
			
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		container.appendChild( this.renderer.domElement );
		
		this.waypoints = [ 
			new THREE.Vector3(-15.5, 5.26, 15.68),
			new THREE.Vector3(13.4, 5.51, 15.74),
			new THREE.Vector3(13.6, 5.48, -7.96),
			new THREE.Vector3(-15.4, 5.17, -9.03),
			new THREE.Vector3(-8.2, 0.25, 8.55),
			new THREE.Vector3(7.5, 0.18, 8.50),
			new THREE.Vector3(-22.2, 5.37, -0.15)
		];

        this.tempMatrix = new THREE.Matrix4();
        this.movePosition = new THREE.Vector3();
        this.moveSelected = false;
        
		//this.controls = new OrbitControls( this.camera, this.renderer.domElement );

		this.clock = new THREE.Clock();
		
		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
		this.loadingBar = new LoadingBar();
        
		this.loadEnvironment();
        
		this.raycaster = new THREE.Raycaster();
    	this.renderer.domElement.addEventListener( 'click', raycast, false );
			
    	this.loading = true;
    	
    	const self = this;
    	const mouse = { x:0, y:0 };
    	
    	function raycast(e){
            //None VR movement
    		if ( self.loading || self.renderer.xr.isPresenting ) return;
    		
			mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

			//2. set the picking ray from the camera position and mouse coordinates
			self.raycaster.setFromCamera( mouse, self.camera );    

			//3. compute intersections
			const intersects = self.raycaster.intersectObject( self.navmesh );
			
			if (intersects.length>0){
				const pt = intersects[0].point;
				
				// Teleport on ctrl/cmd click or RMB.
				if (e.metaKey || e.ctrlKey || e.button === 2) {
					const player = self.fred.object;
					player.position.copy(pt);
					self.fred.navMeshGroup = self.pathfinder.getGroup(self.ZONE, player.position);
					const closestNode = self.pathfinder.getClosestNode(player.position, self.ZONE, self.fred.navMeshGroup);
					if (self.pathLines) self.scene.remove(self.pathLines);
					if (self.calculatedPath) self.calculatedPath.length = 0;
					self.fred.action = 'idle';
					return;
				}
				
				self.fred.newPath(pt, true);
			}	
		}
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();

    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
	}
	
    setupVR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        document.body.appendChild( VRButton.createButton( this.renderer ) );
        
        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', (event) => { self.onSelectStart(event); } );
        this.controller.addEventListener( 'selectend', (event) => { self.onSelectEnd(event); } );
        this.dummyCam.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.dummyCam.add( this.controllerGrip );
        
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 10;

        this.controller.add( line.clone() );
    }
    
    onSelectStart( event ) {
        const controller = event.target;
        
        this.intersectObjects( controller );
        
    }

    onSelectEnd( event ) {
        const controller = event.target;
        
        this.intersectObjects( controller );
        
        if (this.moveSelected){
            this.fred.newPath(this.movePosition, true);
            this.moveSelected = false;
        }
    }

    getIntersections( controller ) {

        this.tempMatrix.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

        return this.raycaster.intersectObject( this.navmesh );

    }

    intersectObjects( controller ) {

        const line = controller.getObjectByName( 'line' );
        const intersections = this.getIntersections( controller );

        if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];
            line.scale.z = intersection.distance;
            this.movePosition.copy( intersection.point );
            this.moveSelected = true;

        } else {

            line.scale.z = 10;
            this.moveSelected = false;
            
        }

    }

    createTarget(object){
        const target = new THREE.Object3D();
        target.position.set(-6, 0, 0); 
        
        const options = {
					object: target,
					speed: 5,
					app: this,
					name: 'fred',
					npc: false
				};
				
		const player = new Player(options);
           
        this.dummyCam = new THREE.Object3D();
        this.dummyCam.position.set(0,0.5,1);
        this.dummyCam.add(this.camera);
        
        target.add(this.dummyCam);
        
        this.dummyCam.rotation.y = Math.PI;
        
        return player;
    }
    
	loadEnvironment(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'dungeon.glb',
			// called when the resource is loaded
			function ( gltf ) {

				self.scene.add( gltf.scene );
				
				gltf.scene.traverse(function (child) {
    				if (child.isMesh){
						if (child.name=="Navmesh"){
							child.material.visible = false;
							self.navmesh = child;
						}else{
							child.castShadow = false;
							child.receiveShadow = true;
						}
					}
				});
			
				self.pathfinder = new Pathfinding();
				self.ZONE = 'dungeon';
				self.pathfinder.setZoneData(self.ZONE, Pathfinding.createZone(self.navmesh.geometry));

                self.fred = self.createTarget();
                
                self.setupVR();
                
                self.loading = false;
                
				self.renderer.setAnimationLoop( () => { self.render(); } );
				
				self.loadingBar.visible = false;
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

	render(){
		const dt = this.clock.getDelta();
		const self = this;
		
		this.sun.position.copy(this.camera.position);
		this.sun.position.y += 10;
		this.sun.position.z += 10;
		
		this.stats.update();
        
        this.fred.update(dt);
		
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
