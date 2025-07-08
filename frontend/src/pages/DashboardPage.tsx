import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { 
    Calendar, 
    Video, 
    MessageSquare, 
    Users, 
    BarChart,
    Plus,
    Clock,
    Contact,
    PlusCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { ScheduleNewMeetingModal } from "../components/ScheduleNewMeetingModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db } from "@/firebase";
import { collection, query, where, getDocs, setDoc, doc, onSnapshot } from "firebase/firestore";
import React from "react";
import { VanishContext } from "@/components/AppLayout";

const StatCard = ({ title, value, icon: Icon, detail = null }) => (
    <Card className="flex flex-col glass glow-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {React.createElement(Icon, { className: "h-5 w-5 text-muted-foreground" })}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </CardContent>
    </Card>
);

const ActionCard = ({ title, description, buttonText, buttonColor = "", icon: Icon, to, className }) => (
    <Card className={`flex flex-col glass glow-hover ${className}`}>
        <CardHeader>
            {React.createElement(Icon, { className: "h-10 w-10 mb-4" })}
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
            <Link to={to}>
                <Button className={`w-full ${buttonColor}`}>
                    {buttonText}
                </Button>
            </Link>
        </CardContent>
    </Card>
);

const QuickAction = ({ title, icon: Icon, to, className }) => (
    <Link to={to} className={`flex flex-col items-center justify-center space-y-2 p-4 glass glow-hover rounded-lg hover:bg-muted/50 transition-colors ${className}`}>
        <div className="p-3 bg-white dark:bg-gray-900 rounded-full">
            {React.createElement(Icon, { className: "h-6 w-6 text-primary" })}
        </div>
        <span className="text-sm font-medium">{title}</span>
    </Link>
)

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

// Helper for animated border
const AnimatedBorder = ({ isActive }: { isActive: boolean }) => (
  isActive ? (
    <span className="absolute inset-0 z-10 rounded-3xl pointer-events-none">
      <span className="block w-full h-full rounded-3xl animate-spin-slow border-4 border-transparent" style={{
        background: 'conic-gradient(from 0deg, #a855f7, #facc15, #38bdf8, #a855f7 100%)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        padding: 2
      }} />
    </span>
  ) : null
);

export default function DashboardPage() {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState("");
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [addId, setAddId] = useState("");
    const [addError, setAddError] = useState("");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const [hoveredCard, setHoveredCard] = useState<number|null>(null);
    const { triggerVanish } = React.useContext(VanishContext);

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    useEffect(() => {
      if (!user) return;
      const q = collection(db, `users/${user.uid}/contacts`);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamMembers(members);
      });
      return () => unsubscribe();
    }, [user]);

    const handleOpenTeamModal = () => {
      setShowTeamModal(true);
      setAddId("");
      setAddError("");
      setSearch("");
    };

    const handleAddMember = async (e) => {
      e.preventDefault();
      setAddError("");
      if (!user) {
        setAddError("You must be logged in to add members.");
        return;
      }
      if (!addId.startsWith("AGENDA-")) {
        setAddError("Invalid ID format.");
        return;
      }
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("agentHubId", "==", addId));
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setAddError("User not found.");
          return;
        }
        const foundUser = querySnapshot.docs[0].data();
        if (foundUser.uid === user.uid) {
          setAddError("You can't add yourself.");
          return;
        }
        await setDoc(doc(db, `users/${user.uid}/contacts`, foundUser.uid), {
          uid: foundUser.uid,
          displayName: foundUser.displayName,
          photoURL: foundUser.photoURL,
          agentHubId: foundUser.agentHubId,
        });
        toast.success("Member added!");
        setAddId("");
      } catch (error) {
        setAddError("Failed to add member.");
      }
    };

    const filteredMembers = teamMembers.filter(m =>
      (!search.trim() ||
        (m.displayName && m.displayName.toLowerCase().includes(search.trim().toLowerCase())) ||
        (m.agentHubId && m.agentHubId.toLowerCase().includes(search.trim().toLowerCase()))
      )
    );

    return (
      <>
        {/* Dashboard content with magical vanish animation */}
        <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="space-y-8 group-[.card-hovered]:blur-sm transition-all duration-300">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{greeting}{user?.displayName && `, ${user.displayName}`}!</h2>
                <div className="flex items-center space-x-2">
                  {/* Magical icon button triggers animation */}
                  <button
                    className="magical-btn flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-yellow-400 shadow-md hover:scale-110 transition-all duration-300 w-10 h-10 border-2 border-white/40 outline-none focus:ring-2 focus:ring-purple-300"
                    title="Magical Button"
                    aria-label="Magical Button"
                  onClick={triggerVanish}
                  >
                    <svg className="w-5 h-5 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 21L15 15" />
                      <path d="M19 19C20.5 17.5 20.5 15 19 13.5L10.5 5C9 3.5 6.5 3.5 5 5C3.5 6.5 3.5 9 5 10.5L13.5 19C15 20.5 17.5 20.5 19 19Z" />
                      <path d="M8 8L16 16" />
                    </svg>
                  </button>
                  <Button onClick={() => setShowMeetingModal(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Quick Meet
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[{
                    title: "Today's Meetings",
                    icon: Calendar,
                    value: "No meetings",
                    onClick: () => navigate("/calendar")
                }, {
                    title: "This Week",
                    icon: Clock,
                    value: "Free week!",
                    onClick: () => navigate("/calendar")
                }, {
                    title: "Team Members",
                    icon: Users,
                    value: teamMembers.length === 0 ? "No members" : teamMembers.length,
                    detail: teamMembers.length === 0 ? <div className="text-xs mt-2 text-muted-foreground">Add new member</div> : null,
                    onClick: handleOpenTeamModal
                }].map((card, idx) => {
                    const isActive = hoveredCard === idx;
                    return (
                        <div
                            key={card.title}
                            className={`relative group/card cursor-pointer transition-all duration-300 rounded-3xl glass glow-hover
                                ${isActive ? 'scale-105 shadow-lg ring-2 ring-purple-400 z-20' : hoveredCard !== null ? 'blur-[2px] opacity-60' : ''}
                            `}
                            onMouseEnter={() => setHoveredCard(idx)}
                            onMouseLeave={() => setHoveredCard(null)}
                            onClick={card.onClick}
                            style={{ minHeight: 160 }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                {React.createElement(card.icon, { className: "h-5 w-5 text-muted-foreground" })}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                {card.detail}
                            </CardContent>
                        </div>
                    );
                })}
              </div>

              {/* Main Action Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                {[{
                    title: "View Schedule",
                    description: "See all your scheduled meetings in a beautiful calendar view",
                    buttonText: "Open Calendar",
                    icon: Calendar,
                    to: "/calendar",
                    buttonColor: ""
                }, {
                    title: "Create Meeting",
                    description: "Schedule a new meeting with your team members",
                    buttonText: "Schedule Meeting",
                    icon: Plus,
                    to: "/calendar",
                    buttonColor: "bg-green-500 hover:bg-green-600"
                }, {
                    title: "Team Chat",
                    description: "Connect and chat with team members instantly",
                    buttonText: "Open Chat",
                    icon: MessageSquare,
                    to: "/chat",
                    buttonColor: "bg-purple-600 hover:bg-purple-700"
                }].map((card, idx) => {
                    const isActive = hoveredCard === (idx + 3);
                    return (
                        <div
                            key={card.title}
                            className={`relative group/card cursor-pointer transition-all duration-300 rounded-3xl glass glow-hover
                                ${isActive ? 'scale-105 shadow-lg ring-2 ring-purple-400 z-20' : hoveredCard !== null ? 'blur-[2px] opacity-60' : ''}
                            `}
                            onMouseEnter={() => setHoveredCard(idx + 3)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <CardHeader>
                                {React.createElement(card.icon, { className: "h-10 w-10 mb-4" })}
                                <CardTitle>{card.title}</CardTitle>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <Link to={card.to}>
                                    <Button className={`w-full ${card.buttonColor}`}>{card.buttonText}</Button>
                                </Link>
                            </CardContent>
                        </div>
                    );
                })}
              </div>
              
              {/* Quick Actions */}
              <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                      Quick Actions
                      <span className="ml-2 text-xs font-medium text-white bg-black dark:bg-white dark:text-black rounded-full px-2 py-0.5">New</span>
                  </h2>
                  <p className="text-muted-foreground mb-4">Frequently used actions for faster productivity</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[{
                          title: "Quick Meet",
                          icon: Video,
                          to: "#"
                      }, {
                          title: "Today's Agenda",
                          icon: Clock,
                          to: "/calendar"
                      }, {
                          title: "Team Chat",
                          icon: MessageSquare,
                          to: "/chat"
                      }, {
                          title: "Contacts",
                          icon: Contact,
                          to: "/chat"
                      }].map((action, idx) => {
                          const isActive = hoveredCard === (idx + 7);
                          return (
                              <div
                                  key={action.title}
                                  className={`relative group/card cursor-pointer transition-all duration-300 rounded-3xl glass glow-hover
                                      ${isActive ? 'scale-105 shadow-lg ring-2 ring-purple-400 z-20' : hoveredCard !== null ? 'blur-[2px] opacity-60' : ''}
                                  `}
                                  onMouseEnter={() => setHoveredCard(idx + 7)}
                                  onMouseLeave={() => setHoveredCard(null)}
                              >
                                  <Link to={action.to} className="flex flex-col items-center justify-center space-y-2 p-4 w-full h-full">
                                      <div className="p-3 bg-white dark:bg-gray-900 rounded-full">
                                          {React.createElement(action.icon, { className: "h-6 w-6 text-primary" })}
                                      </div>
                                      <span className="text-sm font-medium">{action.title}</span>
                                  </Link>
                              </div>
                          );
                      })}
                  </div>
              </div>
            </div>
          </div>
        <ScheduleNewMeetingModal open={showMeetingModal} onOpenChange={setShowMeetingModal} />
        {/* Team Members Modal */}
        <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
          <DialogContent className="glass glow-hover">
            {/* ... team modal content ... */}
          </DialogContent>
        </Dialog>
      </>
    );
} 