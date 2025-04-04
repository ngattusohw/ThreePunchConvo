import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useState, createContext, useContext } from "react";
import Home from "@/pages/Home";
import Forum from "@/pages/Forum";
import Schedule from "@/pages/Schedule";
import Rankings from "@/pages/Rankings";
import UserProfile from "@/pages/UserProfile";
import Thread from "@/pages/Thread";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthUser } from "./lib/types";

// Create auth context
interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

function App() {
  // Mock authenticated user for demo purposes
  const [user, setUser] = useState<AuthUser | null>({
    id: 1,
    username: "FighterFan84",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
    status: "CONTENDER",
    isOnline: true,
    postsCount: 157,
    likesCount: 1203,
    potdCount: 5,
    rank: 17,
    followersCount: 42,
    followingCount: 63,
    role: "USER",
  });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="flex flex-col min-h-screen bg-ufc-black text-light-gray">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/forum" component={Forum} />
            <Route path="/forum/:categoryId" component={Forum} />
            <Route path="/thread/:threadId" component={Thread} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/rankings" component={Rankings} />
            <Route path="/user/:username" component={UserProfile} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
      <Toaster />
    </AuthContext.Provider>
  );
}

export default App;
