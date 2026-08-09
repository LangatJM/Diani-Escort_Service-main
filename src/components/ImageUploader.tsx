import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { uploadCompanionImage } from '@/lib/supabase';

type Props = {
  label: string;
  // The currently selected/uploaded image URLs (primary image or gallery).
  images: (string | null)[];
  // Called when the admin removes an image at the given index.
  onRemove: (index: number) => void;
  // Called for each successfully uploaded image URL.
  onUpload: (url: string) => void;
  // Optional: whether this is the primary image (single) vs gallery (multiple).
  multiple?: boolean;
  // Optional: a hint text to show in the drop zone.
  hint?: string;
};

export function ImageUploader({ label, images, onRemove, onUpload, multiple = false, hint }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    const list = Array.from(files);
    // Only let the primary uploader accept a single image; gallery accepts many.
    const toUpload = multiple ? list.slice(0, 8) : [list[0]];

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5 MB.');
        continue;
      }
      try {
        const url = await uploadCompanionImage(file, multiple ? 'gallery' : 'portrait');
        if (url) onUpload(url);
        else setError('Upload failed. Check your storage bucket and permissions.');
      } catch {
        setError('Upload failed. Please try again.');
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const count = images.filter(Boolean).length;

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-white/55">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging ? 'border-ocean-400 bg-ocean-500/10' : 'border-white/15 bg-white/[0.02] hover:border-ocean-300/50'
        }`}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-ocean-300" />
        ) : (
          <UploadCloud size={22} className="text-ocean-300" />
        )}
        <p className="mt-2 text-xs font-semibold text-white/70">
          {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
        </p>
        <p className="mt-1 text-[11px] text-white/40">
          {hint || (multiple ? 'Add up to 8 gallery images' : 'Set the main profile photo')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {count > 0 && (
        <div className={`mt-3 grid gap-2 ${multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {images.map((url, i) =>
            url ? (
              <div key={i} className="group relative overflow-hidden rounded-lg border border-white/10">
                <img src={url} alt="" className="aspect-square h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  title="Remove image"
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-ocean-950/80 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-coral-500 hover:text-white"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : null
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-coral-400">{error}</p>}
    </div>
  );
}
