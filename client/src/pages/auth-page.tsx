import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { GiBoxingGlove } from 'react-icons/gi';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '',
    password: '',
    email: ''
  });

  // Check for error parameters in the URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const error = params.get('error');
    
    if (error) {
      switch(error) {
        case 'authentication_failed':
          setErrorMessage('Authentication failed. Please try again.');
          break;
        case 'no_user':
          setErrorMessage('Unable to retrieve user information. Please try again.');
          break;
        case 'login_failed':
          setErrorMessage('Login failed. Please try again later.');
          break;
        default:
          setErrorMessage('An error occurred during authentication. Please try again.');
      }
    }
  }, [search]);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', loginForm);
      
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to login. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Fetch user data again before redirecting
      try {
        const userResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        if (userResponse.ok) {
          // Navigation
          window.location.href = '/';
        } else {
          console.error('Failed to get user after login:', await userResponse.text());
          setErrorMessage('Failed to get user data after login. Please try again.');
          setIsSubmitting(false);
        }
      } catch (fetchError) {
        console.error('Error fetching user after login:', fetchError);
        setErrorMessage('Error fetching user data. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during login. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', registerForm);
      
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to register. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Fetch user data again before redirecting
      try {
        const userResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        if (userResponse.ok) {
          // Navigation
          window.location.href = '/';
        } else {
          console.error('Failed to get user after registration:', await userResponse.text());
          setErrorMessage('Failed to get user data after registration. Please try again.');
          setIsSubmitting(false);
        }
      } catch (fetchError) {
        console.error('Error fetching user after registration:', fetchError);
        setErrorMessage('Error fetching user data. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('An error occurred during registration. Please try again.');
      setIsSubmitting(false);
    }
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
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input 
                      id="login-username"
                      type="text"
                      placeholder="Your username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full" 
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input 
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email"
                      type="email"
                      placeholder="Your email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password"
                      type="password"
                      placeholder="Choose a password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full" 
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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