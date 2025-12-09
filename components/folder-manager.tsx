"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FolderPlus, Folder, Edit2, Trash2, Check, X } from "lucide-react"
import { createFolder, updateFolder, deleteFolder, type Folder as FolderType } from "@/lib/contract-store"

interface FolderManagerProps {
  folders: FolderType[]
  onFoldersChange: (folders: FolderType[]) => void
  selectedFolder: string | null
  onSelectFolder: (folderId: string | null) => void
}

const FOLDER_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export function FolderManager({ folders, onFoldersChange, selectedFolder, onSelectFolder }: FolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    const folder = await createFolder(newFolderName, undefined, newFolderColor)
    if (folder) {
      onFoldersChange([...folders, folder])
      setNewFolderName("")
      setIsCreating(false)
    }
  }

  const handleUpdateFolder = async (id: string) => {
    if (!editName.trim()) return

    const updated = await updateFolder(id, { name: editName })
    if (updated) {
      onFoldersChange(folders.map((f) => (f.id === id ? updated : f)))
      setEditingFolder(null)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (confirm("Delete this folder? Files will be moved to 'No Folder'.")) {
      const success = await deleteFolder(id)
      if (success) {
        onFoldersChange(folders.filter((f) => f.id !== id))
        if (selectedFolder === id) {
          onSelectFolder(null)
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Folders</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>Organize your contracts and files into folders</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newFolderColor === color ? "scale-110 ring-2 ring-offset-2 ring-foreground" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolderColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        <Button
          variant={selectedFolder === null ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => onSelectFolder(null)}
        >
          <Folder className="w-4 h-4 mr-2" />
          All Files
        </Button>

        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center">
            {editingFolder === folder.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateFolder(folder.id)}>
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingFolder(null)}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                  {folder.name}
                </Button>
                <div className="hidden group-hover:flex items-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingFolder(folder.id)
                      setEditName(folder.name)
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
