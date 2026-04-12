"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  altText: string;
}

export default function ImageGallery({ images, altText }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images.slice(0, 6);

  if (displayImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* 메인 이미지 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-border/30">
        <Image
          src={displayImages[selectedIndex]}
          alt={`${altText} ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, 512px"
          className="object-cover"
          unoptimized
        />
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* 썸네일 그리드 */}
      {displayImages.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {displayImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[8px] transition-opacity ${
                i === selectedIndex
                  ? "ring-2 ring-accent"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt={`${altText} 썸네일 ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
