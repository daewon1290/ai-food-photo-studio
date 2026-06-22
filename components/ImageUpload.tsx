'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  onUpload: (dataUrl: string, file: File) => void;
  currentImage: string | null;
}

export default function ImageUpload({ onUpload, currentImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onUpload(e.target.result as string, file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (currentImage) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative w-full aspect-square max-h-64 rounded-xl overflow-hidden mb-3">
          <Image src={currentImage} alt="업로드된 사진" fill className="object-cover" />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          다른 사진으로 바꾸기
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition-all
        ${isDragging
          ? 'border-orange-400 bg-orange-50 scale-[1.01]'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'}
      `}
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <p className="font-bold text-gray-800 mb-1">음식 사진을 올려주세요</p>
      <p className="text-sm text-gray-400 mb-3">클릭하거나 사진을 끌어다 놓으세요</p>
      <span className="inline-block text-xs text-gray-300 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
        JPG · PNG · WEBP
      </span>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
