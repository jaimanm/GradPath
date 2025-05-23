export interface Course {
  id: string;
  name?: string;
  semester: number;
  prerequisites: string[];
  completed: boolean;
  credits: number;
  description: string;
  verticalPosition?: number;
}

export interface Prerequisite {
  type: "and" | "or" | "course";
  course?: string;
  children?: Prerequisite[];
  prerequisites?: string[]; // direct child course IDs
  parents?: string[]; // parent course IDs
}

export interface GraduationPlan {
  courses: Course[];
}

export interface CourseNode {
  id: string;
  semester: number;
  completed: boolean;
  x: number;
  y: number;
  prerequisites: string[];
  credits: number;
  description: string;
}

export interface CourseEdge {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface GraphData {
  nodes: CourseNode[];
  edges: CourseEdge[];
}

export interface CourseJson {
  course_id: string;
  semester: string;
  name: string;
  dept_id: string;
  department: string;
  credits: string;
  description: string;
  grading_method: string[];
  gen_ed: string[][];
  core: string[];
  relationships: {
    coreqs: string | null;
    prereqs: string | null;
    formerly: string | null;
    restrictions: string | null;
    additional_info: string | null;
    also_offered_as: string | null;
    credit_granted_for: string | null;
  };
  sections: string[];
}

declare module "cytoscape" {
  interface Core {
    hasInitialised?: boolean;
  }
}
