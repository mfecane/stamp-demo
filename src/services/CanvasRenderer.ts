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

		ctx.save()
		ctx.translate(centerX, centerY)
		ctx.rotate(rotation)
		ctx.drawImage(sourceImage, -sizeX / 2, -sizeY / 2, sizeX, sizeY)
		ctx.restore()
	}

	static updateTexture(texture: THREE.CanvasTexture): void {
		texture.needsUpdate = true
	}
}

