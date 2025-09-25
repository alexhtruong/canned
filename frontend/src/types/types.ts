interface Term {
  id: number
  name: string
  start_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  term: Term
  status: "active" | "completed" | "upcoming"
  subscribed: boolean
  assignmentCount: number
  canvasUrl: string
}