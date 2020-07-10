import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { CannonHelper } from '../../libs/CannonHelper.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        this.camera.lookAt( 0, 0, -2 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		this.scene.add( new THREE.HemisphereLight( 0x555555, 0xFFFFFF ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1.25, 1.25 ).normalize();
        light.castShadow = true;
        const size = 15;
        light.shadow.left = -size;
        light.shadow.bottom = -size;
        light.shadow.right = size;
        light.shadow.top = size;
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 0, -3);
        this.controls.update();
        
        this.stats = new Stats();
        document.body.appendChild( this.stats.dom );
        
        this.initScene();
        this.setupVR();
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.origin = new THREE.Vector3();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        
        //Create a marker to indicate where the joint is
        const geometry = new THREE.SphereBufferGeometry( 0.1, 8, 8 );
        const material = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
        this.marker = new THREE.Mesh( geometry, material );
        this.marker.visible = false;
        this.scene.add(this.marker);

        this.initPhysics();
    }
    
    initPhysics(){
        this.world = new CANNON.World();
		
        this.dt = 1.0/60.0;
	    this.damping = 0.01;
		
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.gravity.set(0, -10, 0);
  
        this.helper = new CannonHelper( this.scene, this.world );
		
        const groundShape = new CANNON.Plane();
        //const groundMaterial = new CANNON.Material();
        const groundBody = new CANNON.Body({ mass: 0 });//, material: groundMaterial });
        groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
        groundBody.addShape(groundShape);
        this.world.add(groundBody);
        this.helper.addVisual(groundBody, 0xffaa00);

        // Joint body
        const shape = new CANNON.Sphere(0.1);
        this.jointBody = new CANNON.Body({ mass: 0 });
        this.jointBody.addShape(shape);
        this.jointBody.collisionFilterGroup = 0;
        this.jointBody.collisionFilterMask = 0;
        this.world.add(this.jointBody);

        this.box = this.addBody();
    }  
    
    addBody(box=true){
        let shape;
        if (!box){
            shape = new CANNON.Sphere(0.5);
        }else{
            shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
        }
        const material = new CANNON.Material();
        const body = new CANNON.Body({ mass: 5, material: material });
        body.addShape(shape);

        body.position.set(0, 1, -3);
        body.linearDamping = this.damping;
        this.world.add(body);

        this.helper.addVisual(body);

        return body;
    }
    
    addConstraint(pos, body){
        const pivot = pos.clone();
        body.threemesh.worldToLocal(pivot);
        
        this.jointBody.position.copy(pos);
 
        const constraint = new CANNON.PointToPointConstraint(body, pivot, this.jointBody, new CANNON.Vec3(0,0,0));

        this.world.addConstraint(constraint);
        
        this.controller.userData.constraint = constraint;
    }
    
    setupVR(){
        this.renderer.xr.enabled = true;
        
        const button = new VRButton( this.renderer );
        
        const self = this;
        
        function onSelectStart() {
            
            this.userData.selectPressed = true;
            if (this.userData.selected){
                self.addConstraint( self.marker.getWorldPosition( self.origin ), self.box );
                self.controller.attach( self.marker );
            }
        }

        function onSelectEnd() {

            this.userData.selectPressed = false;
            const constraint = self.controller.userData.constraint;
            if (constraint){
                self.world.removeConstraint(constraint);
                self.controller.userData.constraint = undefined;
                self.scene.add( self.marker );
                self.marker.visible = false;
            }
            
        }
        
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', onSelectStart );
        this.controller.addEventListener( 'selectend', onSelectEnd );
        this.controller.addEventListener( 'connected', function ( event ) {

            const mesh = self.buildController.call(self, event.data );
            mesh.scale.z = 0;
            this.add( mesh );

        } );
        this.controller.addEventListener( 'disconnected', function () {

            this.remove( this.children[ 0 ] );
            self.controller = null;
            self.controllerGrip = null;

        } );
        this.scene.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.scene.add( this.controllerGrip );
    }
    
    buildController( data ) {
        let geometry, material;
        
        switch ( data.targetRayMode ) {
            
            case 'tracked-pointer':

                geometry = new THREE.BufferGeometry();
                geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
                geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

                material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

                return new THREE.Line( geometry, material );

            case 'gaze':

                geometry = new THREE.RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
                material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
                return new THREE.Mesh( geometry, material );

        }

    }
    
    handleController( controller ){
        if (!controller.userData.selectPressed){
            controller.children[0].scale.z = 10;

            this.workingMatrix.identity().extractRotation( controller.matrixWorld );

            this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
            this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

            const intersects = this.raycaster.intersectObject( this.box.threemesh.children[0] );

            if (intersects.length>0){
                this.marker.position.copy(intersects[0].point);
                this.marker.visible = true;
                controller.children[0].scale.z = intersects[0].distance;
                controller.userData.selected = true;
            }else{
                this.marker.visible = false;
                controller.userData.selected = false;
            }
        }else{
            const constraint = controller.userData.constraint;
            if (constraint){
                this.jointBody.position.copy( this.marker.getWorldPosition( this.origin ) );
                constraint.update(); 
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
        if (this.renderer.xr.isPresenting) this.handleController( this.controller );
        this.world.step(this.dt);
        this.helper.update( );
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };