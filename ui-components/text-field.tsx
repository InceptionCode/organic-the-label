import { InputProps } from '@headlessui/react';
import { Slot } from '@radix-ui/react-slot'
import { PropsWithChildren, type ReactNode } from 'react'

export type TextFieldProps = PropsWithChildren<{
    label?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    placeholder?: string;
    type?: string;
    name?: string;
} & InputProps>

export const TextField = ({ name, label, leftIcon, placeholder, type = "text"}: TextFieldProps) => {
    return (
        <>  
            {leftIcon && (
                <Slot className='pr-2' id='left'>
                    {leftIcon}
                </Slot>
                )}
            {label && <label htmlFor={name} className='block text-sm/6 font-medium text-gray-900'>{label}</label>}
            <input name={name} placeholder={placeholder} type={type} className='focus:outline-none placeholder:font-bold text-white text-lg' />
        </>
    )
}


