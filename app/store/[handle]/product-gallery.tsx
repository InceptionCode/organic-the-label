import { Product } from '@/lib/schemas';
import Image from 'next/image';

type ProductGalleryProps = {
  title: string;
  featuredImage: Product['image'] | null | undefined;
  images?: Product['image'][];
};

export function ProductGallery({ title, featuredImage, images = [] }: ProductGalleryProps) {
  const allImages = featuredImage ? [featuredImage, ...images.filter((img) => img?.url !== featuredImage?.url)] : images;
  const mainImage = allImages[0];

  if (!mainImage?.url) {
    return (
      <div className="relative w-full aspect-[4/3] bg-surface-2 rounded-lg overflow-hidden flex items-center justify-center">
        <span className="text-muted text-body-m">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-surface-2 rounded-lg overflow-hidden">
        <Image
          src={mainImage.url}
          alt={mainImage.altText ?? title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.slice(0, 4).map((img, i) => (
            img?.url && (
              <div key={i} className="relative aspect-square bg-surface-2 rounded-md overflow-hidden">
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
