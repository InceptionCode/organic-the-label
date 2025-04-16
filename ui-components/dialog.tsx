'use client'

import { ReactNode, useState } from 'react'

import { Dialog as HeadlessDialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export type DialogProps = React.PropsWithChildren<{ 
  isOpen?: boolean;
  trigger?: ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
  dialogTitle?: ReactNode;
  titleIcon?: ReactNode;
  confirmText?: string;
  cancelText?: string;
} & typeof HeadlessDialog>

const Dialog = ({ 
  children, 
  onClose, 
  onConfirm,
  titleIcon, 
  dialogTitle,
  confirmText,
  cancelText = "Cancel",
  isOpen = false, 
}: DialogProps) => {
  const [open, setOpen] = useState(isOpen)

  const handleClose = (isOpen: boolean = false) => {
    setOpen(isOpen)
    onClose?.()
  }
  
  return (
    <HeadlessDialog open={open} onClose={setOpen} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="absolute top-0 right-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
          <button
              type="button"
              onClick={() => handleClose()}
              className="relative rounded-md text-white hover:cursor-pointer hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden"
          >
              <span className="absolute -inset-2.5" />
              <span className="sr-only">Close panel</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="flex min-h-full justify-around p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden lg:min-w-6xl rounded-lg text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            {dialogTitle && (
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                 {titleIcon}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h2" className="text-2xl font-bold text-gray-900">
                    {dialogTitle}
                  </DialogTitle>
                </div>
              </div>
            </div>
            )}
            {children}
            {confirmText && (
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={() => onConfirm?.()}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto hover:cursor-pointer"
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={() => handleClose()}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:cursor-pointer hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                {cancelText}
              </button>
            </div>
            )} 
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  )
}

Dialog.displayName = 'Dialog'

export default Dialog