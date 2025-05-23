import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Forum from "@/pages/Forum";
import Schedule from "@/pages/Schedule";
import Rankings from "@/pages/Rankings";
import UserProfile from "@/pages/UserProfile";
import Thread from "@/pages/Thread";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ClerkProvider } from '@clerk/clerk-react'
import { ProtectedRoute } from "@/lib/protected-route";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
      <div className="flex flex-col min-h-screen bg-ufc-black text-light-gray">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/login" component={AuthPage} />
            <Route path="/register" component={AuthPage} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/rankings" component={Rankings} />
            {/* Protected Routes */}
            <ProtectedRoute path="/forum" component={Forum} />
            <ProtectedRoute path="/forum/:categoryId" component={Forum} />
            <ProtectedRoute path="/thread/:threadId" component={Thread} />
            <ProtectedRoute path="/user/:username" component={UserProfile} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
      <Toaster />
    </ClerkProvider>
  );
}

export default App;
