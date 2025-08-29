import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Shield, Star } from "lucide-react";

export default function CompleteFighterSignup() {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const { user, isSignedIn, isLoaded } = useMemoizedUser();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const processSignup = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn || !user) {
        setLocation('/fighter-signup' + (token ? `?token=${token}` : ''));
        return;
      }

      try {
        console.log('🔥 CompleteFighterSignup - sending token:', token);
        console.log('🔥 User ID:', user.id);
        console.log('🔥 Email:', user.primaryEmailAddress?.emailAddress);
        
        // Send the fighter invitation token to complete the signup process
        const response = await fetch(`/api/users/clerk/${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.primaryEmailAddress?.emailAddress,
            profileImageUrl: user.imageUrl,
            username: user.username,
            fighterInvitationToken: token, // Include the invitation token
          }),
        });

        console.log('🔥 Response status:', response.status);
        const responseData = await response.json();
        console.log('🔥 Response data:', responseData);
        
        if (!response.ok) {
          throw new Error('Failed to complete fighter signup');
        }
        
        // Small delay to ensure everything is processed
        setTimeout(() => {
          setIsProcessing(false);
        }, 2000);
        
      } catch (error) {
        console.error('Error completing fighter signup:', error);
        setProcessingError('Failed to complete fighter signup. Please try again.');
        setIsProcessing(false);
      }
    };

    processSignup();
  }, [isLoaded, isSignedIn, user, token]);

  if (!isLoaded || isProcessing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 mx-auto mb-4'></div>
          <p className="text-white text-lg">Completing your fighter registration...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (processingError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Shield className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Signup Error</h2>
            <p className="text-slate-400 mb-6">{processingError}</p>
            <Button 
              onClick={() => setLocation('/forum')}
              className="w-full"
            >
              Continue to Forum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 text-white max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Welcome to 3PunchConvo!
          </CardTitle>
          <p className="text-slate-400">
            Your fighter account has been successfully created
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-semibold text-white">Fighter Status Activated</span>
            </div>
            <div className="grid gap-3">
              {[
                "✅ Verified fighter badge displayed on your profile",
                "✅ Access to fighter-only features and discussions", 
                "✅ Direct engagement with your fanbase",
                "✅ Priority support and platform features"
              ].map((benefit, index) => (
                <p key={index} className="text-slate-300 text-sm">{benefit}</p>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-slate-300">
              Ready to start engaging with the 3PunchConvo community?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/forum')}
                className="bg-red-600 hover:bg-red-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Enter the Forum
              </Button>
              <Button 
                onClick={() => setLocation(`/user/${user?.username}`)}
                variant="outline"
                className="border-slate-600 text-black hover:bg-slate-200"
              >
                View My Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 