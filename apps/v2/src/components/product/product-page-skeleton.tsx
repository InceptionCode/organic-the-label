import { cn } from '~/ui/cn'

const pulse = 'animate-pulse bg-surface-1 motion-reduce:animate-none'

/** Flat shapes in the product layout: artwork + tracklist left, info and purchase right. */
export function ProductPageSkeleton() {
  return (
    <div className="content-container pb-14 pt-6 md:pt-10 lg:pb-24" role="status" aria-label="Loading product">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <div className="lg:col-span-7">
          <div className={cn('aspect-square w-full', pulse)} />
          <div className={cn('mt-12 hidden h-10 w-40 lg:block', pulse)} />
          <div className={cn('mt-6 hidden h-14 w-full lg:block', pulse)} />
        </div>
        <div className="flex flex-col lg:col-span-5">
          <div className={cn('h-3 w-16', pulse)} />
          <div className={cn('mt-4 h-14 w-4/5', pulse)} />
          <div className={cn('mt-5 h-7 w-24', pulse)} />
          <div className={cn('mt-6 h-16 w-full', pulse)} />
          <div className={cn('mt-8 h-14 w-full', pulse)} />
          <div className={cn('mt-6 h-4 w-3/4', pulse)} />
        </div>
      </div>
      <span className="sr-only">Loading product</span>
    </div>
  )
}
