import * as THREE from 'three'

// Class to create a bent tubular mesh geometry
export class BentTubeGeometry extends THREE.BufferGeometry {
  constructor(radius: number = 0.2, segments: number = 32, curveSegments: number = 64) {
    super()

    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Create a more uniform vertical curve with slight irregularity
    // Using CatmullRomCurve3 for smoother curves
    const points: THREE.Vector3[] = []
    const height = 4
    const irregularity = 0.2 // Reduced for more uniformity

    // Create control points with slight irregular bends
    for (let i = 0; i <= 5; i++) {
      const t = i / 5
      const y = t * height
      // Subtle horizontal offsets for slight variation
      const x = Math.sin(t * Math.PI * 1.5) * irregularity
      const z = Math.cos(t * Math.PI * 1.3) * irregularity
      points.push(new THREE.Vector3(x, y, z))
    }

    const curve = new THREE.CatmullRomCurve3(points)

    // Get points along the curve
    const curvePoints = curve.getPoints(curveSegments)
    const tangents: THREE.Vector3[] = []

    // Calculate tangents using curve derivatives for better accuracy
    for (let i = 0; i < curvePoints.length; i++) {
      const t = i / (curvePoints.length - 1)
      const tangent = curve.getTangent(t).normalize()
      tangents.push(tangent)
    }

    // Improved parallel transport for consistent orientation without twisting
    interface Frame {
      right: THREE.Vector3
      up: THREE.Vector3
    }
    const frames: Frame[] = []

    // Reference direction for initial frame (pointing in +X direction)
    const referenceDir = new THREE.Vector3(1, 0, 0)

    // Calculate consistent frames using improved parallel transport
    for (let i = 0; i < curvePoints.length; i++) {
      const tangent = tangents[i]

      let right: THREE.Vector3, up: THREE.Vector3
      
      if (i === 0) {
        // Initialize first frame with consistent orientation
        // Use a fixed reference direction (world +X) to ensure consistent starting orientation
        const worldX = new THREE.Vector3(1, 0, 0)
        const worldY = new THREE.Vector3(0, 1, 0)
        
        // Project world X onto plane perpendicular to tangent
        const projX = worldX.clone().sub(
          worldX.clone().multiplyScalar(worldX.dot(tangent))
        )
        
        // If projection is too small (tangent is nearly parallel to X), use Y instead
        if (projX.length() < 0.01) {
          const projY = worldY.clone().sub(
            worldY.clone().multiplyScalar(worldY.dot(tangent))
          )
          if (projY.length() > 0.01) {
            right = projY.normalize()
          } else {
            // Tangent is nearly vertical, use arbitrary perpendicular
            right = new THREE.Vector3(1, 0, 0)
          }
        } else {
          right = projX.normalize()
        }
        
        // Ensure right is perpendicular to tangent (re-orthogonalize)
        right = new THREE.Vector3().crossVectors(tangent, right)
        if (right.length() < 0.01) {
          // Fallback if still too small
          right = new THREE.Vector3(1, 0, 0)
          right = new THREE.Vector3().crossVectors(tangent, right)
        }
        right.normalize()
        
        // Calculate up vector (perpendicular to both tangent and right)
        up = new THREE.Vector3().crossVectors(tangent, right).normalize()
      } else {
        // Parallel transport: rotate previous frame to align with new tangent
        const prevTangent = tangents[i - 1]
        const prevRight = frames[i - 1].right
        const prevUp = frames[i - 1].up

        // Calculate rotation needed to align with new tangent
        const dot = Math.max(-1, Math.min(1, prevTangent.dot(tangent)))
        const angle = Math.acos(dot)
        
        if (angle > 0.0001) {
          // Rotation axis
          const axis = new THREE.Vector3().crossVectors(prevTangent, tangent)
          if (axis.length() > 0.0001) {
            axis.normalize()
            
            // Rotate the previous frame
            const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle)
            right = prevRight.clone().applyQuaternion(quaternion)
            up = prevUp.clone().applyQuaternion(quaternion)
          } else {
            // Tangents are parallel, keep previous frame
            right = prevRight.clone()
            up = prevUp.clone()
          }
        } else {
          // Tangents are parallel, keep previous frame
          right = prevRight.clone()
          up = prevUp.clone()
        }

        // Re-orthonormalize to prevent drift
        right = new THREE.Vector3().crossVectors(up, tangent).normalize()
        if (right.length() < 0.01) {
          // Fallback if cross product fails
          const altUp = new THREE.Vector3(0, 1, 0)
          right = new THREE.Vector3().crossVectors(altUp, tangent).normalize()
          if (right.length() < 0.01) {
            right = new THREE.Vector3(1, 0, 0)
          }
        }
        up = new THREE.Vector3().crossVectors(tangent, right).normalize()
      }

      frames.push({ right, up })
    }

    // Generate vertices for each cross-section with consistent ordering
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i]
      const frame = frames[i]
      const right = frame.right
      const up = frame.up

      // Taper: radius decreases from base to top
      const t = i / (curvePoints.length - 1)
      const taperFactor = 1 - t * 0.3 // 30% taper (0.7x at top)
      const currentRadius = radius * taperFactor

      // Generate circle vertices around the curve point
      // Start from a consistent angle (0) and go counter-clockwise
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        // Position on the circle
        const offset = new THREE.Vector3()
        offset.addScaledVector(right, cos * currentRadius)
        offset.addScaledVector(up, sin * currentRadius)

        const vertex = point.clone().add(offset)
        vertices.push(vertex.x, vertex.y, vertex.z)

        // Normal (pointing outward from the tube)
        const normal = offset.clone().normalize()
        normals.push(normal.x, normal.y, normal.z)

        // UV coordinates
        const u = j / segments // Around the tube (0 to 1)
        const v = i / (curvePoints.length - 1) // Along the tube (0 to 1)
        uvs.push(u, v)
      }
    }

    // Generate indices for the tube with correct winding order
    for (let i = 0; i < curvePoints.length - 1; i++) {
      for (let j = 0; j < segments; j++) {
        const current = i * (segments + 1) + j
        const next = i * (segments + 1) + j + 1
        const currentNext = (i + 1) * (segments + 1) + j
        const nextNext = (i + 1) * (segments + 1) + j + 1

        // First triangle: current -> next -> currentNext (counter-clockwise)
        indices.push(current, next, currentNext)
        // Second triangle: next -> nextNext -> currentNext (counter-clockwise)
        indices.push(next, nextNext, currentNext)
      }
    }

    // Set geometry attributes
    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    this.setIndex(indices)
    this.computeBoundingSphere()
  }
}

