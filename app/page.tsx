"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  TrendingUp,
  Trophy,
  Zap,
  ChevronRight,
  CalendarIcon,
  ChevronLeft,
  ChevronDown,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import ParticlesBackground from "@/components/particles-background"
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns"

interface Team {
  displayName: string
  logo: string
}

interface Match {
  id: string
  date: string
  name: string
  competitions: {
    competitors: {
      team: Team
      score: string
      winner?: boolean
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

export default function Home() {
  const [teamImages, setTeamImages] = useState<string[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [pastMatches, setPastMatches] = useState<Match[]>([])
  const [todayMatches, setTodayMatches] = useState<Match[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMatches, setCalendarMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState<string>("all")
  const [showCalendar, setShowCalendar] = useState(false)

  const leagues = ["eng.1", "esp.1", "ita.1", "ger.1", "fra.1"]
  const leagueNames = {
    "eng.1": "Premier League",
    "esp.1": "La Liga",
    "ita.1": "Serie A",
    "ger.1": "Bundesliga",
    "fra.1": "Ligue 1",
    all: "All Leagues",
  }

  useEffect(() => {
    const fetchTopTeams = async () => {
      const images: string[] = []
      for (const league of leagues) {
        try {
          const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams`)
          if (!response.ok) throw new Error(`Failed to fetch ${league}`)

          const data = await response.json()
          data.sports[0].leagues[0].teams.forEach((team: any) => {
            if (team.team && team.team.logos) {
              images.push(team.team.logos[0].href)
            }
          })
        } catch (error) {
          console.error(error)
        }
      }
      setTeamImages(images.slice(0, 10))
    }

    const fetchInitialMatches = async () => {
      setLoading(true)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const todayStr = formatDateForApi(today)
      const tomorrowStr = formatDateForApi(tomorrow)
      const yesterdayStr = formatDateForApi(yesterday)

      let todayMatches: Match[] = []
      let tomorrowMatches: Match[] = []
      let yesterdayMatches: Match[] = []

      for (const league of leagues) {
        try {
          // Fetch today's matches
          const todayResponse = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${todayStr}`,
          )
          if (todayResponse.ok) {
            const todayData = await todayResponse.json()
            const matches = (todayData.events || []).map((match: any) => ({
              ...match,
              league: {
                name: leagueNames[league as keyof typeof leagueNames] || league,
                logo: `/images/${league.split(".")[0]}.png`,
              },
            }))
            todayMatches = [...todayMatches, ...matches]
          }

          // Fetch tomorrow's matches
          const tomorrowResponse = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${tomorrowStr}`,
          )
          if (tomorrowResponse.ok) {
            const tomorrowData = await tomorrowResponse.json()
            const matches = (tomorrowData.events || []).map((match: any) => ({
              ...match,
              league: {
                name: leagueNames[league as keyof typeof leagueNames] || league,
                logo: `/images/${league.split(".")[0]}.png`,
              },
            }))
            tomorrowMatches = [...tomorrowMatches, ...matches]
          }

          // Fetch yesterday's matches
          const yesterdayResponse = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${yesterdayStr}`,
          )
          if (yesterdayResponse.ok) {
            const yesterdayData = await yesterdayResponse.json()
            const matches = (yesterdayData.events || []).map((match: any) => ({
              ...match,
              league: {
                name: leagueNames[league as keyof typeof leagueNames] || league,
                logo: `/images/${league.split(".")[0]}.png`,
              },
            }))
            yesterdayMatches = [...yesterdayMatches, ...matches]
          }
        } catch (error) {
          console.error(`Error fetching matches for ${league}:`, error)
        }
      }

      // Process matches to determine winners
      const processMatches = (matches: Match[]) => {
        return matches.map((match) => {
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
      }

      setTodayMatches(processMatches(todayMatches))
      setUpcomingMatches(processMatches([...todayMatches, ...tomorrowMatches].slice(0, 5)))
      setPastMatches(processMatches(yesterdayMatches.slice(0, 5)))
      setCalendarMatches(processMatches(todayMatches))
      setLoading(false)
    }

    fetchTopTeams()
    fetchInitialMatches()
  }, [])

  const fetchMatchesForDate = useCallback(
    async (date: Date) => {
      setCalendarLoading(true)
      const dateStr = formatDateForApi(date)
      let matches: Match[] = []

      for (const league of leagues) {
        if (selectedLeague !== "all" && league !== selectedLeague) continue

        try {
          const response = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateStr}`,
          )
          if (response.ok) {
            const data = await response.json()
            const leagueMatches = (data.events || []).map((match: any) => ({
              ...match,
              league: {
                name: leagueNames[league as keyof typeof leagueNames] || league,
                logo: `/images/${league.split(".")[0]}.png`,
              },
            }))
            matches = [...matches, ...leagueMatches]
          }
        } catch (error) {
          console.error(`Error fetching matches for ${league}:`, error)
        }
      }

      // Process matches to determine winners
      matches = matches.map((match) => {
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

      setCalendarMatches(matches)
      setCalendarLoading(false)
    },
    [selectedLeague],
  )

  useEffect(() => {
    fetchMatchesForDate(selectedDate)
  }, [selectedDate, selectedLeague, fetchMatchesForDate])

  const formatDateForApi = (date: Date) => {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

  return (
    <>
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="hero-section py-24 md:py-32 mb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
              Live Sports Streaming
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Watch your favorite teams compete in real-time with premium quality streams. Never miss a game with
              CubeSports - your ultimate sports destination.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/live">
                <Button className="premium-button text-lg py-6 px-8">
                  <Zap className="mr-2 h-5 w-5" />
                  Watch Live Now
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-lg py-6 px-8 border-white/20 hover:bg-white/5 hover:border-primary/50"
                onClick={() => setShowCalendar(true)}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                View Schedule
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Featured Categories */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <motion.div variants={item}>
            <Link href="/standings" className="block">
              <div
                className="sports-box"
                style={{
                  backgroundImage: `url(${teamImages[0] || "/images/placeholder-sports.jpg"})`,
                }}
              >
                <h2 className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Standings
                </h2>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/matches" className="block">
              <div
                className="sports-box"
                style={{
                  backgroundImage: `url(${teamImages[1] || "/images/placeholder-sports.jpg"})`,
                }}
              >
                <h2 className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Match Scores
                </h2>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/live" className="block">
              <div
                className="sports-box"
                style={{
                  backgroundImage: `url(${teamImages[2] || "/images/placeholder-sports.jpg"})`,
                }}
              >
                <div className="live-badge flex items-center">
                  <span className="live-indicator mr-2"></span>
                  LIVE
                </div>
                <h2 className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Live Stream
                </h2>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Match Schedule Calendar */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-16"
            >
              <Card className="premium-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <CalendarIcon className="h-6 w-6 text-primary mr-2" />
                    Match Schedule
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                      <SelectTrigger className="w-[180px] bg-card/60 border-white/10">
                        <SelectValue placeholder="Select League" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leagues</SelectItem>
                        {leagues.map((league) => (
                          <SelectItem key={league} value={league}>
                            {leagueNames[league as keyof typeof leagueNames]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCalendar(false)}
                      className="hover:bg-white/10"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  {/* Fix the calendar layout to be more compact and better aligned */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
                    <div className="bg-card/60 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-base font-medium">{format(selectedDate, "MMMM yyyy")}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border border-white/10 p-0"
                        classNames={{
                          day_selected:
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-bold",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                          cell: "h-8 w-8 text-center text-sm p-0 relative",
                          month: "space-y-2",
                        }}
                      />
                    </div>
                    <div className="bg-card/60 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">
                          Matches for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </h3>
                        <Badge variant="outline" className="bg-primary/20 border-primary/50">
                          {calendarMatches.length} Matches
                        </Badge>
                      </div>

                      {calendarLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg bg-white/5 shimmer"
                            >
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-4 w-16" />
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : calendarMatches.length > 0 ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {calendarMatches.map((match) => {
                            const matchStatus = getMatchStatus(match)
                            const team1 = match.competitions[0].competitors[0]
                            const team2 = match.competitions[0].competitors[1]
                            const score1 = team1.score || "-"
                            const score2 = team2.score || "-"

                            return (
                              <div
                                key={match.id}
                                className="flex flex-col p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
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

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                      <Image
                                        src={team1.team.logo || "/images/logo.png"}
                                        alt={team1.team.displayName}
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                      />
                                    </div>
                                    <span className="font-medium">{team1.team.displayName}</span>
                                  </div>

                                  <div className="flex flex-col items-center mx-4">
                                    {matchStatus.status === "live" || matchStatus.status === "finished" ? (
                                      <div className="text-xl font-bold">
                                        <span className={team1.winner ? "text-green-400" : "text-gray-400"}>
                                          {score1}
                                        </span>
                                        <span className="mx-1 text-gray-500">-</span>
                                        <span className={team2.winner ? "text-green-400" : "text-gray-400"}>
                                          {score2}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-sm font-medium text-primary">{formatTime(match.date)}</div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">{match.status.type.detail}</div>
                                  </div>

                                  <div className="flex items-center gap-3 flex-1 justify-end">
                                    <span className="font-medium">{team2.team.displayName}</span>
                                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                      <Image
                                        src={team2.team.logo || "/images/logo.png"}
                                        alt={team2.team.displayName}
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {matchStatus.status === "live" && (
                                  <div className="mt-3 flex justify-center">
                                    <Link href={`/live?match=${match.id}`}>
                                      <Button size="sm" className="premium-button">
                                        <Zap className="h-4 w-4 mr-1" />
                                        Watch Live
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 mb-4 text-gray-400" />
                          <p>No matches scheduled for this date</p>
                          <p className="text-sm mt-2">Try selecting a different date or league</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Matches Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                Today's Matches
              </span>
            </h2>
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className="border-white/20 hover:bg-white/5 hover:border-primary/50"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {showCalendar ? "Hide Calendar" : "Show Calendar"}
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-card/60 backdrop-blur-md border-white/10 shimmer">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-10" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : todayMatches.length > 0 ? (
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="bg-card/60 p-1 mb-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary">
                  All Matches
                </TabsTrigger>
                <TabsTrigger value="live" className="data-[state=active]:bg-primary">
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Live Now
                  </span>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary">
                  <Clock className="h-4 w-4 mr-1" />
                  Upcoming
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {todayMatches.map((match) => {
                    const matchStatus = getMatchStatus(match)
                    const team1 = match.competitions[0].competitors[0]
                    const team2 = match.competitions[0].competitors[1]
                    const score1 = team1.score || "-"
                    const score2 = team2.score || "-"

                    return (
                      <Card key={match.id} className="match-card">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-center">
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
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                <Image
                                  src={team1.team.logo || "/images/logo.png"}
                                  alt={team1.team.displayName}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-medium">{team1.team.displayName}</span>
                            </div>

                            <div className="flex flex-col items-center">
                              {matchStatus.status === "live" || matchStatus.status === "finished" ? (
                                <div className="text-lg font-bold">
                                  <span className={team1.winner ? "text-green-400" : "text-gray-400"}>{score1}</span>
                                  <span className="mx-1 text-gray-500">-</span>
                                  <span className={team2.winner ? "text-green-400" : "text-gray-400"}>{score2}</span>
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-primary">{formatTime(match.date)}</div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-medium">{team2.team.displayName}</span>
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                <Image
                                  src={team2.team.logo || "/images/logo.png"}
                                  alt={team2.team.displayName}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          </div>

                          {matchStatus.status === "live" ? (
                            <Link href={`/live?match=${match.id}`}>
                              <Button className="premium-button w-full">
                                <Zap className="h-4 w-4 mr-1" />
                                Watch Live
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full border-white/20 hover:bg-white/5"
                              onClick={() => {
                                setSelectedDate(parseISO(match.date))
                                setShowCalendar(true)
                              }}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {matchStatus.status === "finished" ? "Match Details" : "Set Reminder"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="live">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {todayMatches.filter((match) => getMatchStatus(match).status === "live").length > 0 ? (
                    todayMatches
                      .filter((match) => getMatchStatus(match).status === "live")
                      .map((match) => {
                        const team1 = match.competitions[0].competitors[0]
                        const team2 = match.competitions[0].competitors[1]
                        const score1 = team1.score || "-"
                        const score2 = team2.score || "-"

                        return (
                          <Card key={match.id} className="match-card">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-center">
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
                                <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-xs">
                                  LIVE
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                    <Image
                                      src={team1.team.logo || "/images/logo.png"}
                                      alt={team1.team.displayName}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                  <span className="font-medium">{team1.team.displayName}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                  <div className="text-lg font-bold">
                                    <span className={team1.winner ? "text-green-400" : "text-gray-400"}>{score1}</span>
                                    <span className="mx-1 text-gray-500">-</span>
                                    <span className={team2.winner ? "text-green-400" : "text-gray-400"}>{score2}</span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">{match.status.type.detail}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{team2.team.displayName}</span>
                                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                    <Image
                                      src={team2.team.logo || "/images/logo.png"}
                                      alt={team2.team.displayName}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              <Link href={`/live?match=${match.id}`}>
                                <Button className="premium-button w-full">
                                  <Zap className="h-4 w-4 mr-1" />
                                  Watch Live
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        )
                      })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <Clock className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No live matches at the moment</p>
                      <p className="text-sm mt-2">Check back later or view upcoming matches</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upcoming">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {todayMatches.filter(
                    (match) =>
                      getMatchStatus(match).status === "upcoming" ||
                      getMatchStatus(match).status === "today" ||
                      getMatchStatus(match).status === "soon",
                  ).length > 0 ? (
                    todayMatches
                      .filter(
                        (match) =>
                          getMatchStatus(match).status === "upcoming" ||
                          getMatchStatus(match).status === "today" ||
                          getMatchStatus(match).status === "soon",
                      )
                      .map((match) => {
                        const matchStatus = getMatchStatus(match)
                        const team1 = match.competitions[0].competitors[0]
                        const team2 = match.competitions[0].competitors[1]

                        return (
                          <Card key={match.id} className="match-card">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-center">
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
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                    <Image
                                      src={team1.team.logo || "/images/logo.png"}
                                      alt={team1.team.displayName}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                  <span className="font-medium">{team1.team.displayName}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                  <div className="text-sm font-medium text-primary">{formatTime(match.date)}</div>
                                  <div className="text-xs text-gray-400 mt-1">Today</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{team2.team.displayName}</span>
                                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                                    <Image
                                      src={team2.team.logo || "/images/logo.png"}
                                      alt={team2.team.displayName}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                className="w-full border-white/20 hover:bg-white/5"
                                onClick={() => {
                                  setSelectedDate(parseISO(match.date))
                                  setShowCalendar(true)
                                }}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Set Reminder
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <Calendar className="h-12 w-12 mb-4 text-gray-400" />
                      <p>No upcoming matches for today</p>
                      <p className="text-sm mt-2">Check the calendar for future matches</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mb-4 text-gray-400" />
              <p>No matches scheduled for today</p>
              <p className="text-sm mt-2">Check the calendar for upcoming matches</p>
            </div>
          )}
        </div>

        {/* Today's Matches & Recent Results */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                Featured Matches
              </span>
            </h2>
            <Link href="/matches">
              <Button variant="ghost" className="flex items-center gap-1 hover:text-primary">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center">
                    <Star className="h-5 w-5 text-primary mr-2" />
                    Today's Matches
                  </h3>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm" className="hover:text-primary">
                      View All
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 shimmer">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingMatches.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                            <Image
                              src={match.competitions[0].competitors[0].team.logo || "/images/logo.png"}
                              alt={match.competitions[0].competitors[0].team.displayName}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <span className="font-medium">{match.competitions[0].competitors[0].team.displayName}</span>
                        </div>
                        <div className="text-sm text-primary font-medium">{formatTime(match.date)}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.competitions[0].competitors[1].team.displayName}</span>
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                            <Image
                              src={match.competitions[0].competitors[1].team.logo || "/images/logo.png"}
                              alt={match.competitions[0].competitors[1].team.displayName}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No matches scheduled for today</div>
                )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center">
                    <Trophy className="h-5 w-5 text-primary mr-2" />
                    Recent Results
                  </h3>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm" className="hover:text-primary">
                      View All
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 shimmer">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pastMatches.length > 0 ? (
                  <div className="space-y-4">
                    {pastMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                            <Image
                              src={match.competitions[0].competitors[0].team.logo || "/images/logo.png"}
                              alt={match.competitions[0].competitors[0].team.displayName}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-medium">{match.competitions[0].competitors[0].team.displayName}</span>
                            <span className="ml-2 font-bold text-primary">
                              {match.competitions[0].competitors[0].score}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 px-2 py-1 rounded-full bg-white/5">Final</div>
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-bold text-primary">{match.competitions[0].competitors[1].score}</span>
                            <span className="ml-2 font-medium">
                              {match.competitions[0].competitors[1].team.displayName}
                            </span>
                          </div>
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                            <Image
                              src={match.competitions[0].competitors[1].team.logo || "/images/logo.png"}
                              alt={match.competitions[0].competitors[1].team.displayName}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No recent match results</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              Premium Features
            </span>
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="feature-card">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">HD Live Streaming</h3>
              <p className="text-gray-400 text-sm">
                Watch your favorite sports events live with high-quality HD streams.
              </p>
            </div>

            <div className="feature-card">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Real-time Standings</h3>
              <p className="text-gray-400 text-sm">
                Stay updated with the latest standings from all major leagues worldwide.
              </p>
            </div>

            <div className="feature-card">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Match Schedules</h3>
              <p className="text-gray-400 text-sm">
                Never miss a game with our comprehensive match schedules and notifications.
              </p>
            </div>

            <div className="feature-card">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Sports News</h3>
              <p className="text-gray-400 text-sm">
                Get the latest news, transfers, and updates from the world of sports.
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="glass-panel p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Watching?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of sports fans who enjoy premium quality streams of their favorite games. No subscription
            required, just click and watch!
          </p>
          <Link href="/live">
            <Button className="premium-button text-lg py-6 px-8">
              <Zap className="mr-2 h-5 w-5" />
              Watch Live Now
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
