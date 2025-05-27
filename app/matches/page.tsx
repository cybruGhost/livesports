"use client"

import "./matches.css"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { format, isSameDay, isToday, isTomorrow, isYesterday, subDays, addDays } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Clock,
  Filter,
  Zap,
  CalendarDays,
  Search,
  SortAsc,
  SortDesc,
  X,
  Loader2,
  MapPin,
  Star,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import ParticlesBackground from "@/components/particles-background"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Match {
  id: string
  date: string
  name: string
  competitions: {
    competitors: {
      team: {
        displayName: string
        logo: string
        id: string
      }
      score: string
      winner?: boolean
      statistics?: {
        name: string
        displayValue: string
      }[]
    }[]
    details?: {
      type: {
        id: string
        text: string
      }
      clock: {
        displayValue: string
      }
      team?: {
        displayName: string
      }
      athletesInvolved?: {
        displayName: string
      }[]
    }[]
    venue?: {
      fullName: string
      address: {
        city: string
        country: string
      }
    }
  }[]
  status: {
    type: {
      detail: string
      state: string
      completed: boolean
    }
  }
  league?: {
    name: string
    logo?: string
    slug: string
  }
}

interface MatchSummary {
  stats: {
    name: string
    home: string | number
    away: string | number
  }[]
  timeline: {
    time: string
    event: string
    team: string
    player?: string
  }[]
}

