import { Slot } from '@radix-ui/react-slot'
import { PropsWithChildren, type ReactNode } from 'react'

export type TextFieldProps = PropsWithChildren<{
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    placeholder?: string;
    type?: string;
}>

export const TextField = ({ leftIcon, placeholder, type = "text", ...props}: TextFieldProps) => {
    return (
        <>  
         {leftIcon && (
            <Slot className='pr-2' id='left'>
                {leftIcon}
            </Slot>
            )}
        <input placeholder={placeholder} type={type} className='focus:outline-none placeholder:font-bold text-white text-lg' />
        </>
    )
}


