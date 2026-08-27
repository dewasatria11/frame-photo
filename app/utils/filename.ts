import type { OutputFormat } from '../types'

const INVALID = /[\x00-\x1f\x7f/\\:*?"<>|]+/g

export function sanitizeFilename(value: string, fallback = 'image'): string {
  const clean = value.replace(/^(?:\.\.[/\\])+/, '').replace(INVALID, '_').replace(/\.\.+/g, '.').replace(/^\.+/, '').trim().replace(/[. ]+$/g, '')
  return (clean || fallback).slice(0, 180)
}

export function sanitizePrefix(value: string): string { return sanitizeFilename(value, '').slice(0, 50) }

export function outputExtension(format: OutputFormat): string { return format === 'jpeg' ? 'jpg' : format }

export function buildOutputName(source: string, prefix: string, format: OutputFormat): string {
  const dot = source.lastIndexOf('.')
  const stem = dot > 0 ? source.slice(0, dot) : source
  return `${sanitizePrefix(prefix)}${sanitizeFilename(stem)}.${outputExtension(format)}`
}

export function numberedFilename(name: string, sequence: number): string {
  if (sequence <= 1) return name
  const dot = name.lastIndexOf('.')
  return dot > 0 ? `${name.slice(0, dot)}_${sequence}${name.slice(dot)}` : `${name}_${sequence}`
}
