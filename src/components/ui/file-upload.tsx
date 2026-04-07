import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onFilesChange: (files: File[]) => void
  className?: string
}

function FileUpload({
  accept,
  multiple = false,
  onFilesChange,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    onFilesChange(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesChange(Array.from(e.target.files))
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e5edf5] bg-[#ffffff] p-8 cursor-pointer transition-colors hover:border-[#533afd] hover:bg-[#f4f7ff]",
        isDragging && "border-[#533afd] bg-[#f4f7ff]",
        className
      )}
    >
      <Upload className="h-8 w-8 text-[#64748d] mb-3" />
      <p className="text-sm font-medium text-[#061b31]">
        Drop files here or click to upload
      </p>
      {accept && (
        <p className="text-xs text-[#64748d] mt-1">Accepted: {accept}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

export { FileUpload }

