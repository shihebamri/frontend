"use client"

import React, { useState, useRef, useEffect } from "react"
import { DEFAULT_BG_URL } from "@/lib/defaultBg"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Upload, Download, BookOpen } from "lucide-react"
import { fetchAyahImage, fetchMetadata, generateCompositeImage } from "@/lib/quranApi"

export default function QuranAyahGenerator() {
  const [surahAyah, setSurahAyah] = useState("")
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [textColor, setTextColor] = useState("#ffffff")
  const [fontSize, setFontSize] = useState([24])
  const [textPosition, setTextPosition] = useState("center")
  const [gallery, setGallery] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ayahImageUrl, setAyahImageUrl] = useState<string | null>(null)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [surah, setSurah] = useState<number | null>(null)
  const [ayah, setAyah] = useState<number | null>(null)
  const [surahList, setSurahList] = useState<any[]>([])
  const [ayahList, setAyahList] = useState<number[]>([])
  const [ayahText, setAyahText] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validate and fetch backend ayah image URL
  useEffect(() => {
    setCompositeImageUrl(null) // Clear composite image when ayah changes
    setAyahImageUrl(null) // Only show ayah image after button click
    if (!surahAyah.match(/^\d{1,3}:\d{1,3}$/)) {
      setInputError(surahAyah ? "Please enter in the format: surah:ayah (e.g. 2:255)" : null)
      return
    }
    setInputError(null)
  }, [surahAyah])

  // Fetch metadata and populate gallery
  useEffect(() => {
    fetchMetadata().then(setGallery).catch(() => setGallery([]))
  }, [])

  // Show default bg.jpg in preview if no user-uploaded background
  useEffect(() => {
    if (!backgroundImage) {
      setBackgroundImage(DEFAULT_BG_URL)
    }
  }, [])

  // Fetch surah metadata for dropdown
  useEffect(() => {
    fetch("https://api.quran.com/api/v4/chapters?language=en")
      .then(res => res.json())
      .then(data => setSurahList(data.chapters || []))
      .catch(() => setSurahList([]))
  }, [])

  // Update ayah list when surah changes
  useEffect(() => {
    if (surah !== null && surahList.length > 0) {
      const found = surahList.find((s: any) => s.id === surah)
      if (found) {
        setAyahList(Array.from({ length: found.verses_count }, (_, i) => i + 1))
        setAyah(1)
      }
    }
  }, [surah, surahList])

  // Sync surahAyah string for backend compatibility
  useEffect(() => {
    if (surah && ayah) {
      setSurahAyah(`${surah}:${ayah}`)
    }
  }, [surah, ayah])

  // Fetch ayah text when surah or ayah changes
  useEffect(() => {
    if (surah && ayah) {
      fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah}&verse_number=${ayah}`)
        .then(res => res.json())
        .then(data => {
          const verse = data.verses?.[0]?.text_uthmani || "";
          setAyahText(verse);
        })
        .catch(() => setAyahText(""));
    } else {
      setAyahText("");
    }
  }, [surah, ayah])

  // Generate composite image via backend
  const handleGenerateComposite = async () => {
    setLoading(true)
    setCompositeImageUrl(null)
    try {
      if (!surahAyah.match(/^\d{1,3}:\d{1,3}$/)) {
        setInputError("Please enter in the format: surah:ayah (e.g. 2:255)")
        setLoading(false)
        return
      }
      const [sura, ayah] = surahAyah.split(":").map(Number)
      const url = await generateCompositeImage(sura, ayah, backgroundFile || undefined)
      setCompositeImageUrl(url)
    } catch (e) {
      alert("Failed to generate image")
    }
    setLoading(false)
  }

  // Fetch ayah image only when user clicks the button (if composite not generated)
  const handleShowAyahImage = async () => {
    setLoading(true)
    setCompositeImageUrl(null)
    if (!surahAyah.match(/^\d{1,3}:\d{1,3}$/)) {
      setInputError("Please enter in the format: surah:ayah (e.g. 2:255)")
      setLoading(false)
      return
    }
    setInputError(null)
    const [sura, ayah] = surahAyah.split(":").map(Number)
    if (!isNaN(sura) && !isNaN(ayah)) {
      try {
        const url = await fetchAyahImage(sura, ayah)
        setAyahImageUrl(url)
      } catch {
        setAyahImageUrl(null)
      }
    }
    setLoading(false)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Quran Ayah Image Explorer</h1>
          </div>
          <p className="text-gray-600">Search and view Quranic ayah images from the backend API</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Find Ayah Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Surah and Ayah Selectors */}
                <div className="space-y-2">
                  <Label htmlFor="surah-select">Surah</Label>
                  <Select value={surah?.toString() || ""} onValueChange={val => setSurah(Number(val))}>
                    <SelectTrigger id="surah-select" className="text-lg">
                      <SelectValue placeholder="Select Surah" />
                    </SelectTrigger>
                    <SelectContent>
                      {surahList.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.id}. {s.name_simple} ({s.name_arabic})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ayah-select">Ayah</Label>
                  <Select value={ayah?.toString() || ""} onValueChange={val => setAyah(Number(val))} disabled={!surah}>
                    <SelectTrigger id="ayah-select" className="text-lg">
                      <SelectValue placeholder="Select Ayah" />
                    </SelectTrigger>
                    <SelectContent>
                      {ayahList.map(a => (
                        <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Show selected Ayah text below */}
                  {surah && ayah && (
                    <div className="mt-2 p-3 rounded bg-gray-50 border text-lg text-gray-800">
                      {ayahText ? ayahText : "Ayah text will appear here after selection."}
                    </div>
                  )}
                </div>
                {/* Background Upload */}
                <div className="space-y-2">
                  <Label>Background Image (optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBackgroundFile(file);
                          const reader = new window.FileReader();
                          reader.onload = ev => setBackgroundImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Background Image
                    </Button>
                    {backgroundImage && <p className="text-sm text-green-600 mt-2">Background uploaded successfully!</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Preview Area */}
                <div
                  className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center"
                  style={{
                    background: compositeImageUrl
                      ? `url(${compositeImageUrl}) center/contain no-repeat, linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)`
                      : ayahImageUrl
                      ? `url(${ayahImageUrl}) center/contain no-repeat, linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)`
                      : backgroundImage
                      ? `url(${backgroundImage}) center/cover no-repeat`
                      : "linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
                  }}
                >
                  {!compositeImageUrl && ayahImageUrl && (
                    <img src={ayahImageUrl} alt="Ayah" className="max-h-full max-w-full object-contain absolute inset-0 m-auto" />
                  )}
                  {!compositeImageUrl && !ayahImageUrl && (
                    <div className="text-gray-400 text-center w-full">No ayah image found. Enter a valid surah:ayah above.</div>
                  )}
                </div>
                {/* Download Button */}
                {(compositeImageUrl || ayahImageUrl) && (
                  <a
                    href={compositeImageUrl || ayahImageUrl || '#'}
                    download={
                      compositeImageUrl
                        ? `composite-image.png`
                        : ayahImageUrl
                        ? `ayah-image.png`
                        : undefined
                    }
                  >
                    <Button className="w-full bg-blue-500 hover:bg-blue-700 mt-2" size="lg">
                      <Download className="w-4 h-4 mr-2" />
                      Download Image
                    </Button>
                  </a>
                )}
                {/* Show Ayah Image Button */}
                {/* <Button onClick={handleShowAyahImage} className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={loading}>
                  Show Ayah Image
                </Button> */}
                {/* Generate Composite Button */}
                <Button onClick={handleGenerateComposite} className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={loading}>
                  {loading ? "Generating..." : "Generate Composite Image (Backend)"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </>
  )
}
