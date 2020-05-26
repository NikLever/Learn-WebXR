import * as THREE from './three/three.module.js';

class Player{
	constructor(options){
		const fps = options.fps || 30; //default fps
		
		this.assetsPath = options.assetsPath;
		this.name = options.name | 'Player';
		
		this.animations = {};	
		
		options.app.scene.add(options.object);
		
		this.object = options.object;
		this.pathLines = new THREE.Object3D();
		this.pathColor = new THREE.Color(0xFFFFFF);
		options.app.scene.add(this.pathLines);
		
		this.npc = options.npc;
        
        if (this.npc) this.dead = false;
		
        if (options.app.pathfinder){
            this.pathfinder = options.app.pathfinder;

            this.speed = options.speed;
            this.app = options.app;
            this.ZONE = options.app.ZONE;

            this.navMeshGroup = this.pathfinder.getGroup(this.ZONE, this.object.position);	
        }
		
		const clip = options.clip;
		const self = this;
		
		const pt = this.object.position.clone();
		pt.z += 10;
		this.object.lookAt(pt);
		
        if (options.anims){ 
            //Use this option to crop a single animation into multiple clips
            this.mixer = new THREE.AnimationMixer(options.object);
            options.anims.forEach(function(anim){
                self.animations[anim.name] = THREE.AnimationUtils.subclip(clip, anim.name, anim.start, anim.end);
            });
        }
        
        if (options.animations){
            //Use this option to set multiple animations directly
            this.mixer = new THREE.AnimationMixer(options.object);
            options.animations.forEach( (animation)=>{
                self.animations[animation.name] = animation;
            })
        }
	}
	
	newPath(pt){
        if (this.pathfinder===undefined) return;
        
		console.log(`New path to ${pt.x.toFixed(1)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}`);
		const player = this.object;

		const targetGroup = this.pathfinder.getGroup(this.ZONE, pt);
		const closestTargetNode = this.pathfinder.getClosestNode(pt, this.ZONE, targetGroup);
		
		// Calculate a path to the target and store it
		this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);

		const self = this;
		
		if (this.calculatedPath && this.calculatedPath.length) {
			this.action = 'walk';
			
			const pt = this.calculatedPath[0].clone();
			pt.y = player.position.y;
			const quaternion = player.quaternion.clone();
			player.lookAt(pt);
			this.quaternion = player.quaternion.clone();
			player.quaternion.copy(quaternion);
			
			if (this.app.debug.showPath && !this.npc){
				if (this.pathLines) this.app.scene.remove(this.pathLines);

				const material = new THREE.LineBasicMaterial({
					color: self.pathColor,
					linewidth: 2
				});

				let geometry = new THREE.Geometry();
				geometry.vertices.push(player.position);

				// Draw debug lines
				this.calculatedPath.forEach( function(vertex){
					geometry.vertices.push(vertex.clone().add(new THREE.Vector3(0, self.app.debug.offset, 0)));
				});

				this.pathLines = new THREE.Line( geometry, material );
				this.app.scene.add( this.pathLines );

				// Draw debug spheres except the last one. Also, add the player position.
				const debugPath = [player.position].concat(this.calculatedPath);

				debugPath.forEach(function( vertex ){
					geometry = new THREE.SphereBufferGeometry( 0.2 );
					const material = new THREE.MeshBasicMaterial( {color: self.pathColor} );
					const node = new THREE.Mesh( geometry, material );
					node.position.copy(vertex);
					node.position.y += self.app.debug.offset;
					self.pathLines.add( node );
				});
			}
		} else {
			this.action = 'idle';
			
			const closestPlayerNode = self.pathfinder.getClosestNode(player.position, this.ZONE, this.navMeshGroup);
			const clamped = new THREE.Vector3();
			this.pathfinder.clampStep(
				player.position, 
				pt.clone(), 
				closestPlayerNode, 
				this.ZONE, 
				this.navMeshGroup, 
				clamped);

			if (this.pathLines) this.app.scene.remove(this.pathLines);
		}
	}
	
	set action(name){
		//Make a copy of the clip if this is a remote player
		if (this.actionName == name) return;
		
		const clip = this.animations[name];
		
        delete this.curAction;
        
		if (clip!==undefined){
			const action = this.mixer.clipAction( clip );
			action.loop = clip.loop;
			action.time = 0;
			this.mixer.stopAllAction();
			this.actionName = name;
			this.actionTime = Date.now();
			action.fadeIn(0.5);	
			action.play();
            this.curAction = action;
		}
	}
	
	update(dt){
		const speed = this.speed;
		const player = this.object;
		
		if (this.mixer) this.mixer.update(dt);
		
        if (this.pathfinder!==undefined){
            if (this.calculatedPath && this.calculatedPath.length) {
                const targetPosition = this.calculatedPath[0];

                const vel = targetPosition.clone().sub(player.position);

                if (vel.lengthSq() > 0.1) {
                    vel.normalize();
                    // Move player to target
                    if (this.quaternion) player.quaternion.slerp(this.quaternion, 0.1);
                    player.position.add(vel.multiplyScalar(dt * speed));
                } else {
                    // Remove node from the path we calculated
                    this.calculatedPath.shift();
                    if (this.calculatedPath.length==0){
                        if (this.npc){
                            this.newPath(this.app.randomWaypoint);
                        }else{
                            this.action = 'idle';
                        }
                    }else{
                        const pt = this.calculatedPath[0].clone();
                        pt.y = player.position.y;
                        const quaternion = player.quaternion.clone();
                        player.lookAt(pt);
                        this.quaternion = player.quaternion.clone();
                        player.quaternion.copy(quaternion); 
                    }
                }
            }else{
                if (this.npc && !this.dead) this.newPath(this.app.randomWaypoint);
            }
        }
    }
}

export { Player };