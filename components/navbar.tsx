"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Film, BarChart2, Calendar, Tv, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const menuVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const menuItemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-white/10 py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                <Image src="/images/logo.png" alt="CubeSports Logo" width={40} height={40} className="object-cover" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
                CubeSports
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-1">
              <Link href="/live">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-white/5 hover:text-primary"
                >
                  <Tv className="h-4 w-4" />
                  <span>Live Sports</span>
                </Button>
              </Link>
              <Link href="/standings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-white/5 hover:text-primary"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Standings</span>
                </Button>
              </Link>
              <Link href="/matches">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-white/5 hover:text-primary"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Matches</span>
                </Button>
              </Link>
              <Link href="/news">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-white/5 hover:text-primary"
                >
                  <Newspaper className="h-4 w-4" />
                  <span>News</span>
                </Button>
              </Link>
            </nav>
            <ModeToggle />
          </div>

          <div className="md:hidden flex items-center">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="ml-2">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md md:hidden"
          >
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <motion.div variants={menuItemVariants}>
                <Link href="/" onClick={toggleMenu} className="flex items-center space-x-2">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary/50 glow-border">
                    <Image
                      src="/images/logo.png"
                      alt="CubeSports Logo"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
                    CubeSports
                  </span>
                </Link>
              </motion.div>

              <nav className="flex flex-col items-center space-y-6">
                <motion.div variants={menuItemVariants}>
                  <Link href="/live" onClick={toggleMenu}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="flex items-center gap-2 hover:text-primary w-48 justify-start"
                    >
                      <Tv className="h-5 w-5" />
                      <span>Live Sports</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={menuItemVariants}>
                  <Link href="/standings" onClick={toggleMenu}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="flex items-center gap-2 hover:text-primary w-48 justify-start"
                    >
                      <BarChart2 className="h-5 w-5" />
                      <span>Standings</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={menuItemVariants}>
                  <Link href="/matches" onClick={toggleMenu}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="flex items-center gap-2 hover:text-primary w-48 justify-start"
                    >
                      <Calendar className="h-5 w-5" />
                      <span>Matches</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={menuItemVariants}>
                  <Link href="/news" onClick={toggleMenu}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="flex items-center gap-2 hover:text-primary w-48 justify-start"
                    >
                      <Newspaper className="h-5 w-5" />
                      <span>News</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={menuItemVariants}>
                  <Link href="https://thecub4.netlify.app" target="_blank" onClick={toggleMenu}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="flex items-center gap-2 hover:text-primary w-48 justify-start"
                    >
                      <Film className="h-5 w-5" />
                      <span>Watch Movies</span>
                    </Button>
                  </Link>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
