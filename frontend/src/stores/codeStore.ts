import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
  lastModified: Date
}

interface CodeStore {
  files: CodeFile[]
  activeFileId: string | null
  addFile: (file: Omit<CodeFile, 'id' | 'lastModified'>) => string
  updateFile: (id: string, content: string) => void
  deleteFile: (id: string) => void
  setActiveFile: (id: string | null) => void
  getActiveFile: () => CodeFile | null
  renameFile: (id: string, name: string) => void
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,

      addFile: (file) => {
        const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newFile: CodeFile = {
          ...file,
          id,
          lastModified: new Date(),
        }
        
        set((state) => ({
          files: [...state.files, newFile],
          activeFileId: id,
        }))
        
        return id
      },

      updateFile: (id, content) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id
              ? { ...file, content, lastModified: new Date() }
              : file
          ),
        }))
      },

      deleteFile: (id) => {
        set((state) => {
          const newFiles = state.files.filter((file) => file.id !== id)
          const newActiveFileId = state.activeFileId === id 
            ? (newFiles.length > 0 ? newFiles[0].id : null)
            : state.activeFileId
          
          return {
            files: newFiles,
            activeFileId: newActiveFileId,
          }
        })
      },

      setActiveFile: (id) => {
        set({ activeFileId: id })
      },

      getActiveFile: () => {
        const { files, activeFileId } = get()
        return files.find((file) => file.id === activeFileId) || null
      },

      renameFile: (id, name) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id
              ? { ...file, name, lastModified: new Date() }
              : file
          ),
        }))
      },
    }),
    {
      name: 'code-storage',
    }
  )
)