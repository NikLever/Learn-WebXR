import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { DRACOLoader } from '../../libs/three/jsm/DRACOLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Pathfinding } from '../../libs/pathfinding/Pathfinding.js';
import { Stats } from '../../libs/stats.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { TeleportMesh } from '../../libs/TeleportMesh.js';
import { Interactable } from '../../libs/Interactable.js';
import { Player } from '../../libs/Player.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Bullet } from './Bullet.js';

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
		
		this.debug = { showPath:false, teleport: true };
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();

        this.workingMatrix = new THREE.Matrix4();

		this.clock = new THREE.Clock();
		
		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
		this.loadingBar = new LoadingBar();
        
		this.loadEnvironment();
        
		this.raycaster = new THREE.Raycaster();
			
    	this.loading = true;
		
		window.addEventListener('resize', this.render.bind(this));
	}
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight ); 
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
    
	loadEnvironment(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
        
        this.interactables = [];
        this.markables = [];
		
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
                            child.geometry.scale(0.5, 0.5, 0.5);
                            self.navmesh.scale.set(2,2,2);
                        }else if (child.name == "SD_Prop_Chest_Skull_01"){
                            self.markables.push( child );
						}else{
                            if ( child.name == "SD_Prop_Chest_Skull_Lid_01"){
                                self.interactables.push( new Interactable( child, {
                                    mode: 'tweens',
                                    tweens:[{
                                        target: child.quaternion,
                                        channel: 'x',
                                        start: 0,
                                        end: -0.7,
                                        duration: 1}
                                    ]
                                }));                       
                            }else if ( child.name == "Door_1"){
                                self.interactables.push( new Interactable( child, {
                                    mode: 'tweens',
                                    tweens:[{
                                        target: child.quaternion,
                                        channel: 'z',
                                        start: 0,
                                        end: 0.6,
                                        duration: 1}
                                    ]
                                })); 
                            }
							child.castShadow = false;
							child.receiveShadow = true;
						}
					}
				});
                
                const scale = 0.5;
                gltf.scene.scale.set( scale, scale, scale );
                
                self.initPathfinding();
                self.loadGhoul();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.33;
				
			},
			// called when loading has errors
			function ( error ) {

				console.error( error.message );

			}
		);
	}	
    
    loadGhoul(){
        
		const loader = new GLTFLoader().setPath(this.assetsPath);
		const self = this;

		const anims = [
					{start:81, end:161, name:"idle", loop:true},
					{start:250, end:290, name:"block", loop:false},
					{start:300, end:320, name:"gethit", loop:false},
					{start:340, end:375, name:"die", loop:false},
					{start:380, end:430, name:"attack", loop:false},
					{start:470, end:500, name:"walk", loop:true},
					{start:540, end:560, name:"run", loop:true}
				];
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`ghoul.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				const gltfs = [gltf];
				for(let i=0; i<3; i++) gltfs.push(self.cloneGLTF(gltf));
				
				self.ghouls = [];
				
				gltfs.forEach(function(gltf){
					const object = gltf.scene.children[0];

					object.traverse(function(child){
						if (child.isMesh){
							child.castShadow = true;
						}
					});

					const options = {
						object: object,
						speed: 0.8,
						assetsPath: self.assetsPath,
						loader: loader,
						anims: anims,
						clip: gltf.animations[0],
						app: self,
						name: 'ghoul',
						npc: true
					};

					const ghoul = new Player(options);

					const scale = 0.01;
					ghoul.object.scale.set(scale, scale, scale);

					ghoul.object.position.copy(self.randomWaypoint);
					ghoul.newPath(self.randomWaypoint);
					
					self.ghouls.push(ghoul);
					
				});
					
                self.loadGun();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.33 + 0.33;

			},
			// called when loading has errors
			function ( error ) {

				console.error( error.message );

			}
		);
	}
    
    cloneGLTF(gltf){
	
		const clone = {
			animations: gltf.animations,
			scene: gltf.scene.clone(true)
		  };
		
		const skinnedMeshes = {};
		
		gltf.scene.traverse(node => {
			if (node.isSkinnedMesh) {
			  skinnedMeshes[node.name] = node;
			}
		});
		
		const cloneBones = {};
		const cloneSkinnedMeshes = {};
		
		clone.scene.traverse(node => {
			if (node.isBone) {
			  cloneBones[node.name] = node;
			}
			if (node.isSkinnedMesh) {
			  cloneSkinnedMeshes[node.name] = node;
			}
		});
		
		for (let name in skinnedMeshes) {
			const skinnedMesh = skinnedMeshes[name];
			const skeleton = skinnedMesh.skeleton;
			const cloneSkinnedMesh = cloneSkinnedMeshes[name];
			const orderedCloneBones = [];
			for (let i = 0; i < skeleton.bones.length; ++i) {
				const cloneBone = cloneBones[skeleton.bones[i].name];
				orderedCloneBones.push(cloneBone);
			}
			cloneSkinnedMesh.bind(
				new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
				cloneSkinnedMesh.matrixWorld);
		}
		
		return clone;

	}
    
    loadGun(){
        
		const loader = new GLTFLoader().setPath(this.assetsPath);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../libs/three/js/draco/' );
        loader.setDRACOLoader( dracoLoader );
        
		const self = this;

		// Load a GLTF resource
		loader.load(
			// resource URL
			`flare-gun.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				self.gun = gltf.scene;
                self.gun.position.set(-0.430, 0.877, 3.013);
                self.gun.rotateX(Math.PI/2);
                self.scene.add( self.gun );
                
                const bullet = gltf.scene.getObjectByName("Bullet");
				self.scene.add( bullet );
                
                const targets = [];
                self.ghouls.forEach( ghoul => targets.push( ghoul.object.children[1] ) );
                
                self.bullet = new Bullet( bullet, {
                    gun: self.gun,
                    targets
                });
                
                self.bullet.addEventListener( 'hit', ev => {
                    const tmp = self.ghouls.filter( ghoul => ev.hitObject == ghoul.object.children[1] );
                    if (tmp.length>0){
                        self.sounds.snarl.play();
                        const ghoul = tmp[0];
                        ghoul.action = 'die';
                        ghoul.dead = true;
                        ghoul.calculatedPath = null;
                        ghoul.curAction.loop = THREE.LoopOnce;
                        ghoul.curAction.clampWhenFinished = true;
                        ghoul.mixer.addEventListener( 'finished', (e) => { 
                            self.scene.remove(ghoul.object); 
                            self.ghouls.splice( self.ghouls.indexOf(ghoul), 1);
                        } );
                    }
                });
                
                self.initGame();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.33 + 0.66;

			},
			// called when loading has errors
			function ( error ) {

				console.error( error.message );

			}
		);
	}
    
    loadAudio(){
        
        if (this.audioListener===undefined){
            this.audioListener = new THREE.AudioListener();
            // add the listener to the camera
            this.camera.add( this.audioListener );
            this.sounds = {};

            this.audio = {
                index: 0,
                names:["ambient", "shot", "snarl", "swish"]
            }
        }
        
        const name = this.audio.names[this.audio.index];
        
        const loader = new THREE.AudioLoader();
        const self = this;
        
        // load a resource
        loader.load(
            // resource URL
            `sfx/${name}.mp3`,

            // onLoad callback
            function ( audioBuffer ) {
                // set the audio object buffer to the loaded object
                let snd;
                if ( name==='snarl'){
                    snd = new THREE.PositionalAudio(self.audioListener);
                }else{
                    snd = new THREE.Audio( self.audioListener );
                    self.scene.add(snd);
                    if (name==='ambient'){
                        snd.setLoop( true );
	                    snd.setVolume( 0.5 );
                    }
                }
                snd.setBuffer( audioBuffer );

                // play the audio
                if (name==='ambient') snd.play();
                
                self.sounds[name] = snd;
                
                self.audio.index++;
                
                if (self.audio.index < self.audio.names.length ){
                    self.loadAudio();
                }
            },

            // onProgress callback
            function ( xhr ) {
                const peraudio = 0.25/self.audio.length;
                self.loadingBar.progress = ((xhr.loaded / xhr.total) + self.audio.index) * peraudio + 0.75;
            },

            // onError callback
            function ( err ) {
                console.log( 'An error happened' );
            }
        );    
    }
    
    get randomWaypoint(){
		const index = Math.floor(Math.random()*this.waypoints.length);
		return this.waypoints[index];
	}
    
    initPathfinding(){
        this.waypoints = [
            new THREE.Vector3( 8.689, 2.687, 0.349),
            new THREE.Vector3( 0.552, 2.589,-2.122),
            new THREE.Vector3(-7.722, 2.630, 0.298),
            new THREE.Vector3( 2.238, 2.728, 7.050),
            new THREE.Vector3( 2.318, 2.699, 6.957),
            new THREE.Vector3(-1.837, 0.111, 1.782)
        ];
        this.pathfinder = new Pathfinding();
        this.ZONE = 'dungeon';
        this.pathfinder.setZoneData(this.ZONE, Pathfinding.createZone(this.navmesh.geometry));
    }
	
	initGame(){
		this.player = this.createPlayer();
                
        const locations = [
            new THREE.Vector3(-0.409, 0.086, 4.038),
            new THREE.Vector3(-0.846, 0.112, 5.777),
            new THREE.Vector3( 5.220, 0.176, 2.677),
            new THREE.Vector3( 1.490, 2.305, -1.599),
            new THREE.Vector3( 7.565, 2.694, 0.008),
            new THREE.Vector3(-8.417, 2.676, 0.192),
            new THREE.Vector3(-6.644, 2.600, -4.114)
        ]
        
        const self = this;
        
        this.teleports = [];
        locations.forEach( location => {
            const teleport = new TeleportMesh();
            teleport.position.copy( location );
            self.scene.add( teleport );
            self.teleports.push(teleport);
        })
        
		this.setupXR();

		this.loading = false;

		this.renderer.setAnimationLoop( this.render.bind(this) );

		this.loadingBar.visible = false;
	}
	
    createMarker(geometry, material){
        const mesh = new THREE.Mesh( geometry, material );
        mesh.visible = false;
        this.scene.add( mesh );
        return mesh;
    }
	
    buildControllers(){
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'ray';
		line.scale.z = 10;
        
        const geometry2 = new THREE.SphereGeometry(0.03, 8, 6);
        const material = new THREE.MeshBasicMaterial( { color: 0xFF0000 });
        
        const controllers = [];
        
        for( let i=0; i<=1; i++){
            const controller = this.renderer.xr.getController( i );
            controller.userData.index = i;
            controller.userData.selectPressed = false;
            controller.add( line.clone() );
            controller.userData.marker = this.createMarker( geometry2, material );
            controllers.push( controller );
            this.dolly.add( controller );
            
            const grip = this.renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ) );
            this.dolly.add( grip );
            controller.userData.grip = grip;
        }  
        
        return controllers;
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        function onSelectStart( ){
            this.userData.selectPressed = true;
            if (this.userData.gun){
                self.sounds.shot.play();
                self.bullet.fire();
            }else if (this.userData.teleport){
                self.player.object.position.copy( this.userData.teleport.position );
                this.userData.teleport.visible = false;
                self.teleports.forEach( teleport => teleport.fadeOut(0.5) );
                self.sounds.swish.play();
            }else if (this.userData.interactable){
                this.userData.interactable.play();
            }else if (this.userData.marker.visible){
                const pos = this.userData.marker.position;
                console.log( `${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}`);
            }
        }
        
        function onSelectEnd( ){
            this.userData.selectPressed = false;
        }
        
        function onSqueezeStart( ){
            this.userData.squeezePressed = true;
            self.teleports.forEach( teleport => teleport.fadeIn(1) );
        }
        
        function onSqueezeEnd( ){
            this.userData.squeezePressed = false;
            self.teleports.forEach( teleport => teleport.fadeOut(1) );
        }
        
        function onSessionStart(){
            if (self.sounds === undefined ) self.loadAudio();
        }
        
        const btn = new VRButton( this.renderer, { onSessionStart } );
        
        this.controllers = this.buildControllers();
        
        this.controllers.forEach( controller => {
            controller.addEventListener( 'selectstart', onSelectStart );
            controller.addEventListener( 'selectend', onSelectEnd);
            controller.addEventListener( 'squeezestart', onSqueezeStart );
            controller.addEventListener( 'squeezeend', onSqueezeEnd );
        })
        
        this.collisionObjects = [this.navmesh];
        this.teleports.forEach( teleport => self.collisionObjects.push(teleport.children[0]) );
        this.interactables.forEach( interactable => self.collisionObjects.push( interactable.mesh )); 
        this.markables.forEach( markable => self.collisionObjects.push( markable )); 
        
        const gunCollider = this.gun.getObjectByName( 'Collider' );
        gunCollider.material.visible = false;
        this.collisionObjects.push( gunCollider );
    }

    pickupGun( controller = this.controllers[0] ){
        this.gun.position.set(0,0,0);
        this.gun.quaternion.identity();
        //this.gun.rotateY( -Math.PI/2 )
        controller.children[0].visible = false;
        controller.add( this.gun );
        controller.userData.gun = true;
        const grip = controller.userData.grip;
        this.dolly.remove( grip );    
    }
    
    intersectObjects( controller ) {

        const line = controller.getObjectByName( 'ray' );
        this.workingMatrix.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.workingMatrix );

        const intersects = this.raycaster.intersectObjects( this.collisionObjects );
        const marker = controller.userData.marker;
        marker.visible = false;

        controller.userData.teleport = undefined;
        controller.userData.interactable = undefined;
        
        if ( intersects.length > 0 ) {

            const intersect = intersects[ 0 ];

            line.scale.z = intersect.distance;

            const markable = (this.markables.indexOf( intersect.object )!=-1);

            if (intersect.object === this.navmesh || markable){
                marker.scale.set(1,1,1);
                marker.position.copy( intersect.point );
                marker.visible = true;
            }else if (intersect.object.parent === this.gun){
                this.pickupGun( controller );
            }else if (intersect.object.parent && intersect.object.parent instanceof TeleportMesh){
                intersect.object.parent.selected = true;
                controller.userData.teleport = intersect.object.parent;
            }else{
                const tmp = this.interactables.filter( interactable => interactable.mesh == intersect.object );

                if (tmp.length>0) controller.userData.interactable = tmp[0];
            }
    
        } 

    }

    createPlayer(){
        const target = new THREE.Object3D();
        target.position.set(-3, 0.25, 2); 
        
        const options = {
					object: target,
					speed: 5,
					app: this,
					name: 'player',
					npc: false
				};
				
		const player = new Player(options);
           
        this.dolly = new THREE.Object3D();
        this.dolly.position.set(0, -0.25, 0);
        this.dolly.add(this.camera);
        
        this.dummyCam = new THREE.Object3D();
        this.camera.add( this.dummyCam );
        
        target.add(this.dolly);
        
        this.dolly.rotation.y = Math.PI;
        
        return player;
    }
    
	render(){
		const dt = this.clock.getDelta();
		const self = this;
		
		this.sun.position.copy(this.dummyCam.position);
		this.sun.position.y += 10;
		this.sun.position.z += 10;
		
		this.stats.update();
        
        if (this.renderer.xr.isPresenting){
            
            this.teleports.forEach( teleport =>{
                teleport.selected = false;
                teleport.update();
            });

            this.controllers.forEach( controller => {
                if ( !controller.userData.gun ) self.intersectObjects( controller );
            });
            
            this.interactables.forEach( interactable => interactable.update(dt) );

            this.player.update(dt);
            
            this.ghouls.forEach( ghoul => { ghoul.update(dt) });
            
            this.bullet.update(dt);
        }
		
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
