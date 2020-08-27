import { Clock, Mesh, Vector2, LatheBufferGeometry, Color, ShaderMaterial } from './three/three.module.js';

class TeleportMesh extends Mesh{
    constructor(){
        super();
        
        this.clock = new Clock();
        
        let points = [];
        
        const baseRadius = 0.25;
        const baseHeight = 0.1;
        const height = 2;
        const poleRadius = 0.05;
        const topRadius = 0.1
        const baseSegments = 8;
        const topSegments = 16;
        
        let theta = Math.PI/baseSegments;
        let pt;
        let offset;
        let yOffset;
        
        points.push( new Vector2(0, 0) );
        
        for(let i=0; i<baseSegments; i++){
            offset = (i<baseSegments/2) ? Math.PI * 1.5 : -Math.PI/2;
            pt = new Vector2( Math.cos( theta * i + offset ) * baseHeight/2 + baseRadius, Math.sin( theta * i + offset ) * baseHeight/2 + baseHeight/2);
            points.push(pt);
        }
        
        offset = Math.PI * 1.0;
        
        for(let i=baseSegments/2; i>=0; i--){
            pt = new Vector2( Math.cos( theta * i + offset ) * baseHeight/2 + poleRadius + baseHeight/2, Math.sin( theta * i + offset ) * baseHeight/2 + baseHeight + baseHeight/2);
            points.push(pt);
        }
        
        theta = Math.PI/topSegments;
        
        for(let i=0; i<topSegments; i++){
            offset = (i<topSegments/2) ? Math.PI * 1.5 : -Math.PI/2;
            pt = new Vector2( Math.cos( theta * i + offset ) * topRadius + poleRadius, Math.sin( theta * i + offset ) * topRadius + height - topRadius);
            points.push(pt);
        }
        
        points.push( new Vector2(0, height) );
        
        //points.forEach( pt => console.log( `${pt.x.toFixed(3)}, ${pt.y.toFixed(3)}`));
        
        this.geometry = new LatheBufferGeometry( points, 16 );
        this.material = new ShaderMaterial( { 
            uniforms: {
                uDisplayHeight: { value: 0 },
                uColor: { value: new Color( 0xFFDD00 )},
                uSelected: { value: false },
                uActive: { value: false }
            },
            vertexShader:`
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;

void main(){
    vPosition = position;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vModelMatrix = modelMatrix;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}`,
            fragmentShader:`
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;

uniform float uDisplayHeight;
uniform vec3 uColor;
uniform bool uSelected;
uniform bool uActive;

void main(){
    vec3 worldPosition = ( vModelMatrix * vec4( vPosition, 1.0 )).xyz;
    vec3 viewVector = normalize(cameraPosition - worldPosition);
    float glow =  max(0.0, 1.0 - clamp(dot(vWorldNormal, viewVector), 0.0, 1.0));
    float alpha = (1.0 - smoothstep( uDisplayHeight - 0.2, uDisplayHeight, vPosition.y )) * glow;
    if (uSelected && uActive){
        alpha = clamp(alpha + 0.5, 0.0, 1.0);
    }
    gl_FragColor = vec4( uColor, alpha );
}`,
            transparent: true
        } );
        
        points = [];
        points.push( new Vector2( baseRadius, 0 ));
        points.push( new Vector2( baseRadius, height ));
        
        const geometry = new LatheBufferGeometry( points );
        const material = new ShaderMaterial({
            visible: false
        });
        const mesh = new Mesh( geometry, material );
        this.add( mesh );
        
        this.height = height;
    }
    
    fadeIn( time ){
        this.visible = true;
        this.startTime = this.clock.getElapsedTime();
        this.duration = time;
        this.material.uniforms.uDisplayHeight.value = 0;
        this.material.uniforms.uActive.value = false;
        this.state = 'fadeIn';
    }
    
    fadeOut( time ){
        this.startTime = this.clock.getElapsedTime();
        this.duration = time;
        this.material.uniforms.uActive.value = false;
        this.state = 'fadeOut';
    }
    
    set selected( value ){
        this.material.uniforms.uSelected.value = value;
    }
    
    get selected(){
        return this.material.uniforms.uSelected.value;
    }
    
    update(){
        let elapsedTime = this.clock.getElapsedTime() - this.startTime;
        let delta;
        
        switch(this.state){
            case 'fadeIn':
                delta = elapsedTime/this.duration;
                if (delta>1.0){
                    delta = 1.0;
                    this.state = 'active';
                    this.material.uniforms.uActive.value = true;
                }
                this.selected = false;
                this.material.uniforms.uDisplayHeight.value = (this.height + 0.2) * delta;
                break;
            case 'fadeOut':
                delta = elapsedTime/this.duration;
                if (delta>1.0){
                    delta = 1.0;
                    this.state = 'inactive';
                }
                this.selected = false;
                this.material.uniforms.uDisplayHeight.value = (this.height + 0.2) * (1.0 - delta);
                break;
            default:
                break;
        }
        
        //console.log( this.material.uniforms.uDisplayHeight.value.toFixed(2) );
    }
}

export { TeleportMesh };