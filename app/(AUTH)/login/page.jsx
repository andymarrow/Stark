"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import AuthForm from "../_components/AuthForm";
import SocialAuth from "../_components/SocialAuth";
import MobileSplash from "../_components/MobileSplash";
import MobileOnboarding from "../_components/MobileOnboarding";

export default function LoginPage() {
  // State machine: 'splash' | 'onboarding' | 'login'
  const [viewState, setViewState] = useState("splash"); 

  useEffect(() => {
    // If Desktop, skip everything and go straight to login
    if (window.innerWidth >= 1024) {
        setViewState("login");
    }
  }, []);

  const handleSplashComplete = () => {
    // On mobile, go to onboarding after splash
    setViewState("onboarding");
  };

  const handleOnboardingComplete = () => {
    // After onboarding, show login
    setViewState("login");
  };

  return (
    <>
        {/* 1. Mobile Splash Screen */}
        {viewState === "splash" && (
            <MobileSplash onComplete={handleSplashComplete} />
        )}

        {/* 2. Mobile Onboarding Slider */}
        {viewState === "onboarding" && (
            <MobileOnboarding onComplete={handleOnboardingComplete} />
        )}

        {/* 3. The Login Content */}
        {viewState === "login" && (
            <div className="animate-in fade-in duration-700">
                <AuthShell 
                    title="System Login" 
                    subtitle="Enter your credentials to access the creator network."
                >
                    <div className="space-y-6">
                        <AuthForm view="login" />
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground font-mono">Or connect via</span>
                            </div>
                        </div>

                        <SocialAuth />

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">New to Stark? </span>
                            <Link href="/onboarding" className="font-bold hover:text-accent hover:underline decoration-accent underline-offset-4 transition-colors">
                                Request Access
                            </Link>
                        </div>
                    </div>
                </AuthShell>
            </div>
        )}
    </>
  );
}