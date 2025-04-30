import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { GiBoxingGlove } from 'react-icons/gi';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const { user, isLoading, login } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Function to handle login with Replit Auth
  const handleLogin = () => {
    login();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left side - Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome to 3 Punch Convo</CardTitle>
            <CardDescription className="text-center">
              Join the MMA discussion
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-gray-500 mb-4">
              Sign in with your Replit account to join the community.
            </p>
            
            <Button 
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Sign in with Replit
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-gray-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-tr from-primary/80 to-primary flex flex-col justify-center p-4 md:p-8 text-white">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <GiBoxingGlove className="h-10 w-10" />
            <h1 className="text-4xl font-bold">3 Punch Convo</h1>
          </div>
          
          <h2 className="text-3xl font-bold">Your Ultimate MMA Community</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Engage in Lively Discussions</h3>
                <p>Join forums dedicated to UFC, Bellator, ONE FC, and more. Debate with fellow fans about fights, fighters, and events.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Stay Updated with Events</h3>
                <p>Access upcoming fight schedules, event details, and fighter stats. Never miss a match with our comprehensive calendar.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Earn Community Recognition</h3>
                <p>Build your reputation as an MMA expert. Earn points, climb the ranks, and gain status in our fan community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}