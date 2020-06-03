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
		
		this.debug = { showPath:false, teleport: true };
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
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

				self.loadGhoul();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.33;
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

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
						speed: 2,
						assetsPath: self.assetsPath,
						loader: loader,
						anims: anims,
						clip: gltf.animations[0],
						app: self,
						name: 'ghoul',
						npc: true
					};

					const ghoul = new Player(options);

					const scale = 0.015;
					ghoul.object.scale.set(scale, scale, scale);

					ghoul.object.position.copy(self.randomWaypoint);
					ghoul.newPath(self.randomWaypoint);
					
					self.ghouls.push(ghoul);
					
				});
					
                self.loadAudio();
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.33 + 0.33;

			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

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
                
                if (self.audio.index >= self.audio.names.length ){
                    delete self.audio;
                    self.initGame();
                }else{
                    self.loadAudio();
                }
            },

            // onProgress callback
            function ( xhr ) {
                self.loadingBar.progress = (xhr.loaded / xhr.total) * 0.85 + 0.66 + self.audio.index*0.85;
            },

            // onError callback
            function ( err ) {
                console.log( 'An error happened' );
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
	
	initGame(){
		const gui = new dat.GUI();
		//gui.add(this, 'showPath');
		//gui.add(this, 'framebufferScaleFactor');
        gui.add(this, 'teleport');
		
		this.fred = this.createTarget();
        
        //Next location marker
        this.locationMarker = this.createLocationMarker();
        
		this.setupVR();

		this.loading = false;

		this.renderer.setAnimationLoop( () => { this.render(); } );

		this.loadingBar.visible = false;
	}
	
    createLocationMarker(){
        const geometry = new THREE.SphereGeometry(0.2, 8, 6);
        const material = new THREE.MeshBasicMaterial( { color: 0xFF0000 });
        const mesh = new THREE.Mesh( geometry, material );
        mesh.visible = false;
        this.scene.add( mesh );
        return mesh;
    }
    
	get randomWaypoint(){
		const index = Math.floor(Math.random()*this.waypoints.length);
		return this.waypoints[index];
	}
	
	set showPath(value){
		if (this.fred.pathLines) this.fred.pathLines.visible = value;
		this.debug.showPath = value;
	}
	
	get showPath(){
		return this.debug.showPath;
	}
	
	get framebufferScaleFactor(){
		return 1;
	}
	
	set framebufferScaleFactor(value){
		if (this.renderer.xr.isPresenting){
			alert("Can't set the frame buffer scale factor during a VR session");
		}else{
			this.renderer.xr.setFramebufferScaleFactor(value);
		}
	}
    
    get teleport(){
        return this.debug.teleport;
    }
    
    set teleport(value){
        this.debug.teleport = value;
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
        
        this.collisionObjects = [];
        
        this.ghouls.forEach( (ghoul) => { self.collisionObjects.push( ghoul.object.children[1] ) });
        this.collisionObjects.push(this.navmesh);
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 10;

        this.controller.add( line.clone() );
        
        this.buttonDown = false;
    }
    
    onSelectStart( event ) {
        const controller = event.target;
        
        this.intersectObjects( controller );
        
        this.buttonDown = true;
        
    }

    onSelectEnd( event ) {
        const controller = event.target;
        
        this.intersectObjects( controller );
        
        this.buttonDown = false;
        
        const self = this;
        
        if (this.moveSelected){
            if (this.teleport){	
                this.fred.object.position.copy(this.movePosition);
                this.fred.navMeshGroup = this.pathfinder.getGroup(this.ZONE, this.fred.object.position);
				if (this.pathLines) this.scene.remove(this.pathLines);
				if (this.calculatedPath) this.calculatedPath.length = 0;
                this.sounds.swish.play();
            }else{
                this.fred.newPath(this.movePosition);
            }
            this.moveSelected = false;
        }
        
        if (this.ghoulTarget){
            const ghouls = this.ghouls.filter( (npc) => { return npc.object.children[1] === this.ghoulTarget});
            if (ghouls.length>0){
                this.sounds.shot.play();
                const ghoul = ghouls[0];
                setTimeout( ()=>{
                    ghoul.add( self.sounds.snarl );
                    self.sounds.snarl.play();
                }, 200);
                ghoul.action = 'die';
                ghoul.dead = true;
                ghoul.calculatedPath = null;
                ghoul.curAction.loop = THREE.LoopOnce;
                ghoul.curAction.clampWhenFinished = true;
                ghoul.mixer.addEventListener( 'finished', (e) => { 
                    //Remove ghoul from scene and arrays
                    self.scene.remove(ghoul.object); 
                    self.collisionObjects.splice( self.collisionObjects.indexOf( ghoul.object.children[1], 1));
                    self.ghouls.splice( self.ghouls.indexOf(ghoul), 1);
                } );
            }
            this.ghoulTarget = null;
        }
        
        this.locationMarker.visible = false;
    }

    getIntersections( controller ) {

        this.tempMatrix.identity().extractRotation( controller.matrixWorld );

        this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

        return this.raycaster.intersectObjects( this.collisionObjects );

    }

    intersectObjects( controller ) {

        const line = controller.getObjectByName( 'line' );
        const intersections = this.getIntersections( controller );

        if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];
            line.scale.z = intersection.distance;
            this.locationMarker.position.copy( intersection.point );
            this.locationMarker.visible = true;
            
            if (intersection.object === this.navmesh){
                this.locationMarker.scale.set(1,1,1);
                this.movePosition.copy( intersection.point );
                this.moveSelected = true;
            }else{
                this.ghoulTarget = intersection.object;
                this.locationMarker.scale.set(0.2,0.2,0.2);
                this.moveSelected = false;
            }
            
        } else {
            this.locationMarker.visible = false;
            line.scale.z = 10;
            this.moveSelected = false;
            this.ghoulTarget = null;
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
    
	render(){
		const dt = this.clock.getDelta();
		const self = this;
		
		this.sun.position.copy(this.camera.position);
		this.sun.position.y += 10;
		this.sun.position.z += 10;
		
		this.stats.update();
        
        if (this.buttonDown) this.intersectObjects( this.controller );
        
        this.fred.update(dt);
		this.ghouls.forEach( ghoul => { ghoul.update(dt) });
		
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
