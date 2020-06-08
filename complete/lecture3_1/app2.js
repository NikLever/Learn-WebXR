import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/three/jsm/VRButton.js';
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
        
        this.initScene();
        this.setupVR();
        
        window.addEventListener('resize', this.resize.bind(this) );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    initScene(){
        this.normal = new THREE.Vector3();
        this.count = 0;
        this.radius = 0.08;
        this.relativeVelocity = new THREE.Vector3();
        
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

            object.userData.velocity = new THREE.Vector3();
            object.userData.velocity.x = this.random( -0.005, 0.005 );
            object.userData.velocity.y = this.random( -0.005, 0.005 );
            object.userData.velocity.z = this.random( -0.005, 0.005 );

            this.room.add( object );

        }
    }
    
    setupVR(){
        this.renderer.xr.enabled = true;
        
        document.body.appendChild( VRButton.createButton( this.renderer ) );
        
        function onSelectStart() {

            this.userData.isSelecting = true;

        }

        function onSelectEnd() {

            this.userData.isSelecting = false;

        }
        
        const self = this;
        
        this.controller1 = this.renderer.xr.getController( 0 );
        this.controller1.addEventListener( 'selectstart', onSelectStart );
        this.controller1.addEventListener( 'selectend', onSelectEnd );
        this.controller1.addEventListener( 'connected', function ( event ) {

            const mesh = self.buildController.call(self, event.data );
            this.add( mesh );

        } );
        this.controller1.addEventListener( 'disconnected', function () {

            this.remove( this.children[ 0 ] );

        } );
        this.scene.add( this.controller1 );

        this.controller2 = this.renderer.xr.getController( 1 );
        this.controller2.addEventListener( 'selectstart', onSelectStart );
        this.controller2.addEventListener( 'selectend', onSelectEnd );
        this.controller2.addEventListener( 'connected', function ( event ) {

            const mesh = self.buildController.call(self, event.data );
            this.add( mesh );

        } );
        this.controller2.addEventListener( 'disconnected', function () {

            this.remove( this.children[ 0 ] );

        } );
        this.scene.add( this.controller2 );

        // The XRControllerModelFactory will automatically fetch controller models
        // that match what the user is holding as closely as possible. The models
        // should be attached to the object returned from getControllerGrip in
        // order to match the orientation of the held device.

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip1 = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip1.add( controllerModelFactory.createControllerModel( this.controllerGrip1 ) );
        this.scene.add( this.controllerGrip1 );

        this.controllerGrip2 = this.renderer.xr.getControllerGrip( 1 );
        this.controllerGrip2.add( controllerModelFactory.createControllerModel( this.controllerGrip2 ) );
        this.scene.add( this.controllerGrip2 );
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
    
    handleController( controller ) {

        if ( controller.userData.isSelecting ) {

            var object = this.room.children[ this.count ++ ];

            object.position.copy( controller.position );
            object.userData.velocity.x = this.random( -1.5, 1.5 );
            object.userData.velocity.y = this.random( -1.5, 1.5 );
            object.userData.velocity.z = this.random( -8, 1 );
            object.userData.velocity.applyQuaternion( controller.quaternion );

            if ( this.count === this.room.children.length ) this.count = 0;

        }

    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        
        this.handleController( this.controller1 );
        this.handleController( this.controller2 );

        const delta = this.clock.getDelta() * 0.8; // slow down simulation

        const range = 3 - this.radius;

        for ( let i = 0; i < this.room.children.length; i ++ ) {

            const object = this.room.children[ i ];

            object.position.x += object.userData.velocity.x * delta;
            object.position.y += object.userData.velocity.y * delta;
            object.position.z += object.userData.velocity.z * delta;

            // keep objects inside room

            if ( object.position.x < - range || object.position.x > range ) {

                object.position.x = THREE.MathUtils.clamp( object.position.x, - range, range );
                object.userData.velocity.x = - object.userData.velocity.x;

            }

            if ( object.position.y < this.radius || object.position.y > 6 ) {

                object.position.y = Math.max( object.position.y, this.radius );

                object.userData.velocity.x *= 0.98;
                object.userData.velocity.y = - object.userData.velocity.y * 0.8;
                object.userData.velocity.z *= 0.98;

            }

            if ( object.position.z < - range || object.position.z > range ) {

                object.position.z = THREE.MathUtils.clamp( object.position.z, - range, range );
                object.userData.velocity.z = - object.userData.velocity.z;

            }

            for ( let j = i + 1; j < this.room.children.length; j ++ ) {

                const object2 = this.room.children[ j ];

                this.normal.copy( object.position ).sub( object2.position );

                const distance = this.normal.length();

                if ( distance < 2 * this.radius ) {

                    this.normal.multiplyScalar( 0.5 * distance - this.radius );

                    object.position.sub( this.normal );
                    object2.position.add( this.normal );

                    this.normal.normalize();

                    this.relativeVelocity.copy( object.userData.velocity ).sub( object2.userData.velocity );

                    this.normal = this.normal.multiplyScalar( this.relativeVelocity.dot( this.normal ) );

                    object.userData.velocity.sub( this.normal );
                    object2.userData.velocity.add( this.normal );

                }

            }

            object.userData.velocity.y -= 9.8 * delta;

        }
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };