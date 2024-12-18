'use client'

import { useState, useEffect } from 'react'
import AddWebsite from './components/AddWebsite'
import WebsiteList from './components/WebsiteList'
import { Website } from '@/lib/db'
import { getWebsitesAction } from './actions'

export default function Home() {
    const [websites, setWebsites] = useState<Website[]>([])

    useEffect(() => {
        // Load websites when the component mounts
        const loadWebsites = async () => {
            try {
                const loadedWebsites = await getWebsitesAction();
                setWebsites(loadedWebsites);
            } catch (error) {
                console.error('Failed to load websites:', error);
            }
        };
        
        loadWebsites();
    }, []);

    const handleWebsiteAdded = (website: Website) => {
        setWebsites(prevWebsites => [...prevWebsites, website])
    }

    const handleWebsitesLoaded = (loadedWebsites: Website[]) => {
        setWebsites(loadedWebsites)
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">SSL Certificate Tracker</h1>
            <AddWebsite onWebsiteAdded={handleWebsiteAdded} />
            <WebsiteList websites={websites} onWebsitesLoaded={handleWebsitesLoaded} />
        </div>
    )
}

