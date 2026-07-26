'use client'
import { useEffect } from 'react'

export default function DmLayout({ children }) {
    useEffect(() => {
        const html = document.documentElement
        const body = document.body
        const footer = document.getElementById('site-footer')
        html.style.overflow = 'hidden'
        html.style.height = '100%'
        body.style.overflow = 'hidden'
        body.style.height = '100%'
        if (footer) footer.style.display = 'none'
        return () => {
            html.style.overflow = ''
            html.style.height = ''
            body.style.overflow = ''
            body.style.height = ''
            if (footer) footer.style.display = ''
        }
    }, [])
    return <>{children}</>
}