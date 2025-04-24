"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Newspaper, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import ParticlesBackground from "@/components/particles-background"

interface Article {
  headline: string
  description: string
  images?: {
    url: string
  }[]
  links: {
    web: {
      href: string
    }
  }
}

interface Match {
  name: string
  competitions: {
    score: string
  }[]
  status: {
    type: {
      detail: string
    }
  }
}

export default function News() {
  const [news, setNews] = useState<Article[]>([])
  const [transfers, setTransfers] = useState<Article[]>([])
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const leagues = ["caf.nations", "uefa.champions", "uefa.europa", "eng.1", "esp.1", "ita.1"]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchNews(), fetchTransfers(), fetchLiveMatches()])
      setLoading(false)
    }

    fetchData()
  }, [])

  const fetchNews = async () => {
    try {
      const newsPromises = leagues.map((league) =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/news`)
          .then((res) => res.json())
          .then((data) => data.articles || []),
      )

      const newsData = (await Promise.all(newsPromises)).flat()
      setNews(newsData.slice(0, 12))
    } catch (error) {
      console.error("Error fetching news:", error)
      setNews([])
    }
  }

  const fetchTransfers = async () => {
    try {
      const transferPromises = leagues.map((league) =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/news`)
          .then((res) => res.json())
          .then((data) =>
            (data.articles || []).filter(
              (article: Article) =>
                article.headline.toLowerCase().includes("transfer") ||
                article.description?.toLowerCase().includes("transfer"),
            ),
          ),
      )

      const transferData = (await Promise.all(transferPromises)).flat()
      setTransfers(transferData.slice(0, 12))
    } catch (error) {
      console.error("Error fetching transfers:", error)
      setTransfers([])
    }
  }

  const fetchLiveMatches = async () => {
    try {
      const matchPromises = leagues.map((league) =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`)
          .then((res) => res.json())
          .then((data) => data.events || []),
      )

      const matches = (await Promise.all(matchPromises)).flat()
      setLiveMatches(matches)
    } catch (error) {
      console.error("Error fetching live matches:", error)
      setLiveMatches([])
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <ParticlesBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center mb-4">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Sports News</h1>
        </div>
      </motion.div>

      <Tabs defaultValue="news" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="news" className="data-[state=active]:bg-primary">
            <Newspaper className="h-4 w-4 mr-2" />
            Latest News
          </TabsTrigger>
          <TabsTrigger value="transfers" className="data-[state=active]:bg-primary">
            Transfer News
          </TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Live Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardHeader className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-xl" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {news.map((article, index) => (
                <motion.div key={index} variants={item}>
                  <Card className="news-card h-full flex flex-col">
                    <div className="overflow-hidden">
                      <Image
                        src={article.images?.[0]?.url || "/images/placeholder-sports.jpg"}
                        alt={article.headline}
                        width={400}
                        height={225}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="text-lg font-bold mb-2">{article.headline}</h3>
                      <p className="text-gray-400 text-sm">{article.description || "No description available."}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <a
                        href={article.links.web.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90"
                      >
                        Read more
                      </a>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="transfers">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardHeader className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-xl" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : transfers.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {transfers.map((article, index) => (
                <motion.div key={index} variants={item}>
                  <Card className="news-card h-full flex flex-col">
                    <div className="overflow-hidden">
                      <Image
                        src={article.images?.[0]?.url || "/images/placeholder-sports.jpg"}
                        alt={article.headline}
                        width={400}
                        height={225}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="text-lg font-bold mb-2">{article.headline}</h3>
                      <p className="text-gray-400 text-sm">{article.description || "No description available."}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <a
                        href={article.links.web.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90"
                      >
                        Read more
                      </a>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500">No transfer news available</div>
          )}
        </TabsContent>

        <TabsContent value="live">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : liveMatches.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {liveMatches.map((match, index) => (
                <motion.div key={index} variants={item}>
                  <Card className="bg-black/40 backdrop-blur-md border-white/10 border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">{match.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{match.status.type.detail}</span>
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        </div>
                      </div>
                      <p className="text-gray-400 mt-2">Score: {match.competitions[0].score || "TBD"}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500">No live matches currently in progress</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