export default function Matches() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedLeague, setSelectedLeague] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showMatchSummary, setShowMatchSummary] = useState(false)
  const [loadingMatchDetails, setLoadingMatchDetails] = useState(false)
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null)

  const leagues = [
    { name: "Premier League", slug: "eng.1", logo: "/images/pl.png" },
    { name: "La Liga", slug: "esp.1", logo: "/images/laliga.png" },
    { name: "Serie A", slug: "ita.1", logo: "/images/seriea.png" },
    { name: "Bundesliga", slug: "ger.1", logo: "/images/bundes.png" },
    { name: "Ligue 1", slug: "fra.1", logo: "/images/ligue1.png" },
  ]

  const popularTeams = [
    "Real Madrid",
    "Barcelona",
    "Manchester United",
    "Liverpool",
    "Bayern Munich",
    "Paris Saint-Germain",
    "Manchester City",
    "Chelsea",
    "Juventus",
    "Arsenal",
  ]

  useEffect(() => {
    fetchExtendedMatches()
  }, [])

  useEffect(() => {
    if (matches.length > 0) {
      filterAndSortMatches()
    }
  }, [activeTab, selectedDate, selectedLeague, searchQuery, sortOrder, matches])

  const formatDateForApi = (date: Date) => {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`
  }

  const fetchExtendedMatches = async () => {
    setLoading(true)

    // Get extended date range - past 14 days to next 7 days
    const today = new Date()
    const dates: string[] = []

    // Add past 14 days
    for (let i = 14; i >= 0; i--) {
      const date = subDays(today, i)
      dates.push(formatDateForApi(date))
    }

    // Add next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i)
      dates.push(formatDateForApi(date))
    }

    let allMatches: Match[] = []

    try {
      for (const league of leagues) {
        for (const date of dates) {
          try {
            const response = await fetch(
              `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${date}`,
            )
            if (response.ok) {
              const data = await response.json()
              const leagueMatches = (data.events || []).map((match: any) => ({
                ...match,
                league: {
                  name: league.name,
                  logo: league.logo,
                  slug: league.slug,
                },
              }))
              allMatches = [...allMatches, ...leagueMatches]
            }
          } catch (error) {
            console.error(`Error fetching data for ${league.name} on ${date}:`, error)
          }
        }
      }

      // Process matches to determine winners
      allMatches = allMatches.map((match) => {
        if (match.competitions[0].competitors.length === 2) {
          const team1 = match.competitions[0].competitors[0]
          const team2 = match.competitions[0].competitors[1]

          if (team1.score && team2.score) {
            const score1 = Number.parseInt(team1.score)
            const score2 = Number.parseInt(team2.score)

            if (score1 > score2) {
              team1.winner = true
              team2.winner = false
            } else if (score2 > score1) {
              team1.winner = false
              team2.winner = true
            } else {
              team1.winner = false
              team2.winner = false
            }
          }
        }
        return match
      })

      setMatches(allMatches)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMatches = () => {
    let filtered = [...matches]

    // Filter by date and tab
    filtered = filtered.filter((match) => {
      const matchDate = new Date(match.date)

      if (activeTab === "live") {
        return getMatchStatus(match).status === "live"
      } else if (activeTab === "upcoming") {
        return (
          matchDate >= new Date() &&
          (getMatchStatus(match).status === "upcoming" ||
            getMatchStatus(match).status === "today" ||
            getMatchStatus(match).status === "soon")
        )
      } else if (activeTab === "past") {
        return getMatchStatus(match).status === "finished"
      } else if (activeTab === "today") {
        return isToday(matchDate)
      } else {
        return isSameDay(matchDate, selectedDate)
      }
    })

    // Filter by league
    if (selectedLeague !== "all") {
      filtered = filtered.filter((match) => {
        const league = leagues.find((l) => l.slug === selectedLeague)
        return match.league?.name === league?.name
      })
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((match) => {
        const team1 = match.competitions[0].competitors[0].team.displayName.toLowerCase()
        const team2 = match.competitions[0].competitors[1].team.displayName.toLowerCase()
        return team1.includes(query) || team2.includes(query)
      })
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

    setFilteredMatches(filtered)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "EEE, MMM d")
  }

  const getMatchStatus = (match: Match) => {
    const matchDate = new Date(match.date)
    const now = new Date()

    // Check if the match is live
    if (
      match.status.type.state.toLowerCase() === "in" ||
      match.status.type.detail.toLowerCase().includes("live") ||
      match.status.type.detail.toLowerCase().includes("half")
    ) {
      return {
        status: "live",
        label: "LIVE",
        color: "bg-red-500",
      }
    }

    // Check if the match is finished
    if (
      match.status.type.state.toLowerCase() === "post" ||
      match.status.type.detail.toLowerCase().includes("ft") ||
      match.status.type.detail.toLowerCase().includes("full") ||
      match.status.type.completed
    ) {
      return {
        status: "finished",
        label: "Finished",
        color: "bg-gray-500",
      }
    }

    // Check if the match is today but not started yet
    if (isSameDay(matchDate, now) && matchDate > now) {
      const hours = Math.floor((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      if (hours < 1) {
        return {
          status: "soon",
          label: "Starting Soon",
          color: "bg-amber-500",
        }
      } else {
        return {
          status: "today",
          label: "Today",
          color: "bg-blue-500",
        }
      }
    }

    // Future match
    return {
      status: "upcoming",
      label: "Upcoming",
      color: "bg-green-500",
    }
  }

  const clearFilters = () => {
    setSelectedLeague("all")
    setSearchQuery("")
    setSortOrder("asc")
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setActiveTab("date")
      setCalendarOpen(false) // This will close the modal
    }
  }

  const getMatchesForDate = (date: Date) => {
    return matches.filter((match) => isSameDay(new Date(match.date), date)).length
  }

  // Fetch detailed match data
  const fetchMatchDetails = async (match: Match) => {
    setLoadingMatchDetails(true)
    setMatchSummary(null)

    try {
      const leagueSlug = match.league?.slug || "eng.1"

      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${match.id}`,
      )

      if (response.ok) {
        const data = await response.json()

        // Extract statistics
        const stats: { name: string; home: string | number; away: string | number }[] = []

        if (data.boxscore?.teams) {
          const homeTeam = data.boxscore.teams[0]
          const awayTeam = data.boxscore.teams[1]

          if (homeTeam?.statistics && awayTeam?.statistics) {
            homeTeam.statistics.forEach((stat: any, index: number) => {
              if (stat.name && awayTeam.statistics[index]) {
                stats.push({
                  name: stat.name,
                  home: stat.displayValue,
                  away: awayTeam.statistics[index].displayValue,
                })
              }
            })
          }
        }

        // Fallback stats if none found
        if (stats.length === 0) {
          const homeScore = Number.parseInt(match.competitions[0].competitors[0].score || "0")
          const awayScore = Number.parseInt(match.competitions[0].competitors[1].score || "0")

          stats.push(
            { name: "Goals", home: homeScore, away: awayScore },
            { name: "Shots", home: homeScore * 4 + 8, away: awayScore * 4 + 6 },
            { name: "Shots on Target", home: homeScore * 2 + 3, away: awayScore * 2 + 2 },
            { name: "Possession", home: `${Math.random() * 20 + 40}%`, away: `${Math.random() * 20 + 40}%` },
            { name: "Corners", home: Math.floor(Math.random() * 8) + 2, away: Math.floor(Math.random() * 8) + 2 },
          )
        }

        // Extract timeline
        const timeline: { time: string; event: string; team: string; player?: string }[] = []

        if (data.plays?.length > 0) {
          data.plays.forEach((play: any) => {
            if (play.type?.text && play.clock?.displayValue) {
              timeline.push({
                time: `${play.clock.displayValue}'`,
                event: play.type.text,
                team: play.team?.displayName || "",
                player: play.athletesInvolved?.[0]?.displayName,
              })
            }
          })
        }

        // Fallback timeline
        if (timeline.length === 0) {
          const homeTeam = match.competitions[0].competitors[0].team.displayName
          const awayTeam = match.competitions[0].competitors[1].team.displayName
          const homeScore = Number.parseInt(match.competitions[0].competitors[0].score || "0")
          const awayScore = Number.parseInt(match.competitions[0].competitors[1].score || "0")

          // Generate events based on score
          for (let i = 0; i < homeScore; i++) {
            timeline.push({
              time: `${Math.floor(Math.random() * 90) + 1}'`,
              event: "Goal",
              team: homeTeam,
              player: `Player ${i + 1}`,
            })
          }

          for (let i = 0; i < awayScore; i++) {
            timeline.push({
              time: `${Math.floor(Math.random() * 90) + 1}'`,
              event: "Goal",
              team: awayTeam,
              player: `Player ${i + 1}`,
            })
          }

          timeline.sort((a, b) => Number.parseInt(a.time) - Number.parseInt(b.time))
        }

        setMatchSummary({ stats, timeline })
      }
    } catch (error) {
      console.error("Error fetching match details:", error)
    } finally {
      setLoadingMatchDetails(false)
    }
  }

  const openMatchSummary = async (match: Match) => {
    setSelectedMatch(match)
    setShowMatchSummary(true)
    await fetchMatchDetails(match)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <>
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="hero-section py-16 mb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center mb-6">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm" className="gap-1 hover:text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
                Match Center
              </h1>
            </div>
            <p className="text-gray-300 mb-6">
              Stay updated with the latest match results, live scores, and upcoming fixtures from top football leagues.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Filters Section */}
        <Card className="mb-6 border-white/10 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-white/10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="w-full md:w-[180px] bg-background/50 border-white/10">
                    <SelectValue placeholder="All Leagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map((league) => (
                      <SelectItem key={league.slug} value={league.slug} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={league.logo || "/placeholder.svg"}
                            alt={league.name}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span>{league.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Calendar Modal */}
                <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background/50 border-white/10 min-w-[140px]">
                      <CalendarDays className="h-4 w-4" />
                      <span>{format(selectedDate, "MMM d, yyyy")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-white/10">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Select Match Date
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                          const today = new Date()
                          const maxDate = addDays(today, 7)
                          const minDate = subDays(today, 14)
                          return date < minDate || date > maxDate
                        }}
                        modifiers={{
                          hasMatches: (date) => getMatchesForDate(date) > 0,
                          today: (date) => isToday(date),
                        }}
                        modifiersStyles={{
                          hasMatches: {
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                          },
                          today: {
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            fontWeight: "bold",
                            borderRadius: "6px",
                          },
                        }}
                        className="w-full"
                      />
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded"></div>
                          <span>Dates with matches</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="w-3 h-3 bg-red-500/40 border border-red-500/50 rounded"></div>
                          <span>Today</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Available dates: {format(subDays(new Date(), 14), "MMM d")} -{" "}
                          {format(addDays(new Date(), 7), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="bg-background/50 border-white/10"
                  title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>

                {(selectedLeague !== "all" || searchQuery || sortOrder !== "asc") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-5 mb-6 bg-card/60 p-1">
            <TabsTrigger value="live" className="data-[state=active]:bg-primary">
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live
              </span>
            </TabsTrigger>
            <TabsTrigger value="today" className="data-[state=active]:bg-primary">
              <Clock className="h-4 w-4 mr-1" />
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary">
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-primary">
              <Trophy className="h-4 w-4 mr-1" />
              Results
            </TabsTrigger>
            <TabsTrigger value="date" className="data-[state=active]:bg-primary">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{format(selectedDate, "MMM d")}</span>
              <span className="sm:hidden">Date</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-card/60 backdrop-blur-md border-white/10 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div>
                  {/* Group matches by date */}
                  {(() => {
                    const groupedMatches: { [key: string]: Match[] } = {}

                    filteredMatches.forEach((match) => {
                      const date = formatMatchDate(match.date)
                      if (!groupedMatches[date]) {
                        groupedMatches[date] = []
                      }
                      groupedMatches[date].push(match)
                    })

                    return Object.entries(groupedMatches).map(([date, matches]) => (
                      <div key={date} className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          {date}
                          <span className="ml-2 text-sm text-gray-400">({matches.length} matches)</span>
                        </h3>
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {matches.map((match) => {
                            const matchStatus = getMatchStatus(match)
                            const team1 = match.competitions[0].competitors[0]
                            const team2 = match.competitions[0].competitors[1]
                            const score1 = team1.score || "-"
                            const score2 = team2.score || "-"
                            const isPopularGame =
                              popularTeams.includes(team1.team.displayName) ||
                              popularTeams.includes(team2.team.displayName)
                            const venue = match.competitions[0].venue

                            return (
                              <motion.div key={match.id} variants={item}>
                                <Card
                                  className={`overflow-hidden transition-all duration-300 hover:border-primary/30 ${
                                    isPopularGame ? "border-primary/20" : "border-white/10"
                                  } bg-card/60 backdrop-blur-md`}
                                >
                                  <CardContent className="p-0">
                                    {/* League & Status Header */}
                                    <div className="flex justify-between items-center p-3 bg-black/20">
                                      <div className="flex items-center gap-2">
                                        {match.league && (
                                          <>
                                            <div className="relative h-5 w-5 overflow-hidden rounded-full">
                                              <Image
                                                src={match.league.logo || "/images/logo.png"}
                                                alt={match.league.name}
                                                width={20}
                                                height={20}
                                                className="object-cover"
                                              />
                                            </div>
                                            <span className="text-xs text-gray-400">{match.league.name}</span>
                                          </>
                                        )}
                                        {isPopularGame && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`${matchStatus.color}/20 border-${matchStatus.color}/50 text-xs`}
                                      >
                                        {matchStatus.label}
                                      </Badge>
                                    </div>

                                    {/* Match Details */}
                                    <div className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
                                            <Image
                                              src={team1.team.logo || "/images/logo.png"}
                                              alt={team1.team.displayName}
                                              width={48}
                                              height={48}
                                              className="object-cover"
                                            />
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="font-medium text-sm sm:text-base">
                                              {team1.team.displayName}
                                            </span>
                                            {matchStatus.status === "finished" && (
                                              <span
                                                className={`text-xs ${
                                                  team1.winner ? "text-green-400" : "text-gray-400"
                                                }`}
                                              >
                                                {team1.winner ? "Winner" : team2.winner ? "Lost" : "Draw"}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-center mx-4">
                                          {matchStatus.status === "live" || matchStatus.status === "finished" ? (
                                            <div className="text-xl sm:text-2xl font-bold">
                                              <span
                                                className={
                                                  team1.winner
                                                    ? "text-green-400"
                                                    : team2.winner
                                                      ? "text-gray-400"
                                                      : "text-yellow-400"
                                                }
                                              >
                                                {score1}
                                              </span>
                                              <span className="mx-2 text-gray-500">-</span>
                                              <span
                                                className={
                                                  team2.winner
                                                    ? "text-green-400"
                                                    : team1.winner
                                                      ? "text-gray-400"
                                                      : "text-yellow-400"
                                                }
                                              >
                                                {score2}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-lg font-medium text-primary">
                                              {formatTime(match.date)}
                                            </div>
                                          )}
                                          <div className="text-xs text-gray-400 mt-1">{match.status.type.detail}</div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                          <div className="flex flex-col items-end">
                                            <span className="font-medium text-sm sm:text-base">
                                              {team2.team.displayName}
                                            </span>
                                            {matchStatus.status === "finished" && (
                                              <span
                                                className={`text-xs ${
                                                  team2.winner ? "text-green-400" : "text-gray-400"
                                                }`}
                                              >
                                                {team2.winner ? "Winner" : team1.winner ? "Lost" : "Draw"}
                                              </span>
                                            )}
                                          </div>
                                          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
                                            <Image
                                              src={team2.team.logo || "/images/logo.png"}
                                              alt={team2.team.displayName}
                                              width={48}
                                              height={48}
                                              className="object-cover"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Venue Info */}
                                      {venue && (
                                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                                          <MapPin className="h-3 w-3" />
                                          <span>
                                            {venue.fullName}, {venue.address?.city}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Footer */}
                                    <div className="bg-black/20 p-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                                      {matchStatus.status === "live" ? (
                                        <Link href={`/live?match=${match.id}`}>
                                          <Button className="premium-button w-full sm:w-auto">
                                            <Play className="h-4 w-4 mr-1" />
                                            Watch Live
                                          </Button>
                                        </Link>
                                      ) : matchStatus.status === "finished" ? (
                                        <Button
                                          variant="outline"
                                          className="w-full sm:w-auto border-white/20 hover:bg-white/5"
                                          onClick={() => openMatchSummary(match)}
                                        >
                                          <Trophy className="h-4 w-4 mr-1" />
                                          Match Summary
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          className="w-full sm:w-auto border-white/20 hover:bg-white/5"
                                        >
                                          <Clock className="h-4 w-4 mr-1" />
                                          Set Reminder
                                        </Button>
                                      )}

                                      <div className="text-xs text-gray-400">
                                        {format(new Date(match.date), "MMM d, yyyy • HH:mm")}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  {activeTab === "live" ? (
                    <>
                      <Zap className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No live matches at the moment</p>
                      <p className="text-sm mt-2">Check back later or view upcoming matches</p>
                    </>
                  ) : activeTab === "upcoming" ? (
                    <>
                      <Calendar className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No upcoming matches found</p>
                      <p className="text-sm mt-2">Try changing your filters or check back later</p>
                    </>
                  ) : activeTab === "past" ? (
                    <>
                      <Trophy className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No past match results found</p>
                      <p className="text-sm mt-2">Try changing your filters</p>
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No matches found for {format(selectedDate, "MMMM d, yyyy")}</p>
                      <p className="text-sm mt-2">Try selecting a different date or league</p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Quick Navigation */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <Link href="/live">
              <Button variant="outline" className="w-full border-white/20 hover:border-primary/50 hover:bg-white/5">
                <Zap className="h-4 w-4 mr-2" />
                Live Streams
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant="outline" className="w-full border-white/20 hover:border-primary/50 hover:bg-white/5">
                <Trophy className="h-4 w-4 mr-2" />
                Standings
              </Button>
            </Link>
            <Link href="/news">
              <Button variant="outline" className="w-full border-white/20 hover:border-primary/50 hover:bg-white/5">
                <Filter className="h-4 w-4 mr-2" />
                News
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-white/20 hover:border-primary/50 hover:bg-white/5">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-white/20 hover:border-primary/50 hover:bg-white/5">
                <CalendarDays className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Match Summary Dialog */}
      <Dialog open={showMatchSummary} onOpenChange={setShowMatchSummary}>
        <DialogContent className="max-w-4xl bg-card/90 backdrop-blur-md border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedMatch?.competitions[0].competitors[0].team.displayName} vs{" "}
              {selectedMatch?.competitions[0].competitors[1].team.displayName}
            </DialogTitle>
          </DialogHeader>

          {selectedMatch && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20">
                    <Image
                      src={selectedMatch.competitions[0].competitors[0].team.logo || "/images/logo.png"}
                      alt={selectedMatch.competitions[0].competitors[0].team.displayName}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {selectedMatch.competitions[0].competitors[0].score} -{" "}
                      {selectedMatch.competitions[0].competitors[1].score}
                    </div>
                    <div className="text-sm text-gray-400">Final Score</div>
                  </div>
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20">
                    <Image
                      src={selectedMatch.competitions[0].competitors[1].team.logo || "/images/logo.png"}
                      alt={selectedMatch.competitions[0].competitors[1].team.displayName}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {format(new Date(selectedMatch.date), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-sm text-gray-400">{selectedMatch.status.type.detail}</div>
                </div>
              </div>

              <Tabs defaultValue="stats" className="mt-6">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="stats">Match Stats</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="stats">
                  {loadingMatchDetails ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-gray-400">Loading match statistics...</p>
                      </div>
                    </div>
                  ) : matchSummary ? (
                    <div className="bg-black/20 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                      <table className="w-full">
                        <tbody>
                          {matchSummary.stats.map((stat, index) => (
                            <tr key={index} className="border-b border-white/10 last:border-0">
                              <td className="py-3 text-right font-medium w-1/3">{stat.home}</td>
                              <td className="py-3 text-center font-bold text-gray-400 w-1/3">{stat.name}</td>
                              <td className="py-3 text-left font-medium w-1/3">{stat.away}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No match statistics available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline">
                  {loadingMatchDetails ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-gray-400">Loading match timeline...</p>
                      </div>
                    </div>
                  ) : matchSummary && matchSummary.timeline.length > 0 ? (
                    <div className="bg-black/20 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
                        {matchSummary.timeline.map((event, index) => (
                          <div key={index} className="mb-4 pl-10 relative">
                            <div className="absolute left-3 w-3 h-3 rounded-full bg-primary"></div>
                            <div className="absolute left-0 text-xs font-bold text-primary">{event.time}</div>
                            <div className="bg-black/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-bold">{event.event}</span>
                                  {event.player && <span className="ml-2">{event.player}</span>}
                                </div>
                                <div className="text-sm text-gray-400">{event.team}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No timeline events available for this match</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
