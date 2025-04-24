"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import ParticlesBackground from "@/components/particles-background"

interface League {
  name: string
  logo: string
  slug: string
}

interface TeamStanding {
  team: {
    displayName: string
    logos?: { href: string }[]
  }
  stats: {
    value: number
    name: string
  }[]
}

// Add this interface for qualification zones
interface QualificationZone {
  name: string
  color: string
  startPos: number
  endPos: number
}

export default function Standings() {
  const [activeLeague, setActiveLeague] = useState("eng.1")
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(true)

  // Update the leagues array to use proper local image paths
  const leagues: League[] = [
    { name: "Premier League", logo: "/images/pl.png", slug: "eng.1" },
    { name: "La Liga", logo: "/images/laliga.png", slug: "esp.1" },
    { name: "Bundesliga", logo: "/images/bundes.png", slug: "ger.1" },
    { name: "Serie A", logo: "/images/seriea.png", slug: "ita.1" },
    { name: "Ligue 1", logo: "/images/ligue1.png", slug: "fra.1" },
  ]

  useEffect(() => {
    fetchStandings(activeLeague)
  }, [activeLeague])

  const fetchStandings = async (leagueSlug: string) => {
    setLoading(true)
    try {
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueSlug}/standings`
      const response = await fetch(url)
      const data = await response.json()
      setStandings(data.children[0].standings.entries || [])
    } catch (error) {
      console.error("Error fetching standings:", error)
      setStandings([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get stat value by name
  const getStatValue = (stats: { name: string; value: number }[], name: string) => {
    const stat = stats.find((s) => s.name === name)
    return stat ? stat.value : 0
  }

  // Add this function to determine team qualification status
  const getTeamQualificationStatus = (position: number, leagueSlug: string): QualificationZone | null => {
    // Different leagues have different qualification spots
    const zones: { [key: string]: QualificationZone[] } = {
      "eng.1": [
        { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 4 },
        { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 6 },
        { name: "UEFA Conference League", color: "bg-purple-500", startPos: 7, endPos: 7 },
        { name: "Relegation", color: "bg-red-500", startPos: 18, endPos: 20 },
      ],
      "esp.1": [
        { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 4 },
        { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 6 },
        { name: "UEFA Conference League", color: "bg-purple-500", startPos: 7, endPos: 7 },
        { name: "Relegation", color: "bg-red-500", startPos: 18, endPos: 20 },
      ],
      "ita.1": [
        { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 4 },
        { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 6 },
        { name: "UEFA Conference League", color: "bg-purple-500", startPos: 7, endPos: 7 },
        { name: "Relegation", color: "bg-red-500", startPos: 18, endPos: 20 },
      ],
      "ger.1": [
        { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 4 },
        { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 6 },
        { name: "UEFA Conference League", color: "bg-purple-500", startPos: 7, endPos: 7 },
        { name: "Relegation Playoff", color: "bg-yellow-500", startPos: 16, endPos: 16 },
        { name: "Relegation", color: "bg-red-500", startPos: 17, endPos: 18 },
      ],
      "fra.1": [
        { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 3 },
        { name: "UEFA Champions League Playoff", color: "bg-blue-400", startPos: 4, endPos: 4 },
        { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 5 },
        { name: "UEFA Conference League", color: "bg-purple-500", startPos: 6, endPos: 6 },
        { name: "Relegation Playoff", color: "bg-yellow-500", startPos: 16, endPos: 16 },
        { name: "Relegation", color: "bg-red-500", startPos: 17, endPos: 18 },
      ],
    }

    // Default zones if league not found
    const defaultZones = [
      { name: "UEFA Champions League", color: "bg-blue-500", startPos: 1, endPos: 4 },
      { name: "UEFA Europa League", color: "bg-orange-500", startPos: 5, endPos: 6 },
      { name: "Relegation", color: "bg-red-500", startPos: 18, endPos: 20 },
    ]

    const leagueZones = zones[leagueSlug] || defaultZones

    for (const zone of leagueZones) {
      if (position >= zone.startPos && position <= zone.endPos) {
        return zone
      }
    }

    return null
  }

  return (
    <>
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="hero-section py-16 mb-12">
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
                League Standings
              </h1>
            </div>
            <p className="text-gray-300 mb-6">
              Stay updated with the latest standings from all major football leagues around the world.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        <div className="mb-8">
          <Tabs defaultValue="eng.1" onValueChange={setActiveLeague}>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-card/60 p-1">
              {leagues.map((league) => (
                <TabsTrigger
                  key={league.slug}
                  value={league.slug}
                  className="flex items-center gap-2 data-[state=active]:bg-primary"
                >
                  <Image
                    src={league.logo || "/placeholder.svg"}
                    alt={league.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="hidden md:inline">{league.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {leagues.map((league) => (
              <TabsContent key={league.slug} value={league.slug} className="mt-6">
                <div className="premium-card p-6 rounded-xl">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Image
                      src={league.logo || "/placeholder.svg"}
                      alt={league.name}
                      width={40}
                      height={40}
                      className="mr-3 object-contain"
                    />
                    {league.name} Standings
                  </h2>

                  <div className="table-container overflow-x-auto bg-black/20 rounded-lg p-2">
                    <table className="standings-table w-full">
                      <thead>
                        <tr>
                          <th className="w-[5%] rounded-tl-md">#</th>
                          <th className="w-[40%] text-left">Club</th>
                          <th className="text-center">P</th>
                          <th className="text-center">W</th>
                          <th className="text-center">D</th>
                          <th className="text-center">L</th>
                          <th className="text-center">GF</th>
                          <th className="text-center">GA</th>
                          <th className="text-center">GD</th>
                          <th className="text-center rounded-tr-md">PTS</th>
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          {[...Array(20)].map((_, index) => (
                            <tr key={index} className="shimmer">
                              <td className="text-center">
                                <Skeleton className="h-6 w-6 mx-auto" />
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-6 w-6 rounded-full" />
                                  <Skeleton className="h-4 w-32" />
                                </div>
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-4 mx-auto" />
                              </td>
                              <td className="text-center">
                                <Skeleton className="h-4 w-8 mx-auto" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      ) : (
                        <tbody>
                          {standings.map((entry, index) => {
                            const qualificationStatus = getTeamQualificationStatus(index + 1, activeLeague)
                            return (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`hover:bg-white/5 ${qualificationStatus ? `${qualificationStatus.color}/10` : ""}`}
                              >
                                <td
                                  className={`text-center p-3 border-b border-white/10 ${qualificationStatus ? `${qualificationStatus.color}/50` : ""}`}
                                >
                                  {index + 1}
                                </td>
                                <td className="p-3 border-b border-white/10">
                                  <div className="flex items-center gap-2">
                                    {entry.team.logos ? (
                                      <Image
                                        src={entry.team.logos[0].href || "/placeholder.svg"}
                                        alt={entry.team.displayName}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs">
                                        {entry.team.displayName.charAt(0)}
                                      </div>
                                    )}
                                    <span>{entry.team.displayName}</span>
                                    {qualificationStatus && (
                                      <div className="ml-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${qualificationStatus.color}`}
                                          title={qualificationStatus.name}
                                        ></div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "gamesPlayed")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "wins")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "ties")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "losses")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "pointsFor")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "pointsAgainst")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-medium">
                                  {getStatValue(entry.stats, "pointDifferential")}
                                </td>
                                <td className="text-center p-3 border-b border-white/10 font-bold text-primary">
                                  {getStatValue(entry.stats, "points")}
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      )}
                    </table>
                  </div>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                        <span className="text-sm">Champions League</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                        <span className="text-sm">Europa League</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-sm"></div>
                        <span className="text-sm">Conference League</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                        <span className="text-sm">Relegation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  )
}
