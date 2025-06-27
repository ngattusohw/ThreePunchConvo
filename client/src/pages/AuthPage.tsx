import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Users,
  MessageSquare,
  Trophy,
  Target,
  Zap,
  Shield,
  Quote,
  Check,
  X,
} from "lucide-react";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";
import { SignIn, SignInButton, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "wouter";
import { dark } from "@clerk/themes";
import kennyFlorianHeadshot from "@/assets/kenny_florian_headshot.png";
import brianPetriHeadshot from "@/assets/brian_petrie_headshot.png";
import mattFrevolaHeadshot from "@/assets/matt_frevola_headshot.jpg";

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
      quote:
        "Before turning pro, I lived in the early MMA forums. 3PC brings that spirit back by involving fighters as contributors - on a slick platform that fans will love.",
      author: "Kenny Florian",
      role: "MMA Fighter / Media Personality",
      category: "Fighter",
      avatar: kennyFlorianHeadshot,
    },
    {
      quote:
        "3PunchConvo is a place where opinions matter and bonds are formed. No other MMA community is even remotely close",
      author: "Brian Petrie",
      role: "Host of MMA Takes Podcast",
      category: "Host",
      avatar: brianPetriHeadshot,
    },
    {
      quote:
        "As a fighter and huge fan of all things MMA, I love interacting with REAL fans. Can't wait to chop it up on 3PC and share my perspectives!",
      author: "Matt Frevola",
      role: "UFC Fighter",
      category: "Fighter",
      avatar: mattFrevolaHeadshot,
    },
  ];

  if (!isLoaded) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen overflow-x-hidden bg-gray-900 text-white'>
      {/* Header */}
      <header className='border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm'>
        <div className='container mx-auto flex items-center justify-between px-4 py-4'>
          <div className='flex items-center space-x-2'>
            <Link href='/' className='flex items-center'>
              <img src={logoImage} alt='3 PUNCH CONVO' className='h-8' />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='px-4 py-20'>
        <div className='container mx-auto max-w-6xl'>
          <div className='grid items-center gap-12 lg:grid-cols-2'>
            <div>
              <Badge
                text='Now Open for Registration'
                icon={null}
                className='mb-4 border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
              />
              <h2 className='mb-6 text-4xl font-bold leading-tight md:text-5xl'>
                The Fight Game Has a
                <span className='text-cyan-400'> New Home</span>
              </h2>
              <p className='mb-8 text-lg leading-relaxed text-gray-300 md:text-xl'>
                Interact with fans, fighters and industry experts. It's like
                your MMA group chat - but with your favorite fighters IN the
                convo. The best fight forums online, period.
              </p>

              {/* Mobile Registration Form - Above feature cards */}
              <div className='mb-8 lg:hidden'>
                <div className='mx-auto w-full max-w-md'>
                  <SignIn
                    forceRedirectUrl='/'
                    appearance={{
                      baseTheme: dark,
                      elements: {
                        rootBox: "w-full",
                        card: "bg-gray-800 border border-gray-700 shadow-xl p-4 md:p-6",
                        headerTitle:
                          "text-xl md:text-2xl font-bold text-white mb-1 mt-2",
                        headerSubtitle: "text-gray-400",
                        formButtonPrimary:
                          "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors",
                        formButtonSecondary:
                          "bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors",
                        footerActionLink:
                          "text-cyan-400 hover:text-cyan-300 transition-colors ml-2",
                        formFieldInput:
                          "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 py-4 px-4 h-14",
                        formFieldLabel: "text-gray-300 font-medium mb-2",
                        dividerLine: "bg-gray-600",
                        dividerText: "text-gray-400",
                        socialButtonsBlockButton:
                          "hover:bg-gray-600 border-gray-800 text-white py-2 px-6 h-14",
                        socialButtonsBlockButtonText: "text-white",
                        formFieldLabelRow: "text-gray-300",
                        formFieldInputShowPasswordButton:
                          "text-gray-400 hover:text-gray-300",
                        formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
                        formFieldAction: "text-cyan-400 hover:text-cyan-300",
                        alert: "bg-red-900/50 border-red-700 text-red-200",
                        alertText: "text-red-200",
                        formHeaderTitle:
                          "text-xl md:text-2xl font-bold text-white",
                        formHeaderSubtitle: "text-gray-400",
                        identityPreviewText: "text-gray-300",
                        identityPreviewEditButton:
                          "text-cyan-400 hover:text-cyan-300",
                        formFieldRow: "space-y-2",
                        formField: "space-y-2",
                        form: "space-y-6",
                        footer: "text-center",
                        header: "text-center",
                        main: "space-y-6",
                        pageScrollBox: "p-4 md:p-6",
                        cardContent: "p-4 md:p-6",
                        cardHeader: "p-4 md:p-6 pb-0",
                        cardFooter: "p-4 md:p-6 pt-0",
                        logoImage: "hidden",
                        logoBox: "hidden",
                        footerAction: "my-4 text-center",
                        socialButtonsBlockButtonIcon: "!w-10 !h-10 mr-3",
                        socialButtonsBlockButtonIcon__google: "w-10 h-10",
                        otpCodeFieldInput:
                          "w-10 h-10 text-base bg-gray-700 border-gray-600 text-white focus:border-cyan-500 focus:ring-cyan-500 rounded-lg mx-1",
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

              <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='flex items-center space-x-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
                  <Users className='h-5 w-5 flex-shrink-0 text-cyan-400' />
                  <div>
                    <p className='font-semibold'>Mobile Friendly</p>
                    <p className='text-sm text-gray-400'>
                      No App Download Required
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
                  <MessageSquare className='h-5 w-5 flex-shrink-0 text-cyan-400' />
                  <div>
                    <p className='font-semibold'>Actively Moderated</p>
                    <p className='text-sm text-gray-400'>Trolls Get Banned</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
                  <Trophy className='h-5 w-5 flex-shrink-0 text-cyan-400' />
                  <div>
                    <p className='font-semibold'>Expert Analysis</p>
                    <p className='text-sm text-gray-400'>
                      Pro Fighter Insights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Registration Form */}
            <div className='hidden h-full w-full items-center justify-center lg:flex'>
              <div className='w-full max-w-md'>
                <SignIn
                  forceRedirectUrl='/'
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      rootBox: "w-full",
                      card: "bg-gray-800 border border-gray-700 shadow-xl p-4 md:p-6",
                      headerTitle:
                        "text-xl md:text-2xl font-bold text-white mb-1 mt-2",
                      headerSubtitle: "text-gray-400",
                      formButtonPrimary:
                        "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors",
                      formButtonSecondary:
                        "bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors",
                      footerActionLink:
                        "text-cyan-400 hover:text-cyan-300 transition-colors ml-2",
                      formFieldInput:
                        "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 py-4 px-4 h-14",
                      formFieldLabel: "text-gray-300 font-medium mb-2",
                      dividerLine: "bg-gray-600",
                      dividerText: "text-gray-400",
                      socialButtonsBlockButton:
                        "hover:bg-gray-600 border-gray-800 text-white py-2 px-6 h-14",
                      socialButtonsBlockButtonText: "text-white",
                      formFieldLabelRow: "text-gray-300",
                      formFieldInputShowPasswordButton:
                        "text-gray-400 hover:text-gray-300",
                      formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
                      formFieldAction: "text-cyan-400 hover:text-cyan-300",
                      alert: "bg-red-900/50 border-red-700 text-red-200",
                      alertText: "text-red-200",
                      formHeaderTitle:
                        "text-xl md:text-2xl font-bold text-white",
                      formHeaderSubtitle: "text-gray-400",
                      identityPreviewText: "text-gray-300",
                      identityPreviewEditButton:
                        "text-cyan-400 hover:text-cyan-300",
                      formFieldRow: "space-y-2",
                      formField: "space-y-2",
                      form: "space-y-6",
                      footer: "text-center",
                      header: "text-center",
                      main: "space-y-6",
                      pageScrollBox: "p-4 md:p-6",
                      cardContent: "p-4 md:p-6",
                      cardHeader: "p-4 md:p-6 pb-0",
                      cardFooter: "p-4 md:p-6 pt-0",
                      logoImage: "hidden",
                      logoBox: "hidden",
                      footerAction: "my-4 text-center",
                      socialButtonsBlockButtonIcon: "!w-10 !h-10 mr-3",
                      socialButtonsBlockButtonIcon__google: "w-10 h-10",
                      otpCodeFieldInput:
                        "w-10 h-10 text-base bg-gray-700 border-gray-600 text-white focus:border-cyan-500 focus:ring-cyan-500 rounded-lg mx-1",
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
      <section className='bg-gray-800/50 px-4 py-20'>
        <div className='container mx-auto max-w-6xl'>
          <div className='mb-16 text-center'>
            <h3 className='mb-4 text-2xl font-bold md:text-3xl'>
              Why Join 3Punch?
            </h3>
            <p className='text-base text-gray-400 md:text-lg'>
              Participate in the most engaging MMA community online - while
              supporting your favorite fighters!
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-3'>
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10'>
                <MessageSquare className='h-8 w-8 text-cyan-400' />
              </div>
              <h4 className='mb-3 text-xl font-semibold'>
                Accumulate Fight Cred
              </h4>
              <p className='text-gray-400'>
                Our proprietary algorithm awards "Fight Cred" that members amass
                as they climb the ranks from Amateur to Champion
              </p>
            </div>

            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10'>
                <Zap className='h-8 w-8 text-cyan-400' />
              </div>
              <h4 className='mb-3 text-xl font-semibold'>
                Support Your Favorite Fighters
              </h4>
              <p className='text-gray-400'>
                A percentage of all member subscription fees are distributed to
                the platform's most active pro fighters. We also fund robbery
                insurance!
              </p>
            </div>

            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10'>
                <Shield className='h-8 w-8 text-cyan-400' />
              </div>
              <h4 className='mb-3 text-xl font-semibold'>
                Podcast Feedback Loops
              </h4>
              <p className='text-gray-400'>
                Dedicated forums for some of your favorite MMA podcasts spawn
                topics that are actually discussed on the shows - and spill back
                into the forums!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className='px-4 py-20'>
        <div className='container mx-auto max-w-6xl'>
          <div className='mb-16 text-center'>
            <h3 className='mb-4 text-2xl font-bold md:text-3xl'>
              Why Go Premium?
            </h3>
            <p className='text-base text-gray-400 md:text-lg'>
              Unlock exclusive features and support the MMA community
            </p>
          </div>

          <div className='mx-auto grid max-w-4xl gap-8 md:grid-cols-2'>
            {/* Basic Membership */}
            <Card className='relative border-gray-700 bg-gray-800'>
              <CardHeader className='text-center'>
                <CardTitle className='text-xl text-white md:text-2xl'>
                  Basic
                </CardTitle>
                <CardDescription className='text-gray-400'>
                  Free Forever
                </CardDescription>
                <div className='mt-4 text-3xl font-bold text-cyan-400 md:text-4xl'>
                  $0
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-4'>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Can scroll forums and view posts
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Can view ranked/top users
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>Can like member posts</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <X className='h-5 w-5 flex-shrink-0 text-red-400' />
                    <span className='text-gray-500'>Accumulate fight cred</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <X className='h-5 w-5 flex-shrink-0 text-red-400' />
                    <span className='text-gray-500'>See pro fighter posts</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <X className='h-5 w-5 flex-shrink-0 text-red-400' />
                    <span className='text-gray-500'>
                      Reply to Pro Fighter posts
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <X className='h-5 w-5 flex-shrink-0 text-red-400' />
                    <span className='text-gray-500'>
                      Vote in robbery insurance polls
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Membership */}
            <Card className='relative border-gray-700 bg-gray-800'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 transform'>
                <Badge
                  text='Most Popular'
                  icon={null}
                  className='bg-cyan-500 px-4 py-1 font-semibold text-gray-900'
                />
              </div>
              <CardHeader className='text-center'>
                <CardTitle className='text-xl text-white md:text-2xl'>
                  Premium
                </CardTitle>
                <CardDescription className='text-gray-400'>
                  Unlock everything
                </CardDescription>
                <div className='mt-4 text-3xl font-bold text-cyan-400 md:text-4xl'>
                  $4.99
                </div>
                <p className='text-sm text-gray-400'>per month</p>
              </CardHeader>
              <CardContent>
                <ul className='space-y-4'>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>Everything in Basic</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>See pro fighter posts</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Reply to Pro Fighter posts
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>Accumulate fight cred</span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Early access to new features
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Vote in robbery insurance polls
                    </span>
                  </li>
                  <li className='flex items-center space-x-3'>
                    <Check className='h-5 w-5 flex-shrink-0 text-green-400' />
                    <span className='text-gray-300'>
                      Support active fighters
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Quotes Carousel */}
      <section className='bg-gray-800/50 px-4 py-20'>
        <div className='container mx-auto max-w-6xl'>
          <div className='mb-16 text-center'>
            <h3 className='mb-4 text-2xl font-bold md:text-3xl'>
              The MMA Industry is Active on 3PunchConvo
            </h3>
            <p className='text-base text-gray-400 md:text-lg'>
              Hear from professional fighters, coaches, and journalists
            </p>
          </div>

          <Carousel className='mx-auto max-w-6xl'>
            <CarouselContent
              className={
                industryQuotes.length === 1 ? "flex justify-center" : ""
              }
            >
              {industryQuotes.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className={
                    industryQuotes.length === 1
                      ? "mx-auto w-full max-w-xl"
                      : "md:basis-1/3"
                  }
                >
                  <div className='h-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-center md:p-6'>
                    <Quote className='mx-auto mb-4 h-8 w-8 text-cyan-400' />
                    <blockquote className='mb-6 text-base italic leading-relaxed text-gray-300 md:text-lg'>
                      "{testimonial.quote}"
                    </blockquote>
                    <div className='border-t border-gray-700 pt-6'>
                      <Avatar className='mx-auto mb-4 h-16 w-16'>
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.author}
                        />
                        <AvatarFallback className='bg-cyan-500/10 text-lg font-semibold text-cyan-400'>
                          {testimonial.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <p className='mb-1 text-base font-semibold text-white'>
                        {testimonial.author}
                      </p>
                      <p className='mb-3 text-sm text-gray-400'>
                        {testimonial.role}
                      </p>
                      <Badge
                        text={testimonial.category}
                        icon={null}
                        className={
                          testimonial.category === "Fighter"
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : testimonial.category === "Coach"
                              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              : "border-green-500/20 bg-green-500/10 text-green-400"
                        }
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='border-gray-700 bg-gray-800 text-white hover:bg-gray-700' />
            <CarouselNext className='border-gray-700 bg-gray-800 text-white hover:bg-gray-700' />
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-gray-800 bg-gray-900 px-4 py-12'>
        <div className='container mx-auto max-w-6xl'>
          <div className='flex flex-col items-center space-y-8'>
            <div className='flex items-center space-x-2'>
              <Link href='/' className='flex items-center'>
                <img src={logoImage} alt='3 PUNCH CONVO' className='h-8' />
              </Link>
            </div>
            <p className='max-w-md text-center text-sm text-gray-400'>
              The premier destination for MMA discussion and community
              engagement.
            </p>
            <div className='flex flex-wrap justify-center gap-6 text-sm'>
              <a
                href='/terms'
                className='text-gray-400 transition-colors hover:text-cyan-400'
              >
                Terms of Service
              </a>
              <a
                href='/privacy'
                className='text-gray-400 transition-colors hover:text-cyan-400'
              >
                Privacy Policy
              </a>
              <a
                href='/terms#contact-us'
                className='text-gray-400 transition-colors hover:text-cyan-400'
              >
                Contact Us
              </a>
            </div>
            <div className='w-full border-t border-gray-800 pt-8 text-center text-sm text-gray-400'>
              <p>&copy; 2024 3PUNCH CONVO. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
