'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  onUpload: (dataUrl: string) => void;
  currentImage: string | null;
}

export default function ImageUpload({ onUpload, currentImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onUpload(e.target.result as string);
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
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative w-full aspect-square max-h-64 rounded-lg overflow-hidden mb-3">
          <Image src={currentImage} alt="업로드된 사진" fill className="object-cover" />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
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
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-white hover:border-orange-300 hover:bg-orange-50'}
      `}
    >
      <div className="text-4xl mb-3">📷</div>
      <p className="font-semibold text-gray-700 mb-1">음식 사진을 업로드하세요</p>
      <p className="text-sm text-gray-400">클릭하거나 사진을 끌어다 놓으세요</p>
      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP 지원</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
