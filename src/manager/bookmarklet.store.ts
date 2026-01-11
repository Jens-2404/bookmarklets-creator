import { useEffect, useState } from 'react'
import {
  clearBookmarklets,
  deleteBookmarklet,
  loadBookmarklets,
  saveBookmarklet,
  saveBookmarklets,
} from '../storage/indexeddb'
import type { Bookmarklet } from '../types/Bookmarklet'

const createSeedBookmarklets = () => [
  {
    id: 'seed-1',
    name: 'Highlight Headings',
    description: 'Outlines all headings on the page.',
    tags: ['dom', 'debug'],
    sourceCode:
      'document.querySelectorAll("h1,h2,h3").forEach(el => el.style.outline = "2px solid #f97316")',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-2',
    name: 'Copy Page Title',
    description: 'Copies the current page title to the clipboard.',
    tags: ['productivity', 'copy'],
    sourceCode:
      'navigator.clipboard.writeText(document.title).then(() => console.log("Title copied"))',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-3',
    name: 'Count Links',
    description: 'Logs how many links are on the page.',
    tags: ['seo', 'analysis'],
    sourceCode: 'console.log("Links:", document.querySelectorAll("a").length)',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-4',
    name: 'List Image Alts',
    description: 'Shows all image alt texts in the console.',
    tags: ['seo', 'content'],
    sourceCode:
      'console.log(Array.from(document.images).map(img => img.alt || "(missing)"))',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-5',
    name: 'Highlight External Links',
    description: 'Highlights external links with a red outline.',
    tags: ['seo', 'dom'],
    sourceCode:
      'document.querySelectorAll("a[href^=\\"http\\"]").forEach(a => { if (a.hostname !== location.hostname) a.style.outline = "2px solid #ef4444" })',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-6',
    name: 'Remove Fixed Headers',
    description: 'Hides fixed headers to unclutter the view.',
    tags: ['ux', 'cleanup'],
    sourceCode:
      'document.querySelectorAll("*").forEach(el => { const s = getComputedStyle(el); if (s.position === "fixed" && parseInt(s.top) === 0) el.style.display = "none" })',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-7',
    name: 'Show Meta Tags',
    description: 'Prints meta name and content pairs.',
    tags: ['seo', 'analysis'],
    sourceCode:
      'console.log(Array.from(document.querySelectorAll("meta[name]")).map(m => `${m.name}: ${m.content}`))',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-8',
    name: 'Extract Headings',
    description: 'Copies all headings (h1-h3) to the clipboard.',
    tags: ['content', 'copy'],
    sourceCode:
      'const text = Array.from(document.querySelectorAll("h1,h2,h3")).map(h => h.textContent?.trim()).filter(Boolean).join("\\n"); navigator.clipboard.writeText(text)',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-9',
    name: 'Toggle Grayscale',
    description: 'Toggles a grayscale filter on the page.',
    tags: ['debug', 'visual'],
    sourceCode:
      'const html = document.documentElement; html.style.filter = html.style.filter ? "" : "grayscale(100%)"',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-10',
    name: 'Outline Images',
    description: 'Adds a blue outline to all images.',
    tags: ['dom', 'visual'],
    sourceCode:
      'document.querySelectorAll("img").forEach(img => img.style.outline = "2px solid #3b82f6")',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-11',
    name: 'Show Page URL',
    description: 'Displays the current URL in the console.',
    tags: ['debug', 'info'],
    sourceCode: 'console.log("URL:", location.href)',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-12',
    name: 'Remove Empty Paragraphs',
    description: 'Hides empty paragraphs on the page.',
    tags: ['cleanup', 'dom'],
    sourceCode:
      'document.querySelectorAll("p").forEach(p => { if (!p.textContent?.trim()) p.style.display = "none" })',
    generatedCode: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] satisfies Bookmarklet[]

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
          const seeds = createSeedBookmarklets()
          setItems(seeds)
          void saveBookmarklets(seeds)
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
    resetLibrary: async () => {
      const seeds = createSeedBookmarklets()
      await clearBookmarklets()
      setItems(seeds)
      await saveBookmarklets(seeds)
    },
  }
}
