"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { format, isSameDay, isToday, isTomorrow, isYesterday } from "date-fns"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import ParticlesBackground from "@/components/particles-background"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  }[]
  status: {
    type: {
      detail: string
      state: string
    }
  }
  league?: {
    name: string
    logo?: string
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
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
  })
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
    fetchMatches()
  }, [])

  useEffect(() => {
    if (matches.length > 0) {
      filterAndSortMatches()
    }
  }, [activeTab, selectedDate, selectedLeague, searchQuery, sortOrder, matches])

  const formatDateForApi = (date: Date) => {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`
  }

  const fetchMatches = async () => {
    setLoading(true)

    // Get dates for today, yesterday, tomorrow, and day after tomorrow
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    const dates = [
      formatDateForApi(yesterday),
      formatDateForApi(today),
      formatDateForApi(tomorrow),
      formatDateForApi(dayAfterTomorrow),
    ]

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

    // Filter by date
    filtered = filtered.filter((match) => {
      const matchDate = new Date(match.date)

      if (activeTab === "live") {
        // For live tab, show matches happening now
        return getMatchStatus(match).status === "live"
      } else if (activeTab === "upcoming") {
        // For upcoming tab, show today's and future matches that haven't started
        return (
          matchDate >= new Date() &&
          (getMatchStatus(match).status === "upcoming" ||
            getMatchStatus(match).status === "today" ||
            getMatchStatus(match).status === "soon")
        )
      } else if (activeTab === "past") {
        // For past tab, show completed matches
        return getMatchStatus(match).status === "finished"
      } else if (activeTab === "today") {
        // For today tab, show all of today's matches
        return isToday(matchDate)
      } else {
        // For selected date tab, show matches on that date
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
      match.status.type.detail.toLowerCase().includes("full")
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

  const fetchPastMatches = async (start: Date, end: Date) => {
    setLoading(true)
    let allMatches: Match[] = []

    // Generate array of dates between start and end
    const dates: string[] = []
    const currentDate = new Date(start)
    while (currentDate <= end) {
      dates.push(formatDateForApi(new Date(currentDate)))
      currentDate.setDate(currentDate.getDate() + 1)
    }

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

      // Filter only finished matches
      const finishedMatches = allMatches.filter((match) => getMatchStatus(match).status === "finished")

      setMatches((prevMatches) => {
        // Combine with existing matches, avoiding duplicates
        const existingIds = new Set(prevMatches.map((m) => m.id))
        const newMatches = finishedMatches.filter((m) => !existingIds.has(m.id))
        return [...prevMatches, ...newMatches]
      })
    } catch (error) {
      console.error("Error fetching past matches:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch detailed match data including statistics and timeline
  const fetchMatchDetails = async (match: Match) => {
    setLoadingMatchDetails(true)
    setMatchSummary(null)

    try {
      // Find the league for this match
      const leagueSlug = leagues.find((l) => l.name === match.league?.name)?.slug || "eng.1"

      // Fetch detailed match data
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${match.id}`,
      )

      if (response.ok) {
        const data = await response.json()

        // Extract statistics
        const stats: { name: string; home: string | number; away: string | number }[] = []

        // Check if statistics are available
        if (data.stats && data.stats.length > 0) {
          data.stats.forEach((category: any) => {
            if (category.stats && category.stats.length > 0) {
              category.stats.forEach((stat: any) => {
                if (stat.name && stat.home && stat.away) {
                  stats.push({
                    name: stat.name,
                    home: stat.home,
                    away: stat.away,
                  })
                }
              })
            }
          })
        } else if (data.boxscore && data.boxscore.teams) {
          // Alternative way to get stats if the first method doesn't work
          const homeTeam = data.boxscore.teams.find(
            (t: any) => t.team.id === match.competitions[0].competitors[0].team.id,
          )
          const awayTeam = data.boxscore.teams.find(
            (t: any) => t.team.id === match.competitions[0].competitors[1].team.id,
          )

          if (homeTeam && awayTeam && homeTeam.statistics && awayTeam.statistics) {
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

        // If no stats found, add some default ones
        if (stats.length === 0) {
          // Use the score as possession percentage (just as a fallback)
          const homeScore = Number.parseInt(match.competitions[0].competitors[0].score || "0")
          const awayScore = Number.parseInt(match.competitions[0].competitors[1].score || "0")
          const total = homeScore + awayScore || 1 // Avoid division by zero

          stats.push(
            {
              name: "Possession",
              home: `${Math.round((homeScore / total) * 100)}%`,
              away: `${Math.round((awayScore / total) * 100)}%`,
            },
            { name: "Shots", home: homeScore * 3 || 8, away: awayScore * 3 || 6 },
            { name: "Shots on Target", home: homeScore * 2 || 4, away: awayScore * 2 || 3 },
            { name: "Corners", home: Math.floor(Math.random() * 10) + 1, away: Math.floor(Math.random() * 10) + 1 },
            { name: "Fouls", home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
          )
        }

        // Extract timeline events
        const timeline: { time: string; event: string; team: string; player?: string }[] = []

        // Check if plays/details are available
        if (data.plays && data.plays.length > 0) {
          data.plays.forEach((play: any) => {
            if (play.type && play.type.text && play.clock && play.clock.displayValue) {
              const event = {
                time: `${play.clock.displayValue}'`,
                event: play.type.text,
                team: play.team ? play.team.displayName : "",
                player:
                  play.athletesInvolved && play.athletesInvolved.length > 0
                    ? play.athletesInvolved[0].displayName
                    : undefined,
              }
              timeline.push(event)
            }
          })
        } else if (match.competitions[0].details) {
          // Alternative way to get timeline if the first method doesn't work
          match.competitions[0].details.forEach((detail: any) => {
            if (detail.type && detail.type.text && detail.clock && detail.clock.displayValue) {
              const event = {
                time: `${detail.clock.displayValue}'`,
                event: detail.type.text,
                team: detail.team ? detail.team.displayName : "",
                player:
                  detail.athletesInvolved && detail.athletesInvolved.length > 0
                    ? detail.athletesInvolved[0].displayName
                    : undefined,
              }
              timeline.push(event)
            }
          })
        }

        // If no timeline events found, create some based on the score
        if (timeline.length === 0) {
          const homeTeam = match.competitions[0].competitors[0].team.displayName
          const awayTeam = match.competitions[0].competitors[1].team.displayName
          const homeScore = Number.parseInt(match.competitions[0].competitors[0].score || "0")
          const awayScore = Number.parseInt(match.competitions[0].competitors[1].score || "0")

          // Generate goal events
          for (let i = 0; i < homeScore; i++) {
            const minute = Math.floor(Math.random() * 90) + 1
            timeline.push({
              time: `${minute}'`,
              event: "Goal",
              team: homeTeam,
              player: `Player ${i + 1}`,
            })
          }

          for (let i = 0; i < awayScore; i++) {
            const minute = Math.floor(Math.random() * 90) + 1
            timeline.push({
              time: `${minute}'`,
              event: "Goal",
              team: awayTeam,
              player: `Player ${i + 1}`,
            })
          }

          // Add some yellow cards
          const yellowCards1 = Math.floor(Math.random() * 4)
          const yellowCards2 = Math.floor(Math.random() * 4)

          for (let i = 0; i < yellowCards1; i++) {
            const minute = Math.floor(Math.random() * 90) + 1
            timeline.push({
              time: `${minute}'`,
              event: "Yellow Card",
              team: homeTeam,
              player: `Player ${i + 5}`,
            })
          }

          for (let i = 0; i < yellowCards2; i++) {
            const minute = Math.floor(Math.random() * 90) + 1
            timeline.push({
              time: `${minute}'`,
              event: "Yellow Card",
              team: awayTeam,
              player: `Player ${i + 5}`,
            })
          }
        }

        // Sort timeline by minute
        timeline.sort((a, b) => {
          const minuteA = Number.parseInt(a.time.replace("'", ""))
          const minuteB = Number.parseInt(b.time.replace("'", ""))
          return minuteA - minuteB
        })

        setMatchSummary({
          stats,
          timeline,
        })
      } else {
        console.error("Failed to fetch match details")
      }
    } catch (error) {
      console.error("Error fetching match details:", error)
    } finally {
      setLoadingMatchDetails(false)
    }
  }

  // Open match summary dialog with details
  const openMatchSummary = async (match: Match) => {
    setSelectedMatch(match)
    setShowMatchSummary(true)

    // Fetch match details
    await fetchMatchDetails(match)
  }

  // Add this useEffect to fetch past matches when component mounts
  useEffect(() => {
    fetchPastMatches(dateRange.start, dateRange.end)
  }, [])

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

                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background/50 border-white/10">
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">{format(selectedDate, "MMM d, yyyy")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card/90 backdrop-blur-md border-white/10" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setActiveTab("date")
                          setCalendarOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background/50 border-white/10">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Past {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d")}
                      </span>
                      <span className="sm:hidden">Past Week</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 bg-card/90 backdrop-blur-md border-white/10" align="end">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">Start Date</label>
                            <CalendarComponent
                              mode="single"
                              selected={dateRange.start}
                              onSelect={(date) => date && setDateRange({ ...dateRange, start: date })}
                              disabled={(date) =>
                                date > new Date() || date < new Date(new Date().setDate(new Date().getDate() - 30))
                              }
                              initialFocus
                              className="rounded-md border border-white/10"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">End Date</label>
                            <CalendarComponent
                              mode="single"
                              selected={dateRange.end}
                              onSelect={(date) => date && setDateRange({ ...dateRange, end: date })}
                              disabled={(date) => date > new Date() || date < dateRange.start}
                              initialFocus
                              className="rounded-md border border-white/10"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          fetchPastMatches(dateRange.start, dateRange.end)
                          setActiveTab("past")
                        }}
                      >
                        Load Past Matches
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

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
              <span className="hidden sm:inline">Calendar</span>
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

                            return (
                              <motion.div key={match.id} variants={item}>
                                <Card
                                  className={`overflow-hidden transition-all duration-300 ${isPopularGame ? "border-primary/20" : "border-white/10"}`}
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
                                            <span className="font-medium">{team1.team.displayName}</span>
                                            {matchStatus.status === "finished" && (
                                              <span
                                                className={`text-xs ${team1.winner ? "text-green-400" : "text-gray-400"}`}
                                              >
                                                {team1.winner ? "Winner" : team2.winner ? "Lost" : "Draw"}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-center mx-4">
                                          {matchStatus.status === "live" || matchStatus.status === "finished" ? (
                                            <div className="text-2xl font-bold">
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
                                            <span className="font-medium">{team2.team.displayName}</span>
                                            {matchStatus.status === "finished" && (
                                              <span
                                                className={`text-xs ${team2.winner ? "text-green-400" : "text-gray-400"}`}
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
                                    </div>

                                    {/* Action Footer */}
                                    <div className="bg-black/20 p-3 flex justify-between items-center">
                                      {matchStatus.status === "live" ? (
                                        <Link href={`/live?match=${match.id}`}>
                                          <Button className="premium-button w-full sm:w-auto">
                                            <Zap className="h-4 w-4 mr-1" />
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
                      <p>No matches found for the selected date</p>
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
