import * as THREE from 'three'

export class CanvasRenderer {
	static clearCanvas(canvas: HTMLCanvasElement): void {
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get canvas context')
		}
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	}

	static drawImage(
		canvas: HTMLCanvasElement,
		sourceImage: HTMLImageElement,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get canvas context')
		}

		if (sourceImage.complete && sourceImage.naturalWidth > 0) {
			ctx.drawImage(sourceImage, x, y, width, height)
		} else {
			sourceImage.onload = () => {
				ctx.drawImage(sourceImage, x, y, width, height)
			}
		}
	}

	static drawStamp(
		canvas: HTMLCanvasElement,
		sourceImage: HTMLImageElement,
		uv: THREE.Vector2,
		sizeX: number,
		sizeY: number,
		rotation: number = 0
	): void {
		this.clearCanvas(canvas)
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get canvas context')
		}

		const centerX = uv.x * canvas.width
		const centerY = (1 - uv.y) * canvas.height
		const halfSizeX = sizeX / 2
		const halfSizeY = sizeY / 2
		const canvasWidth = canvas.width
		const canvasHeight = canvas.height

		// Calculate bounding box of rotated image
		const cos = Math.cos(rotation)
		const sin = Math.sin(rotation)
		const corners = [
			{ x: -halfSizeX, y: -halfSizeY },
			{ x: halfSizeX, y: -halfSizeY },
			{ x: halfSizeX, y: halfSizeY },
			{ x: -halfSizeX, y: halfSizeY }
		]

		// Rotate corners
		const rotatedCorners = corners.map(corner => ({
			x: centerX + corner.x * cos - corner.y * sin,
			y: centerY + corner.x * sin + corner.y * cos
		}))

		// Find bounding box
		const minX = Math.min(...rotatedCorners.map(c => c.x))
		const maxX = Math.max(...rotatedCorners.map(c => c.x))
		const minY = Math.min(...rotatedCorners.map(c => c.y))
		const maxY = Math.max(...rotatedCorners.map(c => c.y))

		// Determine which wrapped positions we need to draw (only X wrapping)
		const xOffsets: number[] = [0]

		// Check if image extends beyond left edge - wrap to right
		if (minX < 0) {
			xOffsets.push(canvasWidth)
		}
		// Check if image extends beyond right edge - wrap to left
		if (maxX > canvasWidth) {
			xOffsets.push(-canvasWidth)
		}

		// Draw the image at all wrapped positions (X-axis wrapping only)
		for (const xOffset of xOffsets) {
			ctx.save()
			ctx.translate(centerX + xOffset, centerY)
			ctx.rotate(rotation)
			ctx.drawImage(sourceImage, -halfSizeX, -halfSizeY, sizeX, sizeY)
			ctx.restore()
		}
	}

	static updateTexture(texture: THREE.CanvasTexture): void {
		texture.needsUpdate = true
	}
}

