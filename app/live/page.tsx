"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Star,
  ArrowLeft,
  Zap,
  Clock,
  Search,
  X,
  TrendingUp,
  Trophy,
  Maximize2,
  Volume2,
  VolumeX,
  Heart,
  MessageSquare,
  Users,
  AlertCircle,
  Info,
  Loader2,
  Grid3X3,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import ParticlesBackground from "@/components/particles-background"

interface Sport {
  id: string
  name: string
}

interface Team {
  name: string
  badge: string
}

interface Teams {
  home: Team
  away: Team
}

interface Source {
  id: string
  source: string
  hd: boolean
  embedUrl: string
}

interface Match {
  id: string
  title: string
  category: string
  date: string
  poster: string
  teams: Teams
  sources: {
    source: string
    id: string
  }[]
  viewerCount?: number
}

interface GroupedMatches {
  [category: string]: Match[]
}

export default function LiveSports() {
  const [sports, setSports] = useState<Sport[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [groupedMatches, setGroupedMatches] = useState<GroupedMatches>({})
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [matchType, setMatchType] = useState("live")
  const [showPopular, setShowPopular] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingStreams, setLoadingStreams] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([])
  const [showFavorites, setShowFavorites] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedStream, setSelectedStream] = useState<Source | null>(null)
  const [availableStreams, setAvailableStreams] = useState<Source[]>([])
  const [streamError, setStreamError] = useState<string | null>(null)
  const [relatedMatches, setRelatedMatches] = useState<Match[]>([])
  const [chatMessages, setChatMessages] = useState<{ user: string; message: string; time: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  // Sport category mappings
  const sportCategories = {
    football: {
      name: "Football",
      icon: "⚽",
      categories: ["soccer", "football", "epl", "laliga", "seriea", "bundesliga", "ligue1"],
      color: "from-green-500 to-emerald-600",
    },
    basketball: {
      name: "Basketball",
      icon: "🏀",
      categories: ["basketball", "nba", "euroleague"],
      color: "from-orange-500 to-red-600",
    },
    tennis: {
      name: "Tennis",
      icon: "🎾",
      categories: ["tennis", "atp", "wta"],
      color: "from-yellow-500 to-orange-600",
    },
    baseball: {
      name: "Baseball",
      icon: "⚾",
      categories: ["baseball", "mlb"],
      color: "from-blue-500 to-indigo-600",
    },
    hockey: {
      name: "Hockey",
      icon: "🏒",
      categories: ["hockey", "nhl"],
      color: "from-cyan-500 to-blue-600",
    },
    americanfootball: {
      name: "American Football",
      icon: "🏈",
      categories: ["nfl", "americanfootball"],
      color: "from-purple-500 to-pink-600",
    },
    motorsport: {
      name: "Motorsport",
      icon: "🏎️",
      categories: ["f1", "motorsport", "racing"],
      color: "from-red-500 to-pink-600",
    },
    other: {
      name: "Other Sports",
      icon: "🏆",
      categories: [],
      color: "from-gray-500 to-slate-600",
    },
  }

  useEffect(() => {
    const init = async () => {
      await loadSports()
      await loadMatches()
    }

    init()

    // Load favorite teams from localStorage
    const savedFavorites = localStorage.getItem("favoriteTeams")
    if (savedFavorites) {
      setFavoriteTeams(JSON.parse(savedFavorites))
    }

    // Generate mock chat messages
    generateMockChatMessages()
  }, [])

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    groupMatchesByCategory()
  }, [matches, searchQuery, showFavorites])

  const loadSports = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://streamed.su/api/sports")
      if (!response.ok) throw new Error("Failed to fetch sports")
      const data = await response.json()
      setSports(data)
    } catch (error) {
      console.error("Error loading sports:", error)
      setSports([])
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async () => {
    let endpoint = ""
    switch (matchType) {
      case "live":
        endpoint = showPopular ? "/api/matches/live/popular" : "/api/matches/live"
        break
      case "today":
        endpoint = showPopular ? "/api/matches/all-today/popular" : "/api/matches/all-today"
        break
      case "all":
        endpoint = showPopular ? "/api/matches/all/popular" : "/api/matches/all"
        break
      default:
        endpoint = "/api/matches/live"
        break
    }

    try {
      setLoading(true)
      const response = await fetch(`https://streamed.su${endpoint}`)
      if (!response.ok) throw new Error(`Failed to fetch matches: ${response.statusText}`)
      const data = await response.json()

      // Add random viewer counts to matches
      const matchesWithViewers = data.map((match: Match) => ({
        ...match,
        viewerCount: Math.floor(Math.random() * 10000) + 500,
      }))

      setMatches(matchesWithViewers)

      // Set featured matches (top 3 by viewer count)
      const sortedByViewers = [...matchesWithViewers].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
      setFeaturedMatches(sortedByViewers.slice(0, 3))
    } catch (error) {
      console.error("Error loading matches:", error)
      setMatches([])
      setGroupedMatches({})
      setFeaturedMatches([])
    } finally {
      setLoading(false)
    }
  }

  const groupMatchesByCategory = () => {
    let filteredMatches = matches

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filteredMatches = filteredMatches.filter(
        (match) =>
          match.title?.toLowerCase().includes(lowerQuery) ||
          match.teams?.home?.name?.toLowerCase().includes(lowerQuery) ||
          match.teams?.away?.name?.toLowerCase().includes(lowerQuery) ||
          match.category?.toLowerCase().includes(lowerQuery),
      )
    }

    // Filter by favorites if showFavorites is true
    if (showFavorites && favoriteTeams.length > 0) {
      filteredMatches = filteredMatches.filter(
        (match) => favoriteTeams.includes(match.teams?.home?.name) || favoriteTeams.includes(match.teams?.away?.name),
      )
    }

    // Group matches by sport category
    const grouped: GroupedMatches = {}

    filteredMatches.forEach((match) => {
      let sportKey = "other"

      // Find which sport category this match belongs to
      for (const [key, sport] of Object.entries(sportCategories)) {
        if (sport.categories.includes(match.category.toLowerCase())) {
          sportKey = key
          break
        }
      }

      if (!grouped[sportKey]) {
        grouped[sportKey] = []
      }
      grouped[sportKey].push(match)
    })

    // Sort matches within each category by viewer count
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
    })

    setGroupedMatches(grouped)
  }

  const getCategoryDisplayName = (categoryKey: string) => {
    return sportCategories[categoryKey as keyof typeof sportCategories]?.name || "Other Sports"
  }

  const getCategoryIcon = (categoryKey: string) => {
    return sportCategories[categoryKey as keyof typeof sportCategories]?.icon || "🏆"
  }

  const getCategoryColor = (categoryKey: string) => {
    return sportCategories[categoryKey as keyof typeof sportCategories]?.color || "from-gray-500 to-slate-600"
  }

  const getVisibleCategories = () => {
    if (selectedCategory === "all") {
      return Object.keys(groupedMatches).filter((key) => groupedMatches[key].length > 0)
    }
    return [selectedCategory].filter((key) => groupedMatches[key]?.length > 0)
  }

  const togglePopular = () => {
    setShowPopular(!showPopular)
    loadMatches()
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const openStream = async (match: Match) => {
    if (showModal) {
      closeModal()
    }

    setSelectedMatch(match)
    setSelectedStream(null)
    setAvailableStreams([])
    setStreamError(null)
    setShowModal(true)
    setLoadingStreams(true)
    setChatOpen(false)

    try {
      // Find related matches (same teams or category)
      const related = matches
        .filter(
          (m) =>
            m.id !== match.id &&
            (m.category === match.category ||
              m.teams?.home?.name === match.teams?.home?.name ||
              m.teams?.home?.name === match.teams?.away?.name ||
              m.teams?.away?.name === match.teams?.home?.name ||
              m.teams?.away?.name === match.teams?.away?.name),
        )
        .slice(0, 4)
      setRelatedMatches(related)

      // Fetch streams
      const streams: Source[] = []
      for (const source of match.sources) {
        try {
          const response = await fetch(`https://streamed.su/api/stream/${source.source}/${source.id}`)
          if (response.ok) {
            const sourceStreams = await response.json()
            streams.push(...sourceStreams)
          }
        } catch (error) {
          console.error(`Error loading stream for ${source.source}:`, error)
        }
      }

      setAvailableStreams(streams)
      if (streams.length > 0) {
        setSelectedStream(streams[0])
      } else {
        setStreamError("No streams available for this match. Please try another match.")
      }
    } catch (error) {
      console.error("Error loading streams:", error)
      setStreamError("Failed to load streams. Please try again later.")
    } finally {
      setLoadingStreams(false)
    }
  }

  const selectStream = (stream: Source) => {
    setSelectedStream(stream)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedStream(null)
    setSelectedMatch(null)
    setAvailableStreams([])
    setStreamError(null)
    setIsFullscreen(false)
    setIsMuted(false)
    setChatOpen(false)
  }

  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleChat = () => {
    setChatOpen(!chatOpen)
  }

  const toggleFavoriteTeam = (teamName: string) => {
    let newFavorites
    if (favoriteTeams.includes(teamName)) {
      newFavorites = favoriteTeams.filter((name) => name !== teamName)
    } else {
      newFavorites = [...favoriteTeams, teamName]
    }
    setFavoriteTeams(newFavorites)
    localStorage.setItem("favoriteTeams", JSON.stringify(newFavorites))
  }

  const toggleFavoritesFilter = () => {
    setShowFavorites(!showFavorites)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newMessage = {
      user: "You",
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setChatMessages([...chatMessages, newMessage])
    setChatInput("")

    // Simulate a response after a short delay
    setTimeout(() => {
      const responses = [
        "Great match so far!",
        "What a goal!",
        "The referee is making some questionable calls today",
        "This team is playing so well",
        "Can't believe that missed opportunity",
        "Who do you think will win?",
        "This is such an exciting game!",
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      const randomNames = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Sam"]
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]

      const responseMessage = {
        user: randomName,
        message: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setChatMessages((prev) => [...prev, responseMessage])
    }, 1000)
  }

  const generateMockChatMessages = () => {
    const messages = [
      { user: "Alex", message: "This match is so exciting!", time: "14:23" },
      { user: "Jordan", message: "Did you see that save? Incredible!", time: "14:24" },
      { user: "Taylor", message: "I think they'll score soon", time: "14:26" },
      { user: "Casey", message: "The referee is making some questionable calls today", time: "14:28" },
      { user: "Morgan", message: "Who do you think will win?", time: "14:30" },
    ]
    setChatMessages(messages)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const renderMatchCard = (match: Match) => (
    <motion.div
      key={match.id}
      variants={item}
      whileHover={{ y: -5 }}
      className="match-card rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm"
    >
      <div className="relative">
        {match.poster && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url(https://streamed.su/api/images/proxy/${match.poster}.webp)`,
            }}
          />
        )}
      </div>
      <div className="p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-400 capitalize">{match.category}</span>
          <div className="flex items-center gap-2">
            {matchType === "live" ? (
              <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-xs">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(match.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            )}
            <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
              <Users className="h-3 w-3 mr-1" /> {formatViewerCount(match.viewerCount || 0)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          {match.teams && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                  <Image
                    src={
                      match.teams.home?.badge
                        ? `https://streamed.su/api/images/badge/${match.teams.home.badge}.webp`
                        : "/images/logo.png"
                    }
                    alt={match.teams.home?.name || "Home Team"}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{match.teams.home?.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavoriteTeam(match.teams.home?.name)
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteTeams.includes(match.teams.home?.name) ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold">VS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-end">
                  <span className="font-medium text-sm">{match.teams.away?.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavoriteTeam(match.teams.away?.name)
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteTeams.includes(match.teams.away?.name) ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                  <Image
                    src={
                      match.teams.away?.badge
                        ? `https://streamed.su/api/images/badge/${match.teams.away.badge}.webp`
                        : "/images/logo.png"
                    }
                    alt={match.teams.away?.name || "Away Team"}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => openStream(match)} className="premium-button w-full">
          <Zap className="h-4 w-4 mr-1" />
          Watch Stream
        </Button>
      </div>
    </motion.div>
  )

  return (
    <>
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="relative py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background/95 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <div className="flex items-center mb-6">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm" className="gap-1 hover:text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
                Live Sports
              </h1>
            </div>
            <p className="text-gray-300 mb-6">
              Watch premium quality live streams organized by sport categories. Select a match below to start watching.
            </p>
          </motion.div>

          {/* Featured Matches */}
          {featuredMatches.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary mr-2" />
                  Featured Matches
                </h2>
                <Badge variant="outline" className="bg-primary/20 border-primary/50">
                  <Users className="h-3 w-3 mr-1" /> Top Streams
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm cursor-pointer"
                    onClick={() => openStream(match)}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-30">
                      {match.poster && (
                        <Image
                          src={`https://streamed.su/api/images/proxy/${match.poster}.webp`}
                          alt={match.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    {/* Content Overlay */}
                    <div className="relative p-4 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-xs">
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE
                        </Badge>
                        <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                          <Users className="h-3 w-3 mr-1" /> {formatViewerCount(match.viewerCount || 0)} viewers
                        </Badge>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          {match.teams && (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                                  <Image
                                    src={
                                      match.teams.home?.badge
                                        ? `https://streamed.su/api/images/badge/${match.teams.home.badge}.webp`
                                        : "/images/logo.png"
                                    }
                                    alt={match.teams.home?.name || "Home Team"}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-medium">{match.teams.home?.name}</span>
                              </div>
                              <div className="text-center">
                                <span className="text-xl font-bold">VS</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{match.teams.away?.name}</span>
                                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                                  <Image
                                    src={
                                      match.teams.away?.badge
                                        ? `https://streamed.su/api/images/badge/${match.teams.away.badge}.webp`
                                        : "/images/logo.png"
                                    }
                                    alt={match.teams.away?.name || "Away Team"}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          className="premium-button w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            openStream(match)
                          }}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Watch Stream
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Controls */}
        <div className="glass-panel p-6 mb-8 rounded-xl border border-white/10">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full lg:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search matches, teams, or sports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-white/10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Sport Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px] bg-card/60 border-white/10">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {Object.entries(sportCategories).map(([key, sport]) => (
                    <SelectItem key={key} value={key}>
                      {sport.icon} {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Match Type */}
              <Select
                value={matchType}
                onValueChange={(value) => {
                  setMatchType(value)
                  loadMatches()
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-card/60 border-white/10">
                  <SelectValue placeholder="Live Matches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live Matches</SelectItem>
                  <SelectItem value="today">Today's Matches</SelectItem>
                  <SelectItem value="all">All Matches</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-white/10 rounded-lg bg-card/60">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Additional Filters */}
              <Button onClick={togglePopular} variant={showPopular ? "default" : "outline"} size="sm">
                <Star className="h-4 w-4 mr-2" />
                Popular
              </Button>

              <Button onClick={toggleFavoritesFilter} variant={showFavorites ? "default" : "outline"} size="sm">
                <Heart className={`h-4 w-4 mr-2 ${showFavorites ? "fill-current" : ""}`} />
                Favorites
              </Button>

              <Link href="/standings">
                <Button variant="outline" size="sm" className="gap-2 border-white/20 hover:border-primary/50">
                  <Trophy className="h-4 w-4" />
                  Standings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sports Categories */}
        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="match-card shimmer rounded-xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-4 w-4" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {getVisibleCategories().length > 0 ? (
              getVisibleCategories().map((categoryKey) => {
                const categoryMatches = groupedMatches[categoryKey]
                if (!categoryMatches || categoryMatches.length === 0) return null

                return (
                  <motion.div
                    key={categoryKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-r ${getCategoryColor(categoryKey)} flex items-center justify-center text-2xl`}
                        >
                          {getCategoryIcon(categoryKey)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{getCategoryDisplayName(categoryKey)}</h2>
                          <p className="text-gray-400">{categoryMatches.length} matches available</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/10 border-white/20">
                        {categoryMatches.length} matches
                      </Badge>
                    </div>

                    {/* Matches Grid */}
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className={`grid gap-6 ${
                        viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                      }`}
                    >
                      {categoryMatches.map((match) => renderMatchCard(match))}
                    </motion.div>
                  </motion.div>
                )
              })
            ) : (
              <div className="glass-panel p-12 text-center rounded-xl border border-white/10">
                <div className="text-gray-400 text-lg mb-2">No matches found</div>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchQuery
                    ? `No matches found for "${searchQuery}". Try adjusting your search or filters.`
                    : showFavorites
                      ? "No matches found for your favorite teams. Try adding more teams to favorites."
                      : "No matches available at the moment. Check back later for upcoming matches."}
                </p>
                {(searchQuery || showFavorites) && (
                  <div className="flex gap-2 justify-center mt-4">
                    {searchQuery && (
                      <Button variant="outline" onClick={clearSearch}>
                        Clear Search
                      </Button>
                    )}
                    {showFavorites && (
                      <Button variant="outline" onClick={toggleFavoritesFilter}>
                        Show All Matches
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stream Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-6xl p-0 bg-black/95 border-white/10 rounded-xl overflow-hidden">
            <div className="flex flex-col md:flex-row h-[80vh]">
              {/* Main Stream Area */}
              <div className={`flex-grow ${chatOpen ? "md:w-2/3" : "w-full"}`}>
                <div className="relative h-full">
                  {/* Stream Header */}
                  <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">{selectedMatch?.title || "Live Stream"}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="capitalize">{selectedMatch?.category}</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{formatViewerCount(selectedMatch?.viewerCount || 0)} viewers</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleChat} className="hover:bg-white/10">
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMute} className="hover:bg-white/10">
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hover:bg-white/10">
                          <Maximize2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={closeModal} className="hover:bg-white/10">
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stream Player */}
                  {loadingStreams ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-gray-400">Loading stream...</p>
                    </div>
                  ) : streamError ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-gray-400 mb-2">{streamError}</p>
                      <Button variant="outline" onClick={closeModal} className="mt-4">
                        Close
                      </Button>
                    </div>
                  ) : selectedStream ? (
                    <div ref={playerRef} className="h-full w-full bg-black">
                      <iframe
                        src={selectedStream.embedUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        loading="eager"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Info className="h-12 w-12 text-gray-500 mb-4" />
                      <p className="text-gray-400 mb-2">Select a stream source to start watching</p>
                    </div>
                  )}

                  {/* Stream Controls */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {availableStreams.map((source) => (
                        <Button
                          key={source.id}
                          onClick={() => selectStream(source)}
                          variant={selectedStream?.id === source.id ? "default" : "outline"}
                          size="sm"
                          className={`${
                            selectedStream?.id === source.id
                              ? "bg-primary hover:bg-primary/90"
                              : "hover:border-primary/50 hover:text-primary"
                          }`}
                        >
                          <span>{source.source}</span>
                          {source.hd && <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-sm">HD</span>}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Panel */}
              {chatOpen && (
                <div className="md:w-1/3 border-l border-white/10 flex flex-col h-full">
                  <div className="p-3 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-medium">Live Chat</h3>
                    <Button variant="ghost" size="icon" onClick={toggleChat} className="md:hidden">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 space-y-3">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {msg.user.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{msg.user}</span>
                            <span className="text-xs text-gray-400">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-300">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendChatMessage} className="p-3 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-white/5 border-white/10"
                      />
                      <Button type="submit" size="sm">
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Related Matches */}
            {relatedMatches.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <h3 className="font-medium mb-3">Related Matches</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {relatedMatches.map((match) => (
                    <div
                      key={match.id}
                      className="bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => openStream(match)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`${
                            new Date(match.date) <= new Date()
                              ? "bg-red-500/20 border-red-500/50"
                              : "bg-blue-500/20 border-blue-500/50"
                          } text-xs`}
                        >
                          {new Date(match.date) <= new Date() ? "LIVE" : "UPCOMING"}
                        </Badge>
                        <span className="text-xs text-gray-400 capitalize">{match.category}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="relative h-6 w-6 overflow-hidden rounded-full">
                            <Image
                              src={
                                match.teams?.home?.badge
                                  ? `https://streamed.su/api/images/badge/${match.teams.home.badge}.webp`
                                  : "/images/logo.png"
                              }
                              alt={match.teams?.home?.name || ""}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs truncate max-w-[60px]">{match.teams?.home?.name}</span>
                        </div>
                        <span className="text-xs">vs</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs truncate max-w-[60px]">{match.teams?.away?.name}</span>
                          <div className="relative h-6 w-6 overflow-hidden rounded-full">
                            <Image
                              src={
                                match.teams?.away?.badge
                                  ? `https://streamed.su/api/images/badge/${match.teams.away.badge}.webp`
                                  : "/images/logo.png"
                              }
                              alt={match.teams?.away?.name || ""}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
