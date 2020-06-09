//Based on https://github.com/jeromeetienne/threex.volumetricspotlight
import { Color, Vector3, ShaderMaterial } from './three/three.module.js';

class SpotLightVolumetricMaterial extends ShaderMaterial{
	constructor( color = new Color(0xFFFFFF), position = new Vector3() , attenuation = 5.0, anglePower = 1.2){
        
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            void main(){
                // compute intensity',
                vNormal		= normalize( normalMatrix * normal );

                vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );
                vWorldPosition		= worldPosition.xyz;

                // set gl_Position
                gl_Position	= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`;
	
	const fragmentShader = `
		varying vec3		vNormal;
		varying vec3		vWorldPosition;

		uniform vec3		lightColor;

		uniform vec3		spotPosition;

		uniform float		attenuation;
		uniform float		anglePower;

		void main(){
			float intensity;

			//////////////////////////////////////////////////////////
			// distance attenuation					//
			//////////////////////////////////////////////////////////
			intensity	= distance(vWorldPosition, spotPosition)/attenuation;
			intensity	= 1.0 - clamp(intensity, 0.0, 1.0);

			//////////////////////////////////////////////////////////
			// intensity on angle					//
			//////////////////////////////////////////////////////////
			vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));
			float angleIntensity	= pow( dot(normal, vec3(0.0, 0.0, 1.0)), anglePower );
			intensity	= intensity * angleIntensity;		

			//////////////////////////////////////////////////////////
			// final color						//
			//////////////////////////////////////////////////////////

			// set the final color
			gl_FragColor	= vec4( lightColor, intensity);
		}`;
	
        const parameters = {
            uniforms : { 
                attenuation	: {
                    value	: attenuation
                },
                anglePower	: {
                    value	: anglePower
                },
                spotPosition : {
                    value	: position
                },
                lightColor	: {
                    value	: color
                }
            },
            vertexShader : vertexShader,
            fragmentShader : fragmentShader,
            transparent	: true,
            depthWrite : false
        };
        
        super( parameters );
        
    }
}

export { SpotLightVolumetricMaterial };