"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Send, 
  Camera, 
  X, 
  PenTool, 
  Star,
  Crown,
  Sun,
  Moon
} from "lucide-react";
import { 
  db, 
  auth, 
  OperationType, 
  handleFirestoreError, 
  testConnection, 
  initiateAnonymousAuth 
} from "@/lib/firebase";

// --- CHERISHED PHOTOS OF THERESA WITH BEAUTIFUL CORRESPONDING FALLBACK PHOTOS ---
interface MemoryPhoto {
  url: string;
  fallbackUrl: string;
  title: string;
}

const MEMORIES: MemoryPhoto[] = [
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153207/IMG_4894_xcjwqm.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f1/800/600",
    title: "Moments of Joy"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153206/IMG_4893_jkhlk8.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f2/800/600",
    title: "Elegant Celebration"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153204/IMG_4874_thbozq.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f3/800/600",
    title: "A Precious Smile"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153201/IMG_4836_u6jw4s.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f4/800/600",
    title: "Warm Embrace"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153200/IMG_4835_bhxk9v.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f5/800/600",
    title: "Cherished Blessing"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153173/TopPhoto1_zors8l.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f6/800/600",
    title: "Bright Horizons"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153129/IMG_5405_joc4ju.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f7/800/600",
    title: "Tapestry of Love"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153125/IMG_4955_bmofcq.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f8/800/600",
    title: "Radiant Queen"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153165/FullSizeRender_2_hlxwoo.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f9/800/600",
    title: "Gracious Moments"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153128/IMG_5362_rmezmn.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f10/800/600",
    title: "Laughter & Solace"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153126/IMG_5016_hbkwxg.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f11/800/600",
    title: "A Noble Heart"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153124/IMG_4925_opcqov.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f12/800/600",
    title: "Faith & Devotion"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153174/IMG_0945_bshuno.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f13/800/600",
    title: "Peaceful Sanctuary"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153175/IMG_0946_1_qjfcvz.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f14/800/600",
    title: "Golden Milestones"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153176/IMG_0947_s8k8hv.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f15/800/600",
    title: "Eternal Gratitude"
  },
  { 
    url: "https://res.cloudinary.com/savvyone/image/upload/v1781153202/IMG_4844_aja7qq.jpg", 
    fallbackUrl: "https://picsum.photos/seed/theresa_f16/800/600",
    title: "Virtuous Inspiration"
  }
];

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0: Cover, 1: Tribute, 2: Gallery, 3: Video, 4: Guestbook
  const [wishes, setWishes] = useState<any[]>([]);
  const [activePhoto, setActivePhoto] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states
  const [senderName, setSenderName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", text: "" }); // "success" | "error" | ""

  // Gemini API States
  const [polishingWish, setPolishingWish] = useState(false);
  const [isCreatingPoem, setIsCreatingPoem] = useState(false);
  const [poemTraits, setPoemTraits] = useState("");
  const [poemTone, setPoemTone] = useState("elegant & poetic");
  const [generatedPoem, setGeneratedPoem] = useState("");
  const [generatingPoem, setGeneratingPoem] = useState(false);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Initialize Connection Testing and Anonymous Auth on Mount
  useEffect(() => {
    testConnection();
    initiateAnonymousAuth();

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("theme", nextVal ? "dark" : "light");
    if (nextVal) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // --- REAL-TIME FIRESTORE WISHES BOARD SUBSCRIPTION ---
  useEffect(() => {
    if (!isAuthenticated) return;
    const wishesCollection = collection(db, "artifacts", "theresa-celebration-portal", "public", "data", "wishes");

    // Real-time listener conforming to the strict database-coupling error patterns
    const unsubscribe = onSnapshot(
      wishesCollection,
      (snapshot) => {
        const loadedWishes: any[] = [];
        snapshot.forEach((doc) => {
          loadedWishes.push({ id: doc.id, ...doc.data() });
        });

        // Client-side filtering & sorting (supporting both spelling entries gracefully so no content is lost)
        const theresaWishes = loadedWishes
          .filter(wish => wish.recipient === "theresa" || wish.recipient === "therese")
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA; // Newest first
          });

        setWishes(theresaWishes);
      },
      (error) => {
        handleFirestoreError(
          error, 
          OperationType.LIST, 
          "artifacts/theresa-celebration-portal/public/data/wishes"
        );
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);


  // --- EXTENDED FULL-STACK SERVER PROXY GEMINI API INTERACTION ---
  const callPolishedServerGeminiApi = async (payload: {
    action: string;
    text?: string;
    traits?: string;
    tone?: string;
  }) => {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}));
      throw new Error(errPayload.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.text || "";
  };

  // 1. AI Wish Polishing
  const handlePolishWish = async () => {
    if (!messageText.trim()) {
      showStatus("error", "Please write down some rough thoughts or keywords in the wish box first!");
      return;
    }
    setPolishingWish(true);
    try {
      const refinedText = await callPolishedServerGeminiApi({
        action: "polish",
        text: messageText,
      });

      setMessageText(refinedText);
      showStatus("success", "Your birthday wish has been polished beautifully with ✨ Gemini AI!");
    } catch (err: any) {
      console.error(err);
      showStatus("error", err.message || "AI Polishing is currently offline. Please try typing your draft.");
    } finally {
      setPolishingWish(false);
    }
  };

  // 2. AI Poetry Generation
  const handleGeneratePoem = async () => {
    if (!poemTraits.trim()) {
      showStatus("error", "Please share some wonderful traits, details, or stories to inspire the poet!");
      return;
    }
    setGeneratingPoem(true);
    try {
      const responseText = await callPolishedServerGeminiApi({
        action: "poem",
        traits: poemTraits,
        tone: poemTone,
      });

      setGeneratedPoem(responseText);
      showStatus("success", "Bespoke commemorative poem written with ✨ Gemini AI!");
    } catch (err: any) {
      console.error(err);
      showStatus("error", err.message || "Poem composition temporarily unavailable. Please try again.");
    } finally {
      setGeneratingPoem(false);
    }
  };

  // --- CLOUDINARY AUDIO TRACK PLAYER ---
  const startAudio = () => {
    try {
      if (!audioRef.current) {
        const audio = new Audio("https://res.cloudinary.com/savvyone/video/upload/v1781156995/Theresa_On_Zoom_ax7awn.wav");
        audio.loop = true;
        audioRef.current = audio;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio playback initiated but was blocked by browser autoplay policies:", err);
      });
    } catch (e) {
      console.warn("Audio initialization failed:", e);
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) {
      startAudio();
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error("Audio play failed:", err);
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- IMAGE UPLOAD COMPRESSION & HANDLING ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      showStatus("error", "Please choose a photo size smaller than 40MB to optimize successfully.");
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadLoading(false);
      showStatus("error", "Failed to read the image file.");
    };
    reader.onload = (event: any) => {
      const img = new (window as any).Image();
      img.onerror = () => {
        setUploadLoading(false);
        showStatus("error", "Failed to load image file.");
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 450;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.65);
          setAttachedPhoto(compressedBase64);
          showStatus("success", "Memory photo attached and optimized successfully.");
        }
        setUploadLoading(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const showStatus = (type: "success" | "error", text: string) => {
    setSubmitStatus({ type, text });
    setTimeout(() => setSubmitStatus({ type: "", text: "" }), 6000);
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !messageText.trim()) {
      showStatus("error", "Kindly provide both your name and a heartfelt wish to register.");
      return;
    }

    try {
      const wishesCollection = collection(db, "artifacts", "theresa-celebration-portal", "public", "data", "wishes");
      
      // Call addDoc securely handled with corresponding catch pattern
      await addDoc(wishesCollection, {
        name: senderName.trim(),
        message: messageText.trim(),
        photoBase64: attachedPhoto || null,
        recipient: "theresa", 
        createdAt: serverTimestamp()
      });

      setSenderName("");
      setMessageText("");
      setAttachedPhoto("");
      showStatus("success", "Your sparkling blessing is safely saved in Theresa's festival time capsule!");
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(
        err, 
        OperationType.CREATE, 
        "artifacts/theresa-celebration-portal/public/data/wishes"
      );
      showStatus("error", "Unable to log wish. Check your internet connection or reload the portal.");
    }
  };

  const handleOpenEnvelope = () => {
    setIsOpen(true);
    if (!isPlaying && !audioRef.current) {
      startAudio();
    }
  };

  const TABS = [
    { label: "Welcome Cover", icon: "❀", activeBg: "bg-amber-600", hoverBg: "hover:bg-amber-100", activeText: "text-white" }, 
    { label: "Tribute & Poetry", icon: "✉", activeBg: "bg-violet-700", hoverBg: "hover:bg-purple-100", activeText: "text-white" }, 
    { label: "Memory Lane", icon: "✦", activeBg: "bg-teal-700", hoverBg: "hover:bg-teal-100", activeText: "text-white" }, 
    { label: "Tribute Video", icon: "▶", activeBg: "bg-rose-700", hoverBg: "hover:bg-rose-100", activeText: "text-white" },
    { label: "Wishes Guestbook", icon: "✎", activeBg: "bg-[#800020]", hoverBg: "hover:bg-pink-100", activeText: "text-white" } 
  ];

  return (
    <div className="min-h-screen text-[#1E0B14] dark:text-[#FAF3F6] font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-[#800020]/20 select-none pb-6">
      
      {/* --- BACKBONE DECORATIONS AND VIBRANT BACKGROUND --- */}
      <div className="absolute inset-0 z-0 overflow-hidden animate-[fadeIn_1s_ease-out]">
        <img 
          src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200" 
          alt="Theresa Backdrop" 
          className="w-full h-full object-cover filter blur-[6px] scale-105 opacity-30 saturate-150"
          referrerPolicy="no-referrer"
          onError={(e: any) => {
            // Elegant placeholder photo fallback
            e.target.src = "https://picsum.photos/seed/bloom/1920/1080";
            e.target.className = "w-full h-full object-cover filter blur-[10px] opacity-25 scale-105";
          }}
        />
        {/* Colorful dynamic radiant overlay representing Theresa's favorite color spectrum: purple, teal, burgundy, orange */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/30 via-[#14B8A6]/20 to-amber-500/15 mix-blend-multiply dark:opacity-40"></div>
        <div className="absolute inset-0 bg-white/45 dark:bg-[#12050E]/85"></div>
      </div>

      {/* Floating Sparkling Orbs representing celebration elements */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-40">
        <div className="absolute top-[12%] left-[18%] w-3 h-3 rounded-full bg-purple-500 animate-ping"></div>
        <div className="absolute top-[32%] right-[12%] w-4 h-4 rounded-full bg-amber-400 animate-bounce"></div>
        <div className="absolute bottom-[22%] left-[6%] w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
        <div className="absolute bottom-[18%] right-[22%] w-3.5 h-3.5 rounded-full bg-[#800020] animate-pulse"></div>
        <div className="absolute top-[58%] left-[48%] w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce"></div>
      </div>

      {/* --- PORTAL NAVIGATION HEADER --- */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center z-20">
        {/* Left Side spacer or close envelope button on desktop */}
        <div className="w-full md:w-1/4 flex justify-center md:justify-start order-2 md:order-1">
          {isOpen && (
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] uppercase tracking-widest font-black text-[#800020] dark:text-amber-300 hover:text-[#14B8A6] dark:hover:text-amber-200 flex items-center gap-2 transition-colors duration-200"
            >
              ◀ Close Envelope
            </button>
          )}
        </div>

        {/* Centered Cursive Title */}
        <div className="flex justify-center items-center gap-3 order-1 md:order-2 md:flex-grow">
          <div className="bg-white/75 dark:bg-[#250818]/90 px-6 py-2 rounded-full shadow-lg border border-[#800020]/15 dark:border-amber-500/20 backdrop-blur-md flex items-center gap-3">
            <span className="font-cursive text-3xl sm:text-4xl tracking-wide font-normal bg-gradient-to-r from-rose-900 via-purple-700 to-rose-950 dark:from-amber-300 dark:via-amber-400 dark:to-yellow-350 bg-clip-text text-transparent">
              {"Theresa's Festival of Life"}
            </span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>
        </div>

        {/* Header Control Buttons Row on the Right */}
        <div className="w-full md:w-1/4 flex justify-center md:justify-end items-center gap-3 order-3">
          {/* Dynamic Light/Dark Theme Switcher */}
          <button
            onClick={toggleDarkMode}
            id="toggle-dark-mode"
            className="p-2 sm:p-2.5 bg-white/80 dark:bg-[#250818]/90 border border-[#800020]/10 dark:border-amber-500/20 rounded-full shadow-md text-[#800020] dark:text-amber-300 hover:scale-[1.06] transition-transform duration-200"
            title="Toggle Theme Mode"
          >
            {darkMode ? (
              <Sun size={15} className="animate-[spin_6s_linear_infinite]" />
            ) : (
              <Moon size={15} />
            )}
          </button>

          {/* Ambient Synthesizer Custom Controller */}
          <div className="flex items-center gap-3 bg-white/80 dark:bg-[#250818]/90 px-4 py-2 rounded-full border border-[#800020]/10 dark:border-amber-500/20 shadow-sm">
            {isPlaying && (
              <div className="flex gap-0.5 items-end h-3 px-1">
                <span className="w-0.5 bg-[#800020] animate-[bounce_0.8s_infinite_100ms] h-full"></span>
                <span className="w-0.5 bg-teal-500 animate-[bounce_0.8s_infinite_300ms] h-2.5"></span>
                <span className="w-0.5 bg-amber-500 animate-[bounce_0.8s_infinite_200ms] h-3"></span>
                <span className="w-0.5 bg-orange-500 animate-[bounce_0.8s_infinite_400ms] h-2"></span>
              </div>
            )}
            <button 
              onClick={toggleMusic}
              id="toggle-audio-btn"
              className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-[#800020] dark:text-amber-300 hover:text-teal-600 dark:hover:text-amber-200 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Volume2 size={13} className="text-teal-600 dark:text-teal-400 animate-pulse" />
                  <span>SOUNDTRACK ACTIVE</span>
                </>
              ) : (
                <>
                  <VolumeX size={13} className="text-gray-400 dark:text-gray-500" />
                  <span>PLAY SOUNDTRACK</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- PORTAL STAGE CONTAINER --- */}
      <main className="flex-grow flex items-center justify-center px-4 relative z-10 py-6">
        <AnimatePresence mode="wait">
          
          {/* CLOSED STATE: ENVELOPE LOBBY SCREEN */}
          {!isOpen && (
            <motion.div 
            key="closed-envelope"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-lg text-center py-8"
            >
              <div 
                id="envelope-trigger"
                onClick={handleOpenEnvelope}
                className="relative group cursor-pointer inline-block"
              >
                {/* Immersive 3D styled celebration envelope styled in rich royal details */}
                <div className="w-72 h-44 sm:w-85 sm:h-52 bg-white dark:bg-[#1E0814] rounded-2xl shadow-2xl border-4 border-[#800020]/30 dark:border-amber-500/25 relative flex items-center justify-center p-4 transform group-hover:-translate-y-3 transition-transform duration-500 ease-out">
                  
                  {/* Vibrant Colorful Top Envelope Trim representing favorite burgundy, teal, orange, violet hues */}
                  <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-[#800020] via-purple-600 via-teal-500 via-amber-400 via-orange-500 to-[#800020] rounded-t-xl opacity-90"></div>
                  <div className="absolute top-4 inset-x-0 h-1/2 border-b border-dashed border-[#800020]/20 dark:border-amber-500/10 rounded-t-lg"></div>
                  
                  {/* Majestic Golden Sealing Wax */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800020] via-purple-900 to-[#800020] shadow-xl flex flex-col items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-110 active:scale-95 border-2 border-amber-300">
                    <Crown size={18} className="text-amber-300 transform -rotate-6 animate-pulse absolute top-2.5" />
                    <span className="font-serif font-black text-amber-300 text-2xl tracking-tighter leading-none mt-4 select-none">
                      71
                    </span>
                    <span className="absolute inset-0.5 rounded-full border border-amber-300/20"></span>
                    <span className="absolute inset-2 rounded-full border border-dashed border-amber-300/15"></span>
                    <span className="absolute inset-0.5 rounded-full border border-white/20 animate-ping opacity-35"></span>
                  </div>

                  <div className="absolute bottom-3 inset-x-0 text-center">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-[#800020] dark:text-amber-300 animate-pulse">
                      Tap Royal 71 Seal to Open
                    </span>
                  </div>
                </div>
              </div>

              {/* Envelope Card Header Typography */}
              <div className="mt-8 space-y-3 bg-white/85 dark:bg-[#1E0814]/95 p-6 rounded-2xl backdrop-blur-md border border-white/40 dark:border-amber-500/10 max-w-md mx-auto shadow-xl">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#800020] dark:text-amber-300 tracking-wide leading-tight">
                  Happy Birthday, <br />
                  <span className="block font-cursive text-deep-pink text-4xl sm:text-5xl mt-1 text-amber-500 font-medium animate-pulse">Theresa</span>
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-teal-600 dark:text-teal-400">
                  A Royal Digital Memory Box
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                  Proverbs 31:10 – “Who can find a virtuous woman? For her price is far above rubies” emphasizes her incomparable value and excellence
                </p>
              </div>
            </motion.div>
          )}

          {/* OPENED STATE: DUAL-PAGE INTERACTIVE NOTEBOOK */}
          {isOpen && (
            <motion.div 
              key="opened-notebook"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full max-w-6xl min-h-[600px] h-auto md:h-[820px] bg-white dark:bg-[#180510] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border-4 border-[#800020] dark:border-amber-500/60 relative"
            >
              
              {/* Notebook Centre Spine Highlight (For depth accentuation) */}
              <div className="hidden md:block absolute left-[300px] top-0 bottom-0 w-6 bg-gradient-to-r from-black/[0.05] via-transparent to-black/[0.02] z-20 pointer-events-none"></div>

              {/* LEFT INDEX COLUMN: Profile & Notebook Sidebar Nav */}
              <div className="w-full md:w-[300px] bg-gradient-to-b from-white to-[#FAF6F3] dark:from-[#200A15] dark:to-[#180510] border-b md:border-b-0 md:border-r border-[#800020]/20 dark:border-amber-500/15 p-6 flex flex-col justify-between shrink-0">
                
                {/* Profile Portrait card */}
                <div className="flex items-center md:block gap-4 border-b border-[#800020]/10 dark:border-amber-500/10 pb-4 md:pb-0 md:border-b-0">
                  {/* Mobile small avatar */}
                  <div className="block md:hidden w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shadow shrink-0">
                    <img 
                      src="https://res.cloudinary.com/savvyone/image/upload/v1781153246/TopPhoto1_zkhbrj.jpg" 
                      alt="Queen Theresa Portrait" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e: any) => {
                        e.target.src = "https://picsum.photos/seed/portrait/800/600";
                      }}
                    />
                  </div>

                  {/* Desktop large portrait */}
                  <div className="hidden md:block w-full aspect-[3/4] rounded-2xl overflow-hidden relative border-4 border-amber-400 p-1 bg-white dark:bg-[#200A15] shadow-lg group mb-4">
                    <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-50 dark:bg-zinc-900">
                      <img 
                        src="https://res.cloudinary.com/savvyone/image/upload/v1781153246/TopPhoto1_zkhbrj.jpg" 
                        alt="Queen Theresa Portrait" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e: any) => {
                          e.target.src = "https://picsum.photos/seed/portrait/800/600";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#800020]/30 via-transparent to-transparent"></div>
                      <div className="absolute top-2 right-2 bg-amber-400 text-white rounded-full p-1 shadow-md">
                        <Sparkles size={14} className="text-[#800020] animate-spin" style={{ animationDuration: "12s" }} />
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-left space-y-1">
                    <div className="flex items-center gap-1">
                      <h2 className="font-serif text-xl md:text-2xl font-black tracking-wide text-[#800020] dark:text-amber-300">Theresa</h2>
                      <span className="text-base md:text-lg">✨</span>
                    </div>
                    <p className="text-[9px] md:text-[10px] font-black text-teal-600 dark:text-teal-450 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles size={10} className="animate-pulse" />
                      <span>Our Bright & Beautiful Queen</span>
                    </p>
                  </div>
                </div>

                {/* Vertical Notebook Navigation Tabs */}
                <nav className="my-5 md:my-0 space-y-2 flex flex-row flex-wrap md:flex-col justify-between md:justify-start gap-1.5">
                  {TABS.map((tab, idx) => {
                    const isSelected = currentPage === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`grow md:grow-0 text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center md:justify-start gap-3 transition-all duration-300 ${
                          isSelected 
                            ? `${tab.activeBg} ${tab.activeText} font-black shadow-md scale-[1.03] ring-1 ring-[#800020]/20` 
                            : `text-gray-700 dark:text-gray-300 hover:bg-[#800020]/5 dark:hover:bg-amber-500/10 ${tab.hoverBg}`
                        }`}
                      >
                        <span className="text-base">{tab.icon}</span>
                        <span className="hidden sm:inline font-serif">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Back to envelope trigger */}
                <div className="hidden md:block pt-4 border-t border-[#800020]/10 dark:border-amber-500/15">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] uppercase tracking-widest font-black text-[#800020] dark:text-amber-300 hover:text-[#14B8A6] dark:hover:text-amber-200 flex items-center gap-2 transition-colors duration-200"
                  >
                    ◀ Close Envelope
                  </button>
                </div>
              </div>

              {/* RIGHT PAGE COLUMN: Dynamic Page Module Rendering */}
              <div className="flex-grow p-5 sm:p-10 flex flex-col justify-between overflow-y-auto min-h-0 bg-white dark:bg-[#1E0814]">
                
                {/* Active Dynamic Page Stage */}
                <div className="flex-grow flex flex-col min-h-0">
                  
                  {/* --- PAGE 0: WELCOME COVER --- */}
                  {currentPage === 0 && (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 my-auto animate-[fadeIn_0.5s_ease-out]">
                      
                      <div className="flex gap-2 justify-center">
                        <Sparkles size={16} className="text-purple-500 animate-spin" />
                        <Sparkles size={20} className="text-teal-500 animate-bounce" />
                        <Sparkles size={16} className="text-amber-500 animate-pulse" />
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#800020] dark:text-amber-400 font-black">Happy Birthday Tribute</p>
                        <h1 className="font-serif text-4xl sm:text-6xl font-black text-[#800020] dark:text-amber-300 tracking-wide leading-tight">
                          Dearest <span className="font-cursive font-normal text-amber-500 block mt-2 text-5xl sm:text-6xl">Theresa</span>
                        </h1>
                      </div>

                      <div className="w-48 h-1.5 bg-gradient-to-r from-purple-500 via-teal-500 via-amber-400 via-orange-500 to-[#800020] rounded-full shadow-inner"></div>

                      <p className="text-base sm:text-lg font-serif italic text-gray-700 dark:text-gray-300 max-w-sm leading-relaxed">
                        {"Psalm 118:24: \"This is the day that the Lord has made; let us rejoice and be glad in it.\" A reminder to celebrate the gift of life and the joy of another year."}
                      </p>

                      <button 
                        onClick={() => setCurrentPage(1)}
                        className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-600 to-[#800020] hover:from-teal-500 hover:to-blue-600 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.03]"
                      >
                        Turn the Page ➔
                      </button>
                    </div>
                  )}

                  {/* --- PAGE 1: TRIBUTE LETTER & AI POETRY ENGINE --- */}
                  {currentPage === 1 && (
                    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
                      <div className="border-b-2 border-purple-100 dark:border-purple-950/20 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-2xl font-black text-purple-900 dark:text-amber-300 flex items-center gap-2">
                            <span>{isCreatingPoem ? "Custom AI Poetry" : "A Devoted Blessing"}</span>
                            <Sparkles size={16} className="text-amber-500" />
                          </h3>
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {isCreatingPoem ? "Bespoke literary generation for Theresa" : "Written with love and high admiration"}
                          </p>
                        </div>
                        
                        {/* Toggle between Static Letter and AI Poet */}
                        <button
                          onClick={() => setIsCreatingPoem(!isCreatingPoem)}
                          className="text-xs font-bold tracking-wider px-4 py-2 rounded-full border-2 border-purple-500/30 dark:border-amber-500/15 bg-[#FAF6F5] dark:bg-[#200A15]/80 hover:bg-purple-700 dark:hover:bg-purple-800 hover:text-white hover:border-purple-700 dark:hover:border-purple-850 text-purple-800 dark:text-amber-300 transition-all flex items-center justify-center gap-1.5 self-start shadow-sm"
                        >
                          {isCreatingPoem ? (
                            <>
                              <BookOpen size={13} />
                              <span>View Classic Letter</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>Generate AI Poem</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {!isCreatingPoem ? (
                        // CLASSIC LETTER VIEW
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4 font-serif text-base text-gray-800 dark:text-gray-300 leading-relaxed italic max-h-[360px] sm:max-h-[400px] custom-scrollbar">
                          <p className="not-italic font-sans text-xs tracking-widest text-[#800020] dark:text-amber-400 uppercase font-black">To Our Beloved Theresa,</p>
                          
                          <p>
                            On this monumental day, we pause to celebrate the magnificent light you represent in our lives. Your elegance is not merely in how you walk through the world, but in the peaceful sanctuary you build for everyone lucky enough to be near you.
                          </p>
                          <p>
                            In your eyes, we see a graceful depth; in your actions, a profound devotion to those you love. You have navigated seasons with quiet strength, turning challenges into tapestries of wisdom.
                          </p>
                          <p>
                            Our prayer for you this year is a simple one: may you feel matching portions of the happiness, solace, and laughter you so effortlessly gift to others. May the universe open wide to bless your health, clear your path, and shower your heart with abundant wonders.
                          </p>

                          <p className="not-italic font-sans text-xs tracking-widest text-teal-600 uppercase font-black pt-4">With endless love and prayers,</p>
                          <p className="font-serif text-lg font-bold text-[#800020] tracking-wider not-italic">Your Family & Friends</p>
                        </div>
                      ) : (
                        // AI POEM COMPOSER VIEW
                        <div className="flex-grow overflow-y-auto pr-1 max-h-[365px] sm:max-h-[400px] custom-scrollbar space-y-4">
                          {!generatedPoem ? (
                            <div className="space-y-4 p-1">
                              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                                {"Let's weave Theresa's unique personality, grace, and milestones into a customized legacy track. Describe her personality below."}
                              </p>
                              
                              <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-widest text-[#800020] dark:text-amber-400 font-black">{"Theresa's Distinctive Attributes"}</label>
                                <textarea
                                  value={poemTraits}
                                  onChange={(e) => setPoemTraits(e.target.value)}
                                  placeholder="e.g., her quiet wisdom, her warm, welcoming smile, her favorite rich colors, her elegant tiara, and her devotion to family"
                                  className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-900 border-2 border-purple-100 dark:border-purple-950/45 text-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:border-purple-600 transition-all h-20 resize-none font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-widest text-[#800020] dark:text-amber-400 font-black">Aesthetic Tone</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: "Elegant & Poetic", value: "elegant & poetic" },
                                    { label: "Warm & Comforting", value: "warm & comforting" },
                                    { label: "Spiritual & Blessing", value: "highly spiritual and filled with blessings" }
                                  ].map((toneOption) => (
                                    <button
                                      key={toneOption.value}
                                      type="button"
                                      onClick={() => setPoemTone(toneOption.value)}
                                      className={`py-1.5 px-2 rounded-md text-[10px] font-sans font-bold transition-all border ${
                                        poemTone === toneOption.value
                                          ? "bg-purple-600 border-purple-600 text-white font-extrabold"
                                          : "border-gray-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-850 text-gray-600 dark:text-gray-300"
                                      }`}
                                    >
                                      {toneOption.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleGeneratePoem}
                                disabled={generatingPoem || !poemTraits.trim()}
                                className="w-full py-2.5 bg-purple-600 hover:bg-[#800020] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-black tracking-widest uppercase rounded-lg shadow transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                {generatingPoem ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>Weaving Words...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} />
                                    <span>Compose Poetic Blessing</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            // Poem Composition results
                            <div className="space-y-4 animate-[fadeIn_0.4s_ease-out] p-1">
                              <div className="bg-gradient-to-br from-purple-50/50 via-white to-amber-50/30 dark:from-[#200A15]/40 dark:via-[#180510] dark:to-[#1E0814]/30 p-5 rounded-2xl border-2 border-purple-100 dark:border-purple-950/25 shadow-inner relative">
                                <div className="absolute top-2 right-2 text-[10px] text-purple-600 dark:text-amber-400 font-sans font-bold flex items-center gap-1">
                                  <Sparkles size={11} className="animate-spin" />
                                  <span>Gemini AI Poetry</span>
                                </div>
                                <pre className="font-serif italic whitespace-pre-wrap text-sm text-[#1E0B14] dark:text-gray-300 leading-relaxed text-center font-medium max-h-[250px] overflow-y-auto custom-scrollbar">
                                  {generatedPoem}
                                </pre>
                              </div>

                              <div className="flex gap-2.5">
                                <button
                                  onClick={() => {
                                    setMessageText(generatedPoem);
                                    setCurrentPage(4); // transition to guestbook
                                    showStatus("success", "Poem successfully drafted into your Guestbook wish box!");
                                  }}
                                  className="flex-1 py-2.5 border-2 border-purple-600 dark:border-amber-500/40 text-purple-600 dark:text-amber-300 hover:bg-purple-50 dark:hover:bg-amber-500/10 text-xs font-black tracking-widest uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                                >
                                  <PenTool size={13} />
                                  <span>Use in Guestbook</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setGeneratedPoem("");
                                    setPoemTraits("");
                                  }}
                                  className="py-2.5 px-4 bg-purple-100 dark:bg-zinc-800 hover:bg-purple-200 dark:hover:bg-zinc-700 text-purple-800 dark:text-amber-300 text-xs font-bold tracking-widest uppercase rounded-lg transition-all duration-200"
                                >
                                  Try Another
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- PAGE 2: MEMORY LANE (GALLERY) --- */}
                  {currentPage === 2 && (
                    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
                      <div className="border-b-2 border-teal-100 dark:border-teal-950/20 pb-3 mb-4">
                        <h3 className="font-serif text-2xl font-black text-teal-900 dark:text-amber-300 flex items-center gap-2">
                          <span>Memory Lane</span>
                          <Heart size={16} className="text-teal-600 dark:text-teal-450" />
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Glimpses of beauty, joy, elegance and light</p>
                      </div>

                      <div className="flex-grow overflow-y-auto max-h-[360px] sm:max-h-[420px] pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {MEMORIES.map((photo, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ y: -4 }}
                              onClick={() => setActivePhoto(photo)}
                              className="bg-white dark:bg-[#200A15]/90 p-2 border-2 border-teal-100/60 dark:border-teal-950/20 rounded-2xl shadow-md cursor-zoom-in group transition-shadow duration-300 hover:shadow-xl"
                            >
                              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-900 rounded-xl relative">
                                <img 
                                  src={photo.url} 
                                  alt={photo.title} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                                  onError={(e: any) => {
                                    // Robust Unsplash/picsum fallback link
                                    e.target.src = photo.fallbackUrl;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              </div>
                              <p className="text-[9px] font-sans font-bold text-teal-800 dark:text-teal-400 mt-2 truncate text-center uppercase tracking-wide">
                                {photo.title}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- PAGE 3: TRIBUTE VIDEO --- */}
                  {currentPage === 3 && (
                    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
                      <div className="border-b-2 border-rose-100 dark:border-rose-950/20 pb-3 mb-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-serif text-2xl font-black text-rose-900 dark:text-amber-300 flex items-center gap-2">
                            <span>Tribute Video</span>
                            <span className="text-[#800020] dark:text-amber-400">♥</span>
                          </h3>
                          <p className="text-[10px] uppercase font-bold text-gray-400">Honoring Theresa's journey and beautiful moments</p>
                        </div>
                        <div className="text-right px-2">
                          <span className="font-cursive text-[#800020] dark:text-amber-300 text-2xl font-black">Theresa</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
                        {/* Video Embed */}
                        <div className="lg:col-span-8 flex flex-col justify-between">
                          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border-4 border-amber-400/30 bg-black relative group">
                            <iframe
                              width="100%"
                              height="100%"
                              src="https://www.youtube.com/embed/Pe-1XS5RU9o"
                              title="Theresa's Tribute Video"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="w-full h-full"
                            ></iframe>
                          </div>
                          <div className="mt-3">
                            <h4 className="font-serif text-base font-black text-[#800020] dark:text-amber-300">Celebrating Theresa</h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">A visual showcase of memories, milestones, and family blessings.</p>
                          </div>
                        </div>
                        {/* Memory Lane Preview Column */}
                        <div className="lg:col-span-4 flex flex-col justify-between min-h-0 bg-slate-50/50 dark:bg-zinc-950/20 rounded-2xl border border-gray-100 dark:border-zinc-800/60 p-4">
                          <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#800020] dark:text-amber-450 mb-2 flex items-center gap-1.5">
                            <Sparkles size={11} className="animate-pulse" />
                            <span>Moments of Grace</span>
                          </p>
                          <div className="flex flex-row lg:flex-col gap-3 overflow-auto flex-grow custom-scrollbar">
                            {MEMORIES.slice(0, 6).map((photo, index) => (
                              <div
                                key={index}
                                onClick={() => setActivePhoto(photo)}
                                className="flex-grow w-24 h-24 lg:w-full lg:h-auto aspect-[4/3] rounded-xl overflow-hidden border-2 border-amber-400/30 hover:border-amber-450 shrink-0 shadow-sm cursor-zoom-in group relative transition-all duration-300 bg-white dark:bg-[#1E0814]"
                              >
                                <img 
                                  src={photo.url} 
                                  alt={photo.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                  onError={(e: any) => e.target.src = photo.fallbackUrl} 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[8px] text-white font-bold tracking-wider uppercase">Expand</span>
                                </div>
                                <div className="absolute bottom-1 left-1 right-1 bg-black/40 backdrop-blur-[2px] py-0.5 px-1 rounded text-[7px] text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {photo.title}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- PAGE 4: GUESTBOOK & AI MESSAGE SENTIMENT POLISHER --- */}
                  {currentPage === 4 && (
                    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
                      <div className="border-b-2 border-[#800020]/20 dark:border-amber-500/10 pb-3 mb-4">
                        <h3 className="font-serif text-2xl font-black text-[#800020] dark:text-amber-300 flex items-center gap-2">
                          <span>Wishes Guestbook</span>
                          <PenTool size={16} className="text-[#800020] dark:text-amber-400" />
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Post heartfelt messages and upload beautiful memories instantly</p>
                      </div>

                      {/* Split Input Grid & Message Board view */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
                        
                        {/* LEFT: GUESTBOOK FORM */}
                        <form onSubmit={handleSubmitWish} className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-[#800020] dark:text-amber-400 font-black mb-1">Your Name</label>
                              <input 
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="e.g., Sister Maria"
                                className="w-full text-xs px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#800020] dark:focus:border-[#800020]/50 focus:bg-white dark:focus:bg-[#200A15]/40 text-gray-800 dark:text-gray-100 transition-all font-sans"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] uppercase tracking-widest text-[#800020] dark:text-amber-400 font-black">Your blessing</label>
                                
                                {/* Gemini AI Message Polisher Trigger */}
                                <button
                                  type="button"
                                  onClick={handlePolishWish}
                                  disabled={polishingWish || !messageText.trim()}
                                  className="text-[9px] font-black tracking-wider text-[#800020] dark:text-gray-900 disabled:opacity-40 transition-all flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 hover:bg-[#800020] hover:text-white dark:hover:bg-amber-300 dark:hover:text-gray-800 shadow-sm border border-[#800020]/10"
                                  title="Type simple words, then hit to make it sound premium and professional!"
                                >
                                  {polishingWish ? (
                                    <span className="animate-pulse flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin"></span>
                                      <span>Polishing...</span>
                                    </span>
                                  ) : (
                                    <>
                                      <Sparkles size={11} className="animate-pulse" />
                                      <span>POLISH WITH AI</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Write your heartfelt birthday wishes or prayers here..."
                                className="w-full text-xs p-3.5 bg-slate-50 dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#800020] dark:focus:border-[#800020]/50 focus:bg-white dark:focus:bg-[#200A15]/40 text-gray-800 dark:text-gray-100 transition-all h-24 resize-none font-sans"
                              />
                            </div>

                            {/* PHOTO ATTACHMENT */}
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-[#800020] dark:text-amber-400 font-black mb-1">
                                Attach a Photo (Optional)
                              </label>
                              <div className="flex items-center gap-4">
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-xl transition-all">
                                  <Camera size={16} className="text-[#800020] dark:text-amber-300" />
                                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Choose file</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                  />
                                </label>
                                {uploadLoading && <span className="text-[10px] text-gray-500 animate-pulse">Compressing...</span>}
                                {attachedPhoto && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                                    <img src={attachedPhoto} alt="Attached miniature" className="w-full h-full object-cover animate-heartPulse" />
                                    <button
                                      type="button"
                                      onClick={() => setAttachedPhoto("")}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 shadow select-none"
                                      title="Remove Photo"
                                      aria-label="Remove Photo"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 mt-4 bg-[#800020] hover:bg-teal-600 text-white text-xs font-black tracking-widest uppercase rounded-xl shadow-lg transition-all transform hover:scale-[1.01]"
                          >
                            Send Blessing ➔
                          </button>
                        </form>
                                 {/* RIGHT: REAL-TIME WISHES BOARD */}
                        <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/50 dark:bg-zinc-950/20 rounded-2xl border border-gray-100 dark:border-zinc-800/60 p-4">
                          <p className="text-[10px] uppercase tracking-wider font-extrabold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
                            <span>Live Wishes Board ({wishes.length})</span>
                          </p>

                          {/* --- SHARED GUEST MOMENTS STRIP --- */}
                          {(() => {
                            const wishesWithPhotos = wishes.filter(w => w.photoBase64);
                            if (wishesWithPhotos.length === 0) return null;
                            return (
                              <div className="mb-4 bg-white dark:bg-[#15040B] p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/40 shadow-sm">
                                <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#800020] dark:text-amber-450 mb-1.5">
                                  Shared Photos ({wishesWithPhotos.length})
                                  <span className="text-[8px] font-normal text-gray-400 dark:text-gray-500 lowercase ml-1">(click to expand)</span>
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                                  {wishesWithPhotos.map((wish) => (
                                    <button
                                      key={wish.id}
                                      type="button"
                                      onClick={() => setActivePhoto({ url: wish.photoBase64, title: "Memory from " + wish.name, fallbackUrl: "" })}
                                      className="w-12 h-12 rounded-lg overflow-hidden border border-amber-400/50 hover:border-amber-400 shrink-0 hover:scale-105 active:scale-95 transition-all shadow-sm relative group"
                                      title={`View photo shared by ${wish.name}`}
                                      aria-label={`View photo shared by ${wish.name}`}
                                    >
                                      <img src={wish.photoBase64} alt={`Photo shared by ${wish.name}`} title={`Photo shared by ${wish.name}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[7px] text-white font-bold tracking-widest uppercase">Zoom</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex-grow overflow-y-auto max-h-[380px] sm:max-h-[460px] pr-2 space-y-3 custom-scrollbar">
                            {wishes.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-500">
                                <Star size={24} className="stroke-1 animate-pulse text-amber-400 mb-2" />
                                <p className="text-xs font-medium">No blessings posted yet. Be the first to leave a sparkly wish!</p>
                              </div>
                            ) : (
                              wishes.map((wish) => (
                                <motion.div
                                  key={wish.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white dark:bg-[#15040B] p-3.5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800/40 flex flex-col gap-2.5"
                                >
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-serif text-sm font-black text-[#800020] dark:text-amber-300">{wish.name}</h4>
                                    <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">
                                      {wish.createdAt?.seconds 
                                        ? new Date(wish.createdAt.seconds * 1000).toLocaleDateString()
                                        : "recently"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed font-serif italic">
                                    "{wish.message}"
                                  </p>
                                  {wish.photoBase64 && (
                                    <div className="w-full max-w-[200px] rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-center p-1">
                                      <img
                                        src={wish.photoBase64}
                                        alt={`Memory from ${wish.name}`}
                                        className="w-full h-auto object-contain rounded cursor-zoom-in hover:opacity-95 transition-opacity"
                                        onClick={() => setActivePhoto({ url: wish.photoBase64, title: "Memory from " + wish.name, fallbackUrl: "" })}
                                      />
                                    </div>
                                  )}
                                </motion.div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notebook Navigation Footer Indicators */}
                <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 font-mono border-t border-gray-100 dark:border-zinc-800 pt-4">
                  <span>PAGE {currentPage + 1} OF 5</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="p-1 px-2.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors text-[#800020] dark:text-amber-300"
                    >
                      PREV
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(4, prev + 1))}
                      disabled={currentPage === 4}
                      className="p-1 px-2.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors text-[#800020] dark:text-amber-300"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- FLOATING LIGHTBOX SCREEN FOR GALLERY --- */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1E0814] p-3 sm:p-5 rounded-2xl max-w-2xl w-full flex flex-col gap-4 shadow-2xl relative border dark:border-amber-500/10"
            >
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 bg-white/80 dark:bg-zinc-800 dark:text-gray-350 hover:bg-red-500 hover:text-white rounded-full p-1.5 transition-colors shadow z-10 text-gray-700"
                title="Close Lightbox"
                aria-label="Close Lightbox"
              >
                <X size={18} />
              </button>

              <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-zinc-900 rounded-xl overflow-hidden relative shadow-inner">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e: any) => {
                    e.target.src = activePhoto.fallbackUrl;
                  }}
                />
              </div>

              <div className="text-center space-y-1">
                <h4 className="font-serif text-lg font-black text-[#800020] dark:text-amber-300 uppercase tracking-wide">
                  {activePhoto.title}
                </h4>
                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                  Memory Lane Collection
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status banner */}
      <AnimatePresence>
        {submitStatus.text && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border-2 text-xs font-bold leading-relaxed max-w-sm z-50 flex items-center gap-3 ${
              submitStatus.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-500/30 dark:border-rose-500/20 text-rose-800 dark:text-rose-300"
            }`}
          >
            <span className="text-xl">
              {submitStatus.type === "success" ? "✨" : "⚠️"}
            </span>
            <p>{submitStatus.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full text-center py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 font-mono z-20">
        © {new Date().getFullYear()} THERESA'S FESTIVAL OF LIFE • POWERED BY AI STUDIO
      </footer>
    </div>
  );
}
