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
		sizeY: number
	): void {
		this.clearCanvas(canvas)
		const x = uv.x * canvas.width - sizeX / 2
		const y = (1 - uv.y) * canvas.height - sizeY / 2
		this.drawImage(canvas, sourceImage, x, y, sizeX, sizeY)
	}

	static updateTexture(texture: THREE.CanvasTexture): void {
		texture.needsUpdate = true
	}
}

