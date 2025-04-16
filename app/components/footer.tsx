import Link from "next/link"
/*
- Store link
- Logo home link
- Coding structure that supports dynamic links (pull potential static links from CDN) and dynamically generate those links.
Links will be flagged active 
- Conditional Sign In / Account button and link.
*/
export const Footer = (props) => {
    return (
        <footer>
            <nav>
                <Link href="/explore">[Logo]</Link>
                <Link href="/about">About</Link>
                <Link href="/support">Support</Link>
            </nav>
        </footer>
    )
}