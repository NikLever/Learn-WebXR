import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { DRACOLoader } from '../../libs/three/jsm/DRACOLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { CannonHelper } from '../../libs/CannonHelper.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 3000 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xaaaaaa );
        
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
		
		this.debug = { showPath:false, teleport: true };
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();

        this.workingMat4 = new THREE.Matrix4();
        this.workingVec3 = new THREE.Vector3();

		this.clock = new THREE.Clock();
		
		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set( 0, 1, -4);
        this.controls.update();
        
		this.loadingBar = new LoadingBar();
        
		this.loadChest();
        
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
			const intersects = self.raycaster.intersectObject( self.objects.lid );
			
			if (intersects.length>0){
				const pt = intersects[0].point;
			}	
		}
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();

    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
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
    
    loadChest(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../libs/three/js/draco/' );
        loader.setDRACOLoader( dracoLoader );
		
        const self = this;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'chest.glb',
			// called when the resource is loaded
			function ( gltf ) {
				let chest, lid;
                
				gltf.scene.traverse(function (child) {
    				if (child.isMesh){
                        if ( child.name == "SD_Prop_Chest_Skull_01"){
                            chest = child;
                        }else if ( child.name == "SD_Prop_Chest_Skull_Lid_01"){
                            lid = child;
						}
                        
				        child.castShadow = true;
				        child.receiveShadow = true;
					}
				});
                
                chest.position.z = -4;
                lid.position.z = -4;
                
                self.scene.add( chest );
                self.scene.add( lid );
                
                self.objects = { chest, lid };
                
                self.initGame();
    
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.error( error.message );

			}
		);
	}	
    
    initPhysics( ){
        const objects = this.objects;
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        
        this.world = new CANNON.World();
		
        this.timestep = 1.0/60.0;
	    this.damping = 0.01;
		
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.gravity.set(0, -10, 0);
  
        this.helper = new CannonHelper( this.scene, this.world );
        
        const chest = new CANNON.Body({mass: 0});
        const shape1 = new CANNON.Box( new CANNON.Vec3(0.7, 0.328, 0.404) );
        chest.addShape(shape1, new CANNON.Vec3(0, 0.328, 0));
        objects.chest.getWorldPosition( pos );
        chest.position.set(pos.x, pos.y, pos.z);
        objects.chest.getWorldQuaternion( quat );
        chest.quaternion.set( quat.x, quat.y, quat.z, quat.w );
        const shape2 = new CANNON.Box( new CANNON.Vec3( 0.7, 0.1, 0.2) );
        chest.addShape( shape2, new CANNON.Vec3(0, 0.5, -0.5) );
        objects.chest.userData.body = chest;
        this.world.add(chest);
        this.helper.addVisual(chest, 0xffaa00);
        
        const lid = new CANNON.Body({mass: 5});
        const shape3 = new CANNON.Box( new CANNON.Vec3(0.62, 0.157, 0.328) );
        lid.addShape(shape3, new CANNON.Vec3(0, 0.157, 0));
        objects.lid.getWorldPosition( pos );
        lid.position.set(pos.x, pos.y, pos.z);
        objects.lid.getWorldQuaternion( quat );
        lid.quaternion.set( quat.x, quat.y, quat.z, quat.w );
        objects.lid.userData.body = lid;
        this.world.add(lid);
        this.helper.addVisual(lid, 0xaaff00);
        
        const axis = new CANNON.Vec3( 1, 0, 0 );
        const hinge = new CANNON.HingeConstraint( chest, lid, {
            pivotA: new CANNON.Vec3(0, 0.656, -0.31 ),
            axisA: axis,
            pivotB: new CANNON.Vec3(0, 0, -0.31),
            axisB: axis
        });
        
        hinge.update();
        this.world.addConstraint( hinge );

        // Joint body
        const shape4 = new CANNON.Sphere(0.1);
        this.jointBody = new CANNON.Body({ mass: 0 });
        this.jointBody.addShape(shape4);
        this.jointBody.collisionFilterGroup = 0;
        this.jointBody.collisionFilterMask = 0;
        this.world.add(this.jointBody);
    }
	
	initGame(){        
        this.marker = this.createLocationMarker();
        
		this.setupXR();

		this.loading = false;
        
		this.renderer.setAnimationLoop( this.render.bind(this) );

		this.loadingBar.visible = false;
	}
	
    createLocationMarker(){
        const geometry = new THREE.SphereGeometry(0.05, 8, 6);
        const material = new THREE.MeshBasicMaterial( { color: 0xFF0000 });
        const mesh = new THREE.Mesh( geometry, material );
        mesh.visible = false;
        this.scene.add( mesh );
        return mesh;
    }
	
    buildControllers(){
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'ray';
		line.scale.z = 10;
        
        const controllers = [];
        
        for( let i=0; i<=1; i++){
            const controller = this.renderer.xr.getController( i );
            controller.userData.index = i;
            controller.userData.selectPressed = false;
            controller.add( line.clone() );
            controllers.push( controller );
            this.scene.add( controller );
            
            const grip = this.renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ) );
            this.scene.add( grip );
        }  
        
        return controllers;
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        function onSelectStart( ){
            this.userData.selectPressed = true;
            if (this.userData.selected){
                self.addConstraint( self.marker.getWorldPosition( self.workingVec3 ), self.objects.lid, this );
            }
        }
        
        function onSelectEnd( ){
            this.userData.selectPressed = false;
            const constraint = this.userData.constraint;
            if (constraint){
                self.world.removeConstraint(constraint);
                this.userData.constraint = undefined;
                self.marker.visible = false;
            }
        }
        
        const btn = new VRButton( this.renderer );
        
        this.controllers = this.buildControllers();
        
        this.controllers.forEach( controller => {
            controller.addEventListener( 'selectstart', onSelectStart );
            controller.addEventListener( 'selectend', onSelectEnd);
        })
        
        this.dummyCam = new THREE.Object3D();
        this.camera.add( this.dummyCam );
        this.scene.add( this.camera );
        
        this.collisionObjects = [];
                    
    }
    
    addConstraint(pos, obj, controller){
        const pivot = pos.clone();
        obj.worldToLocal(pivot);
        
        this.jointBody.position.copy(pos);
 
        const constraint = new CANNON.PointToPointConstraint(obj.userData.body, pivot, this.jointBody, new CANNON.Vec3(0,0,0));

        this.world.addConstraint(constraint);
        
        controller.userData.constraint = constraint;
    }

     handleController( controller ){
         
        controller.children[0].scale.z = 10;

        this.workingMat4.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMat4 );

        const intersects = this.raycaster.intersectObject( this.objects.lid );

        if (intersects.length>0){
            this.marker.position.copy(intersects[0].point);
            this.marker.visible = true;
            controller.children[0].scale.z = intersects[0].distance;
            controller.userData.selected = true;
        }else if ( controller.userData.selected ){
            this.marker.visible = false;
            controller.userData.selected = false;
        }
         
        if ( controller.userData.selectPressed ){
            const constraint = controller.userData.constraint;
            if (constraint){
                this.jointBody.position.copy( this.marker.getWorldPosition( this.origin ) );
                constraint.update(); 
            }
        }
    }
    
	render(){
		const dt = this.clock.getDelta();
		const self = this;
		
		this.sun.position.copy(this.dummyCam.position);
		this.sun.position.y += 10;
		this.sun.position.z += 10;
		
		this.stats.update();
        
        if (this.renderer.xr.isPresenting){
           
            this.controllers.forEach( controller => {
                self.handleController( controller );
            })
        }
		
        this.renderer.render(this.scene, this.camera);
        
        if (this.world){
            this.world.step(this.timestep);
            const lid = this.objects.lid;
            const q = lid.userData.body.quaternion;
            const p = lid.userData.body.position;
            lid.position.set( p.x, p.y, p.z )
            lid.quaternion.set( q.x, q.y, q.z, q.w );
            this.helper.update( );
        }else{
            this.initPhysics();
        }
		
	}
}

export { App };
