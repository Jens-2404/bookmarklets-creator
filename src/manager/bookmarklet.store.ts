import { useEffect, useState } from 'react'
import {
  deleteBookmarklet,
  loadBookmarklets,
  saveBookmarklet,
  saveBookmarklets,
} from '../storage/indexeddb'
import type { Bookmarklet } from '../types/Bookmarklet'

const seedBookmarklets: Bookmarklet[] = [
  {
    id: 'seed-1',
    name: 'Highlight Headings',
    description: 'Outlines all headings on the page.',
    tags: ['dom', 'debug'],
    sourceCode: 'document.querySelectorAll("h1,h2,h3").forEach(el => el.style.outline = "2px solid #f97316")',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export function useBookmarklets() {
  const [items, setItems] = useState<Bookmarklet[]>([])

  useEffect(() => {
    let active = true
    loadBookmarklets()
      .then((loaded) => {
        if (!active) {
          return
        }
        if (loaded.length === 0) {
          setItems(seedBookmarklets)
          void saveBookmarklets(seedBookmarklets)
          return
        }
        setItems(loaded)
      })
      .catch(() => {
        if (active) {
          setItems(seedBookmarklets)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const addBookmarklet = (bookmarklet: Bookmarklet) => {
    setItems((current) => [bookmarklet, ...current])
    void saveBookmarklet(bookmarklet)
  }

  return {
    items,
    addBookmarklet,
    updateBookmarklet: (bookmarklet: Bookmarklet) => {
      setItems((current) =>
        current.map((item) => (item.id === bookmarklet.id ? bookmarklet : item)),
      )
      void saveBookmarklet(bookmarklet)
    },
    removeBookmarklet: (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id))
      void deleteBookmarklet(id)
    },
  }
}
