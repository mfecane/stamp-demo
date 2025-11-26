import * as THREE from 'three'

export function createGradientSkybox(): THREE.Mesh {
	const geometry = new THREE.SphereGeometry(100, 32, 32)
	
	const vertexShader = `
		varying vec3 vWorldPosition;
		
		void main() {
			vec4 worldPosition = modelMatrix * vec4(position, 1.0);
			vWorldPosition = worldPosition.xyz;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`
	
	const fragmentShader = `
		varying vec3 vWorldPosition;
		
		void main() {
			vec3 direction = normalize(vWorldPosition);
			
			// Create a gradient from bottom to top using Y component
			float gradient = (direction.y + 1.0) * 0.5;
			
			// Create a simple two-color gradient
			vec3 bottomColor = vec3(54.0 / 255.0, 54.0 / 255.0, 65.0 / 255.0) * 0.5; //rgb(54, 54, 65)
			vec3 topColor = vec3(112.0 / 255.0, 101.0 / 255.0, 116.0 / 255.0) * 0.5; //rgb(112, 101, 116)
			
			vec3 color = mix(bottomColor, topColor, gradient);
			
			gl_FragColor = vec4(color, 1.0);
		}
	`
	
	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		side: THREE.BackSide,
	})
	
	const skybox = new THREE.Mesh(geometry, material)
	skybox.renderOrder = -1
	skybox.frustumCulled = false
	
	return skybox
}

