import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Users, MessageSquare, Trophy, Target, Zap, Shield, Quote, Check, X } from "lucide-react";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "wouter";
import { dark } from "@clerk/themes";

export default function AuthPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  //   // Redirect if already logged in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, isLoaded, setLocation]);

  const industryQuotes = [
    {
      quote: "3PunchConvo has become my go-to platform for discussing fight strategy and connecting with real MMA minds.",
      author: "Marcus 'Thunder' Johnson",
      role: "UFC Lightweight Contender",
      category: "Fighter",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "The technical discussions here are top-notch. It's where I share insights with fighters and fans who truly understand the sport.",
      author: "Coach Sarah Martinez",
      role: "Head Coach, Elite MMA Academy",
      category: "Coach",
      avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "As someone who covers MMA professionally, 3PunchConvo gives me direct access to the pulse of the MMA community.",
      author: "David Chen",
      role: "Senior MMA Journalist, Fight Weekly",
      category: "Journalist",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "The level of fight analysis from the community here rivals what we see in professional breakdowns.",
      author: "Amanda 'Storm' Rodriguez",
      role: "Former Bantamweight Champion",
      category: "Fighter",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "This platform has revolutionized how I connect with my athletes and other coaches worldwide.",
      author: "Tommy 'The Tactician' Williams",
      role: "Olympic Wrestling Coach",
      category: "Coach",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    }
  ];

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="3 PUNCH CONVO" className="h-8" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-4">
                Now Open for Registration
              </Badge>
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                The Fight Game Has a
                <span className="text-cyan-400"> New Home</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Interact with fans, fighters and industry experts. It's like your MMA group chat - but with your favorite fighters IN the convo. The best fight forums online, period.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-semibold">Mobile Friendly</p>
                    <p className="text-sm text-gray-400">No App Download Required</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-semibold">Actively Moderated</p>
                    <p className="text-sm text-gray-400">Trolls Get Banned</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <Trophy className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-semibold">Expert Analysis</p>
                    <p className="text-sm text-gray-400">Pro Fighter Insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="flex items-center justify-center h-full w-full">
              <div className="w-full max-w-md">
                <SignIn 
                  forceRedirectUrl="/" 
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      rootBox: "w-full",
                      card: "bg-gray-800 border border-gray-700 shadow-xl p-6",
                      headerTitle: "text-2xl font-bold text-white mb-1 mt-2",
                      headerSubtitle: "text-gray-400",
                      formButtonPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors",
                      formButtonSecondary: "bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors",
                      footerActionLink: "text-cyan-400 hover:text-cyan-300 transition-colors ml-2",
                      formFieldInput: "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 py-4 px-4 h-14",
                      formFieldLabel: "text-gray-300 font-medium mb-2",
                      dividerLine: "bg-gray-600",
                      dividerText: "text-gray-400",
                      socialButtonsBlockButton: "hover:bg-gray-600 border-gray-800 text-white py-2 px-6 h-14",
                      socialButtonsBlockButtonText: "text-white",
                      formFieldLabelRow: "text-gray-300",
                      formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-300",
                      formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
                      formFieldAction: "text-cyan-400 hover:text-cyan-300",
                      alert: "bg-red-900/50 border-red-700 text-red-200",
                      alertText: "text-red-200",
                      formHeaderTitle: "text-2xl font-bold text-white",
                      formHeaderSubtitle: "text-gray-400",
                      identityPreviewText: "text-gray-300",
                      identityPreviewEditButton: "text-cyan-400 hover:text-cyan-300",
                      formFieldRow: "space-y-2",
                      formField: "space-y-2",
                      form: "space-y-6",
                      footer: "text-center",
                      header: "text-center",
                      main: "space-y-6",
                      pageScrollBox: "p-6",
                      cardContent: "p-6",
                      cardHeader: "p-6 pb-0",
                      cardFooter: "p-6 pt-0",
                      logoImage: "hidden",
                      logoBox: "hidden",
                      footerAction: "my-4 text-center",
                      socialButtonsBlockButtonIcon: "!w-10 !h-10 mr-3",
                      socialButtonsBlockButtonIcon__google: "w-10 h-10",
                      otpCodeFieldInput: "w-10 h-10 text-base bg-gray-700 border-gray-600 text-white focus:border-cyan-500 focus:ring-cyan-500 rounded-lg mx-1",
                    },
                    variables: {
                      colorPrimary: "#06b6d4", // cyan-500
                      colorBackground: "#1f2937", // gray-800
                      colorInputBackground: "#374151", // gray-700
                      colorInputText: "#ffffff",
                      colorText: "#ffffff",
                      colorTextSecondary: "#9ca3af", // gray-400
                      colorTextOnPrimaryBackground: "#000000",
                      borderRadius: "0.5rem",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                      spacingUnit: "0.25rem",
                    },
                    layout: {
                      socialButtonsPlacement: "bottom",
                      showOptionalFields: false,
                      logoImageUrl: "",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Why Join 3Punch?</h3>
            <p className="text-gray-400 text-lg">Participate in the most engaging MMA community online - while supporting your favorite fighters!</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-cyan-400" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Accumulate Fight Cred</h4>
              <p className="text-gray-400">
                Our proprietary algorithm awards "Fight Cred" that members amass as they climb the ranks from Amateur to Champion
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Support Your Favorite Fighters</h4>
              <p className="text-gray-400">
                A percentage of all member subscription fees are distributed to the platform's most active pro fighters. We also fund robbery insurance!
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Podcast Feedback Loops</h4>
              <p className="text-gray-400">
                Dedicated forums for some of your favorite MMA podcasts spawn topics that are actually discussed on the shows - and spill back into the forums!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Why Go Premium?</h3>
            <p className="text-gray-400 text-lg">Unlock exclusive features and support the MMA community</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Membership */}
            <Card className="bg-gray-800 border-gray-700 relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Basic</CardTitle>
                <CardDescription className="text-gray-400">Free Forever</CardDescription>
                <div className="text-4xl font-bold text-cyan-400 mt-4">$0</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Access to general forums</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Post and reply to other members</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Community discussion access</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-gray-500">Accumulate fight cred</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-gray-500">See pro fighter posts</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-gray-500">Reply to Pro Fighter posts</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-gray-500">Vote in robbery insurance polls</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Membership */}
            <Card className="bg-gray-800 border-gray-700 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-cyan-500 text-gray-900 font-semibold px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Premium</CardTitle>
                <CardDescription className="text-gray-400">Unlock everything</CardDescription>
                <div className="text-4xl font-bold text-cyan-400 mt-4">$4.99</div>
                <p className="text-sm text-gray-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Everything in Basic</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">See pro fighter posts</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Reply to Pro Fighter posts</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Accumulate fight cred</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Early access to new features</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Vote in robbery insurance polls</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Support active fighters</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Quotes Carousel */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">The MMA Industry is Active on 3PunchConvo</h3>
            <p className="text-gray-400 text-lg">Hear from professional fighters, coaches, and journalists</p>
          </div>
          
          <Carousel className="max-w-6xl mx-auto">
            <CarouselContent>
              {industryQuotes.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center h-full">
                    <Quote className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                    <blockquote className="text-lg text-gray-300 mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="border-t border-gray-700 pt-6">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                        <AvatarFallback className="bg-cyan-500/10 text-cyan-400 text-lg font-semibold">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-base font-semibold text-white mb-1">{testimonial.author}</p>
                      <p className="text-gray-400 text-sm mb-3">{testimonial.role}</p>
                      <Badge 
                        className={
                          testimonial.category === 'Fighter' 
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : testimonial.category === 'Coach'
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/20"
                        }
                      >
                        {testimonial.category}
                      </Badge>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700" />
            <CarouselNext className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700" />
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
                <img src={logoImage} alt="3 PUNCH CONVO" className="h-8" />
              </Link>
            </div>
            <p className="text-gray-400 text-sm text-center max-w-md">
              The premier destination for MMA discussion and community engagement.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact Us</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">FAQs</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Service</a>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400 w-full">
              <p>&copy; 2024 3PUNCH CONVO. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
