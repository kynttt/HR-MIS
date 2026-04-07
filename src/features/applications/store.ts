import { create } from "zustand"

interface PipelineApplication {
  id: string
  applicantName: string
  jobTitle: string
  departmentName: string | null
  status: string
  submittedAt: string
}

interface ApplicationsState {
  applications: PipelineApplication[]
  setApplications: (apps: PipelineApplication[]) => void
  updateApplicationStatus: (id: string, status: string) => void
}

export function useApplicationsStore() {
  return useStore((state) => state)
}

const useStore = create<ApplicationsState>((set) => ({
  applications: [],
  setApplications: (apps) => set({ applications: apps }),
  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, status } : app
      ),
    })),
}))
