"use client"

import { Navbar } from "@/ui-components/navbar"
import { usePathname } from "next/navigation"

/*
- Store link
- Logo home link
- Coding structure that supports dynamic links (pull potential static links from CDN) and dynamically generate those links.
Links will be flagged active 
- Conditional Sign In / Account button and link.
*/
export const Header = (props) => {
    const pathname = usePathname()
    const isCurrent = (name: string) => pathname === `/${name}`

    const navLinks = [
        { name: 'Explore', href: '/', current: isCurrent('') }, // current value will come from props.
        { name: 'Store', href: '/store', current: isCurrent('store') },
        // dynamically include "active" links from CDN/server
      ]
  
    return (
        <header>
          <Navbar navLinks={navLinks} /> 
        </header>
    )
}