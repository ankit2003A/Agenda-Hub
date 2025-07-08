import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Home,
  Calendar,
  MessageSquare,
  User,
  PanelLeft,
  Search,
  Settings,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import React, { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { Toaster } from "sonner";

const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ];

export const VanishContext = React.createContext({ triggerVanish: () => {} });

function Sidebar() {
    const { pathname } = useLocation();
    return (
        <div className="hidden border-r bg-background lg:block fixed left-0 top-0 h-full w-[280px] z-20">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-6">
                    <Link to="/" className="flex items-center gap-2 font-semibold">
                        <span className="text-2xl">🔥</span>
                        <span>Agenda Hub</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                                    pathname === item.href
                                    ? 'bg-muted text-primary'
                                    : 'text-muted-foreground'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <div className="px-4 pb-4 text-xs text-muted-foreground text-center select-none">
                        Running on coffee ☕, writing code 💻, thinking AI 🤖 — Made with care by Ankit Verma & AI ❤️
                    </div>
                </div>
            </div>
        </div>
    )
}

function Header() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [darkMode, setDarkMode] = React.useState(() =>
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const navigate = useNavigate();

    React.useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="lg:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            to="/"
                            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                        >
                            <span className="text-2xl">🔥</span>
                            <span className="sr-only">Agenda Hub</span>
                        </Link>
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`flex items-center gap-4 px-2.5 ${
                                    pathname === item.href
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="relative ml-auto flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setDarkMode(dm => !dm)} aria-label="Toggle dark mode">
                    {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </Button>
                <Button variant="ghost" size="icon">
                    <Bell className="h-6 w-6" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                            <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('/profile')}>My Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  // Vanish animation state
  const [isVanishing, setIsVanishing] = useState(false);
  const [hideMain, setHideMain] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [phase, setPhase] = useState<'dashboard'|'vanish'|'burst'|'congrats'>('dashboard');

  const triggerVanish = useCallback(() => {
    setIsVanishing(true);
    setPhase('vanish');
    setTimeout(() => {
      setIsVanishing(false);
      setHideMain(true);
      setShowOverlay(true);
      setPhase('burst');
      setTimeout(() => {
        setPhase('congrats');
      }, 2000);
    }, 2000);
  }, []);

  const handleRestoreDashboard = () => {
    setShowOverlay(false);
    setPhase('dashboard');
    setHideMain(false);
  };

  return (
    <VanishContext.Provider value={{ triggerVanish }}>
    <div className="flex min-h-screen w-full bg-muted/40">
        {!hideMain && (
          <div className={isVanishing ? 'magical-vanish-top-to-bottom' : ''} style={{ width: '100%', display: 'flex' }}>
      <Sidebar />
      <div className={`flex flex-col w-full lg:pl-[280px] ${isChatPage ? 'h-screen' : ''}`}>
        <Header />
        <main className={`flex-1 p-4 sm:px-6 sm:py-4 gap-4 ${isChatPage ? 'h-full overflow-hidden' : ''}`}>
            {children}
        </main>
      </div>
          </div>
        )}
        {/* Magical overlay animation */}
        {showOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 60%, #1a1333 60%, #0a0a1a 100%)' }} onClick={handleRestoreDashboard}>
            {/* Starry background */}
            <svg width="100vw" height="100vh" viewBox="0 0 720 1600" style={{ position: 'absolute', width: '100vw', height: '100vh', zIndex: 1 }}>
              {[...Array(60)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.random() * 720}
                  cy={Math.random() * 1600}
                  r={Math.random() * 1.5 + 0.5}
                  fill="#fff"
                  opacity={Math.random() * 0.5 + 0.2}
                />
              ))}
            </svg>
            {/* Mystical burst */}
            {phase === 'burst' && (
              <svg width="100vw" height="100vh" viewBox="0 0 720 1600" style={{ position: 'absolute', width: '100vw', height: '100vh', zIndex: 2 }}>
                <defs>
                  <radialGradient id="burst" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="60%" stopColor="#ffe600" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="360" cy="800" r="320" fill="url(#burst)" opacity="0.8">
                  <animate attributeName="r" values="0;320;320" dur="2s" />
                  <animate attributeName="opacity" values="1;0.7;0" dur="2s" />
                </circle>
                {/* Party popper confetti bursts */}
                {[...Array(24)].map((_, i) => {
                  const angle = (i / 24) * 2 * Math.PI;
                  const r = 900;
                  const x2 = 360 + Math.cos(angle) * r;
                  const y2 = 800 + Math.sin(angle) * r;
                  const colors = [
                    '#ffe600', '#a855f7', '#00e6d2', '#f472b6', '#ff5e62', '#36f372', '#ffb347', '#00c3ff', '#ff61a6', '#fff',
                  ];
                  const color = colors[i % colors.length];
                  const width = Math.random() * 32 + 24;
                  const height = Math.random() * 120 + 80;
                  return (
                    <rect
                      key={i}
                      x={360 - width / 2}
                      y={800 - height / 2}
                      width={width}
                      height={height}
                      fill={color}
                      opacity={0.95}
                      rx={width / 3}
                      transform={`rotate(${(angle * 180 / Math.PI)},360,800)`}
                    />
                  );
                })}
              </svg>
            )}
            {/* Centered congratulatory message and confetti for congrats phase */}
            {phase === 'congrats' && (
              <>
                <div className="relative z-10 flex flex-col items-center justify-center w-full">
                  <div
                    className="text-2xl md:text-3xl font-bold text-center whitespace-pre-line"
                    style={{
                      color: '#fff',
                      textShadow: '0 0 24px #a855f7, 0 0 48px #f472b6, 0 0 8px #fff',
                      filter: 'drop-shadow(0 0 32px #a855f7) drop-shadow(0 0 16px #ffe600)',
                      animation: 'pop-bounce-glow 1.2s cubic-bezier(.7,1.7,.7,1) both',
                    }}
                  >
                    <div>Pause everything for a moment.</div>
                    <div className="mt-4">Sit back, smile, and breathe deeply.</div>
                    <div className="mt-4">Sip some water, close your eyes,</div>
                    <div>and let your mind drift into peace.</div>
                    <div className="mt-6">You deserve this calm.</div>
                  </div>
                  <div className="mt-8 text-lg text-white/80 animate-fadeIn-glow">✨ Tap anywhere to return ✨</div>
                </div>
                {/* Confetti and sparkles for congrats phase */}
                <svg width="100vw" height="100vh" viewBox="0 0 720 1600" style={{ position: 'absolute', width: '100vw', height: '100vh', zIndex: 2, pointerEvents: 'none' }}>
                  {[...Array(120)].map((_, i) => {
                    const angle = Math.random() * 2 * Math.PI;
                    const r = 80 + Math.random() * 320;
                    const x = 360 + Math.cos(angle) * r;
                    const y = 800 + Math.sin(angle) * r + Math.random() * 400;
                    const colors = [
                      '#ffe600', '#a855f7', '#00e6d2', '#f472b6', '#ff5e62', '#36f372', '#ffb347', '#00c3ff', '#ff61a6', '#fff',
                    ];
                    const color = colors[i % colors.length];
                    const width = Math.random() * 24 + 12;
                    const height = Math.random() * 48 + 16;
                    const rotate = Math.random() * 360;
                    return (
                      <rect
                        key={i}
                        x="360"
                        y="800"
                        width={width}
                        height={height}
                        fill={color}
                        opacity={0.95}
                        rx={width / 3}
                        transform={`rotate(${rotate},360,800)`}
                      >
                        <animate
                          attributeName="x"
                          values={`360;${x}`}
                          dur="1.4s"
                          begin="0s"
                          repeatCount="1"
                          fill="freeze"
                        />
                        <animate
                          attributeName="y"
                          values={`800;${y}`}
                          dur="1.4s"
                          begin="0s"
                          repeatCount="1"
                          fill="freeze"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.95;0.2;0"
                          dur="1.4s"
                          begin="0s"
                          repeatCount="1"
                          fill="freeze"
                        />
                      </rect>
                    );
                  })}
                </svg>
              </>
            )}
          </div>
        )}
      <Toaster richColors />
    </div>
    </VanishContext.Provider>
  );
} 