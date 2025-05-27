"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { format, subDays } from "date-fns"
import { Calendar, Trophy, Clock, Zap, TrendingUp, Play, ArrowRight, Target, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import ParticlesBackground from "@/components/particles-background"

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
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const leagues = [
    { name: "Premier League", slug: "eng.1", logo: "/images/pl.png" },
    { name: "La Liga", slug: "esp.1", logo: "/images/laliga.png" },
    { name: "Serie A", slug: "ita.1", logo: "/images/seriea.png" },
    { name: "Bundesliga", slug: "ger.1", logo: "/images/bundes.png" },
    { name: "Ligue 1", slug: "fra.1", logo: "/images/ligue1.png" },
  ]

  useEffect(() => {
    fetchMatches()
  }, [])

  const formatDateForApi = (date: Date) => {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`
  }

  const fetchMatches = async () => {
    setLoading(true)

    // Get dates for past 7 days, today, and next 3 days
    const today = new Date()
    const dates: string[] = []

    // Past 7 days for recent results
    for (let i = 7; i >= 1; i--) {
      const date = subDays(today, i)
      dates.push(formatDateForApi(date))
    }

    // Today
    dates.push(formatDateForApi(today))

    // Next 3 days for upcoming
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
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

      // Categorize matches
      const live: Match[] = []
      const upcoming: Match[] = []
      const recent: Match[] = []

      allMatches.forEach((match) => {
        const matchDate = new Date(match.date)
        const now = new Date()

        // Check if match is live
        if (
          match.status.type.state.toLowerCase() === "in" ||
          match.status.type.detail.toLowerCase().includes("live") ||
          match.status.type.detail.toLowerCase().includes("half")
        ) {
          live.push(match)
        }
        // Check if match is finished (recent results)
        else if (
          match.status.type.state.toLowerCase() === "post" ||
          match.status.type.detail.toLowerCase().includes("ft") ||
          match.status.type.detail.toLowerCase().includes("full")
        ) {
          recent.push(match)
        }
        // Check if match is upcoming
        else if (matchDate > now) {
          upcoming.push(match)
        }
      })

      // Sort and limit results
      setLiveMatches(live.slice(0, 6))
      setUpcomingMatches(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6))
      setRecentMatches(recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6))
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const MatchCard = ({ match, type }: { match: Match; type: "live" | "upcoming" | "recent" }) => {
    const team1 = match.competitions[0].competitors[0]
    const team2 = match.competitions[0].competitors[1]
    const score1 = team1.score || "-"
    const score2 = team2.score || "-"

    return (
      <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              {match.league && (
                <>
                  <div className="relative h-4 w-4 overflow-hidden rounded-full">
                    <Image
                      src={match.league.logo || "/images/logo.png"}
                      alt={match.league.name}
                      width={16}
                      height={16}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-400">{match.league.name}</span>
                </>
              )}
            </div>
            {type === "live" && (
              <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-red-400 text-xs">
                LIVE
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                <Image
                  src={team1.team.logo || "/images/logo.png"}
                  alt={team1.team.displayName}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-medium truncate">{team1.team.displayName}</span>
            </div>

            <div className="flex flex-col items-center mx-3">
              {type === "recent" || type === "live" ? (
                <div className="text-lg font-bold">
                  <span className={team1.winner ? "text-green-400" : "text-gray-400"}>{score1}</span>
                  <span className="mx-1 text-gray-500">-</span>
                  <span className={team2.winner ? "text-green-400" : "text-gray-400"}>{score2}</span>
                </div>
              ) : (
                <div className="text-sm font-medium text-primary">{formatTime(match.date)}</div>
              )}
              <div className="text-xs text-gray-400">{format(new Date(match.date), "MMM d")}</div>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-medium truncate">{team2.team.displayName}</span>
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
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="hero-section py-20 mb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 glow-text">
              Live Sports Central
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your ultimate destination for live sports streaming, real-time scores, and comprehensive match coverage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/live">
                <Button size="lg" className="premium-button">
                  <Play className="h-5 w-5 mr-2" />
                  Watch Live Now
                </Button>
              </Link>
              <Link href="/matches">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Calendar className="h-5 w-5 mr-2" />
                  View All Matches
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Live Matches Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <h2 className="text-2xl font-bold">Live Matches</h2>
            </div>
            <Link href="/live">
              <Button variant="ghost" className="gap-2 hover:text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/60 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} type="live" />
              ))}
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No live matches at the moment</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for live coverage</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Upcoming Matches Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Upcoming Matches</h2>
            </div>
            <Link href="/matches">
              <Button variant="ghost" className="gap-2 hover:text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/60 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} type="upcoming" />
              ))}
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No upcoming matches scheduled</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for new fixtures</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Results Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recent Results</h2>
            </div>
            <Link href="/matches">
              <Button variant="ghost" className="gap-2 hover:text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/60 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} type="recent" />
              ))}
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No recent results available</p>
                <p className="text-sm text-gray-500 mt-2">Recent match results will appear here</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Platform Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{liveMatches.length}</div>
                <div className="text-sm text-gray-400">Live Matches</div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{upcomingMatches.length}</div>
                <div className="text-sm text-gray-400">Upcoming</div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{recentMatches.length}</div>
                <div className="text-sm text-gray-400">Recent Results</div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-gray-400">Leagues</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Navigation */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Explore More</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/live">
              <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Live Streams</h3>
                  <p className="text-sm text-gray-400">Watch matches live in HD quality</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/matches">
              <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Match Center</h3>
                  <p className="text-sm text-gray-400">Complete match schedules and results</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/standings">
              <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">League Tables</h3>
                  <p className="text-sm text-gray-400">Current standings and statistics</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/news">
              <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Sports News</h3>
                  <p className="text-sm text-gray-400">Latest news and updates</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
