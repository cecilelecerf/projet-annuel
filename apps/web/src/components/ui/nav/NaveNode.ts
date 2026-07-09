import { type Component } from 'vue'

export interface NavNode {
  index: string
  label: string
  icon?: Component | string
  params?: Record<string, string>
  query?: Record<string, string>
  children?: NavNode[]
}
