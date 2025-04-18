import { Button as HeadlessButton, type ButtonProps as HeadlessButtonProps } from '@headlessui/react'

export type ButtonProps = {
    type?: "submit" | "reset" | "button" | undefined;
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    kind: 'primary' | 'success' | 'warning' | 'info'
    children: string;
} & HeadlessButtonProps

export const Button = ({ type, onClick, kind, children }: ButtonProps) => {
    const buttonColor = {
        primary: { inactive: 'bg-red-600', active: 'bg-red-500' },
        success: { inactive: 'bg-green-600', active: 'bg-green-500' },
        warning: { inactive: 'bg-yellow-600', active: 'bg-yellow-500' },
        info: { inactive: 'bg-white', active: 'bg-gray-600' }
    }

    return (
        <HeadlessButton
            type={type}
            onClick={onClick}
            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold ${buttonColor[kind].inactive} text-white shadow-xs hover:${buttonColor[kind].active} sm:ml-3 sm:w-auto hover:cursor-pointer`}
        >
            {children}
        </HeadlessButton>
    )
}