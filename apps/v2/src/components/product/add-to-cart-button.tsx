import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCartDrawer } from '~/components/shell/cart-drawer-provider'
import { addToCartMutation, isFailedAdd } from '~/queries/cart'
import { Button, type ButtonSize, type ButtonVariant } from '~/ui/button'
import { cn } from '~/ui/cn'

type AddToCartButtonProps = {
  variantId: string | null
  quantity?: number
  openDrawer?: boolean
  disabled?: boolean
  /** Appended to the accessible name on cards ("Add to cart: Wave Pack") so buttons are distinguishable. */
  productName?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function AddToCartButton({ variantId, quantity = 1, openDrawer = false, disabled, productName, variant, size, className }: AddToCartButtonProps) {
  const queryClient = useQueryClient()
  const { openCart, preloadCart } = useCartDrawer()
  const mutation = useMutation(addToCartMutation(queryClient))

  const onClick = () => {
    if (!variantId || mutation.isPending) return
    if (openDrawer) preloadCart()
    mutation.mutate(
      { variantId, quantity },
      {
        onSuccess: (result) => {
          if (openDrawer && !isFailedAdd(result)) openCart()
        },
      },
    )
  }

  const failed = mutation.isError || (mutation.isSuccess && isFailedAdd(mutation.data))
  const label = mutation.isPending ? 'Adding...' : failed ? 'Try again' : 'Add to cart'

  return (
    <>
      <Button
        data-testid="add-to-cart-btn"
        variant={variant}
        size={size}
        onClick={onClick}
        // Not `disabled` while pending: a disabled button drops focus, and the drawer must return focus here on close.
        disabled={disabled || !variantId}
        aria-disabled={mutation.isPending || undefined}
        className={cn('flex-1', mutation.isPending && 'cursor-progress opacity-70', className)}
      >
        {label}
        {productName ? <span className="sr-only">: {productName}</span> : null}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {mutation.isSuccess && !failed ? 'Added to cart.' : failed ? 'Could not add to cart. Please try again.' : ''}
      </span>
    </>
  )
}
