// Composed store that combines all stores for backward compatibility
import { useSceneStore } from './sceneStore'
import { useWidgetStore } from './widgetStore'
import { useStampStore, type StampInfo } from './stampStore'
import { useTextureStore } from './textureStore'

export type { StampInfo }

export interface EditorState {
	// Scene
	camera: ReturnType<typeof useSceneStore>['camera']
	setCamera: ReturnType<typeof useSceneStore>['setCamera']
	selectedObject: ReturnType<typeof useSceneStore>['selectedObject']
	setSelectedObject: ReturnType<typeof useSceneStore>['setSelectedObject']
	tube: ReturnType<typeof useSceneStore>['tube']
	setTube: ReturnType<typeof useSceneStore>['setTube']
	scene: ReturnType<typeof useSceneStore>['scene']
	setScene: ReturnType<typeof useSceneStore>['setScene']
	renderer: ReturnType<typeof useSceneStore>['renderer']
	setRenderer: ReturnType<typeof useSceneStore>['setRenderer']

	// Widget
	widget: ReturnType<typeof useWidgetStore>['widget']
	setWidget: ReturnType<typeof useWidgetStore>['setWidget']
	createWidget: ReturnType<typeof useWidgetStore>['createWidget']

	// Stamp
	stampInfo: ReturnType<typeof useStampStore>['stampInfo']
	setStampInfo: ReturnType<typeof useStampStore>['setStampInfo']
	selectedStampId: ReturnType<typeof useStampStore>['selectedStampId']
	setSelectedStampId: ReturnType<typeof useStampStore>['setSelectedStampId']
	imageHandle: ReturnType<typeof useStampStore>['imageHandle']
	setImageHandle: ReturnType<typeof useStampStore>['setImageHandle']
	redrawStamp: () => void

	// Texture
	canvas: ReturnType<typeof useTextureStore>['canvas']
	setCanvas: ReturnType<typeof useTextureStore>['setCanvas']
	texture: ReturnType<typeof useTextureStore>['texture']
	setTexture: ReturnType<typeof useTextureStore>['setTexture']
	sourceImage: ReturnType<typeof useTextureStore>['sourceImage']
	setSourceImage: ReturnType<typeof useTextureStore>['setSourceImage']
	isImageReady: ReturnType<typeof useTextureStore>['isImageReady']
	setIsImageReady: ReturnType<typeof useTextureStore>['setIsImageReady']

	// Zustand store methods
	getState: () => EditorState
}

// Create a proxy store that delegates to individual stores
export const useEditorStore = (): EditorState => {
	const sceneStore = useSceneStore()
	const widgetStore = useWidgetStore()
	const stampStore = useStampStore()
	const textureStore = useTextureStore()

	return {
		// Scene
		camera: sceneStore.camera,
		setCamera: sceneStore.setCamera,
		selectedObject: sceneStore.selectedObject,
		setSelectedObject: sceneStore.setSelectedObject,
		tube: sceneStore.tube,
		setTube: sceneStore.setTube,
		scene: sceneStore.scene,
		setScene: sceneStore.setScene,
		renderer: sceneStore.renderer,
		setRenderer: sceneStore.setRenderer,

		// Widget
		widget: widgetStore.widget,
		setWidget: widgetStore.setWidget,
		createWidget: widgetStore.createWidget,

		// Stamp
		stampInfo: stampStore.stampInfo,
		setStampInfo: stampStore.setStampInfo,
		selectedStampId: stampStore.selectedStampId,
		setSelectedStampId: stampStore.setSelectedStampId,
		imageHandle: stampStore.imageHandle,
		setImageHandle: stampStore.setImageHandle,
		redrawStamp: () => {
			const currentTextureState = useTextureStore.getState()
			stampStore.redrawStamp(currentTextureState.canvas, currentTextureState.sourceImage, currentTextureState.texture)
		},

		// Texture
		canvas: textureStore.canvas,
		setCanvas: textureStore.setCanvas,
		texture: textureStore.texture,
		setTexture: textureStore.setTexture,
		sourceImage: textureStore.sourceImage,
		setSourceImage: textureStore.setSourceImage,
		isImageReady: textureStore.isImageReady,
		setIsImageReady: textureStore.setIsImageReady,

		// Zustand store methods
		getState: () => {
			const sceneState = useSceneStore.getState()
			const widgetState = useWidgetStore.getState()
			const stampState = useStampStore.getState()
			const textureState = useTextureStore.getState()

			return {
				camera: sceneState.camera,
				setCamera: sceneState.setCamera,
				selectedObject: sceneState.selectedObject,
				setSelectedObject: sceneState.setSelectedObject,
				tube: sceneState.tube,
				setTube: sceneState.setTube,
				scene: sceneState.scene,
				setScene: sceneState.setScene,
				renderer: sceneState.renderer,
				setRenderer: sceneState.setRenderer,
				widget: widgetState.widget,
				setWidget: widgetState.setWidget,
				createWidget: widgetState.createWidget,
				stampInfo: stampState.stampInfo,
				setStampInfo: stampState.setStampInfo,
				selectedStampId: stampState.selectedStampId,
				setSelectedStampId: stampState.setSelectedStampId,
				imageHandle: stampState.imageHandle,
				setImageHandle: stampState.setImageHandle,
				redrawStamp: () => {
					const currentTextureState = useTextureStore.getState()
					stampState.redrawStamp(currentTextureState.canvas, currentTextureState.sourceImage, currentTextureState.texture)
				},
				canvas: textureState.canvas,
				setCanvas: textureState.setCanvas,
				texture: textureState.texture,
				setTexture: textureState.setTexture,
				sourceImage: textureState.sourceImage,
				setSourceImage: textureState.setSourceImage,
				isImageReady: textureState.isImageReady,
				setIsImageReady: textureState.setIsImageReady,
				getState: () => useEditorStore.getState(),
			}
		},
	}
}

// Add getState method to the hook for direct access
useEditorStore.getState = (): EditorState => {
	const sceneState = useSceneStore.getState()
	const widgetState = useWidgetStore.getState()
	const stampState = useStampStore.getState()
	const textureState = useTextureStore.getState()

	return {
		camera: sceneState.camera,
		setCamera: sceneState.setCamera,
		selectedObject: sceneState.selectedObject,
		setSelectedObject: sceneState.setSelectedObject,
		tube: sceneState.tube,
		setTube: sceneState.setTube,
		scene: sceneState.scene,
		setScene: sceneState.setScene,
		renderer: sceneState.renderer,
		setRenderer: sceneState.setRenderer,
		widget: widgetState.widget,
		setWidget: widgetState.setWidget,
		createWidget: widgetState.createWidget,
		stampInfo: stampState.stampInfo,
		setStampInfo: stampState.setStampInfo,
		selectedStampId: stampState.selectedStampId,
		setSelectedStampId: stampState.setSelectedStampId,
		imageHandle: stampState.imageHandle,
		setImageHandle: stampState.setImageHandle,
		redrawStamp: () => {
			const currentTextureState = useTextureStore.getState()
			stampState.redrawStamp(currentTextureState.canvas, currentTextureState.sourceImage, currentTextureState.texture)
		},
		canvas: textureState.canvas,
		setCanvas: textureState.setCanvas,
		texture: textureState.texture,
		setTexture: textureState.setTexture,
		sourceImage: textureState.sourceImage,
		setSourceImage: textureState.setSourceImage,
		isImageReady: textureState.isImageReady,
		setIsImageReady: textureState.setIsImageReady,
		getState: () => useEditorStore.getState(),
	}
}
