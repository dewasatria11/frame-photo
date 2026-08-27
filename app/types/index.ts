export type Position9 =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type WatcherState = 'idle' | 'requesting-permission' | 'ready' | 'watching' | 'paused' | 'processing' | 'error'
export type ProcessingStage = 'queued' | 'reading' | 'decoding' | 'applying-overlay' | 'encoding' | 'writing' | 'success' | 'error'
export type OutputFormat = 'jpeg' | 'png' | 'webp'
export type CollisionMode = 'skip' | 'overwrite' | 'auto-number'

export interface BaseOverlay { id: string; enabled: boolean; zIndex: number; opacity: number; position: Position9; rotation: number }
export interface ImageOverlay extends BaseOverlay { type: 'image'; source: Blob | CanvasImageSource; scale: number; margin: number }
export interface FrameOverlay extends BaseOverlay { type: 'frame'; source: Blob | CanvasImageSource; fit: 'fit' | 'cover' | 'stretch' }
export interface TextOverlay extends BaseOverlay {
  type: 'text'; text: string; fontFamily: SafeFont; fontSize: number; fontWeight: 400 | 500 | 600 | 700
  color: string; margin: number; align: 'left' | 'center' | 'right'; shadow: boolean; stroke: boolean
}
export type OverlayLayer = ImageOverlay | FrameOverlay | TextOverlay
export type SafeFont = 'Inter' | 'Arial' | 'Georgia' | 'Times New Roman' | 'system-ui'

export interface OutputSettings { format: OutputFormat; quality: number; prefix: string; collision: CollisionMode; maxWidth?: number; maxHeight?: number }
export interface WatermarkConfig { layers: OverlayLayer[]; output: OutputSettings }
export interface BrandingSettings { appName: string; tagline: string; logoUrl?: string }
export interface WatcherSettings { intervalMs: number; stabilityDelayMs: number; concurrency: 1 | 2 | 3 }
export interface AppSettings { branding: BrandingSettings; watermark: WatermarkConfig; output: OutputSettings; watcher: WatcherSettings }

export interface QueueItem { id: string; fileName: string; file: File; status: ProcessingStage; createdAt: number; error?: string }
export type LogType = 'INFO' | 'WATCH' | 'FOUND' | 'PROCESS' | 'SUCCESS' | 'WARNING' | 'ERROR'
export interface ProcessingLog { id: string; type: LogType; message: string; createdAt: number }
export interface ProcessedResult { id: string; fileName: string; blob: Blob; objectUrl: string; createdAt: number; status: 'success' | 'error'; sourceName?: string; error?: string }

export interface FileSystemPermissionDescriptor { mode?: 'read' | 'readwrite' }
export interface FileSystemHandle { readonly kind: 'file' | 'directory'; readonly name: string; isSameEntry(other: FileSystemHandle): Promise<boolean>; queryPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>; requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState> }
export interface FileSystemFileHandle extends FileSystemHandle { readonly kind: 'file'; getFile(): Promise<File>; createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void>; abort?(): Promise<void> }> }
export interface FileSystemDirectoryHandle extends FileSystemHandle { readonly kind: 'directory'; values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>; getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> }

