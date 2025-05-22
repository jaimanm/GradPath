export interface Course {
  id: string
  name?: string
  semester: number
  prerequisites: string[]
  completed: boolean
  credits: number
  description: string
  verticalPosition?: number
}

export interface GraduationPlan {
  courses: Course[]
}

export interface CourseNode {
  id: string
  semester: number
  completed: boolean
  x: number
  y: number
  prerequisites: string[]
  credits: number
  description: string
}

export interface CourseEdge {
  id: string
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export interface GraphData {
  nodes: CourseNode[]
  edges: CourseEdge[]
}

declare module "cytoscape" {
  interface Core {
    hasInitialised?: boolean
  }
}
