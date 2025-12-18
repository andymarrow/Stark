"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Github,
  Chrome,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // --- STATES FOR VERIFICATION ---
  const [verifying, setVerifying] = useState(false); 
  const [code, setCode] = useState(""); 

  // --- SIMULATED HANDLE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API Call
    setTimeout(() => {
      // Mock validation
      if (e.target.email.value.includes("error")) {
        setError("Invalid credentials (simulated error).");
        setIsLoading(false);
      } else {
        // Success
        router.push("/dashboard");
      }
    }, 1500);
  };

  // --- SIMULATED HANDLE SIGN UP ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Simulate API Call
    setTimeout(() => {
        setIsLoading(false);
        setVerifying(true); // Move to OTP screen
    }, 1500);
  };

  // --- SIMULATED HANDLE VERIFICATION ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API Call
    setTimeout(() => {
        if (code === "123456") {
            router.push("/dashboard");
        } else {
            setError("Invalid code. Try 123456 for demo.");
            setIsLoading(false);
        }
    }, 1500);
  };

  // --- MOCK OAUTH HANDLER ---
  const handleOAuth = (strategy) => {
    setIsLoading(true);
    // Simulate redirect
    setTimeout(() => {
        router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2 overflow-hidden bg-white dark:bg-slate-950">

      {/* --- LEFT SIDE: FORM CONTAINER --- */}
      <div className="relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24 border-r border-slate-200 dark:border-slate-800 perspective-1000">
        
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark opacity-[0.4] pointer-events-none" />

        <div className="absolute top-8 left-8 flex items-center gap-2 z-20">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/20 transition-transform group-hover:rotate-12">
                    <Sparkles size={16} fill="currentColor" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    OmniOptimize
                </span>
            </Link>
        </div>

        {/* --- THE FLIPPING CARD --- */}
        <div className="w-full max-w-sm relative z-10" style={{ perspective: "1000px" }}>
            <motion.div
                initial={false}
                animate={{ rotateY: isLogin ? 0 : 180 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative w-full transform-style-3d"
                style={{ transformStyle: "preserve-3d" }}
            >
                
                {/* === FRONT FACE (LOGIN) === */}
                <div 
                    className="w-full backface-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Welcome back</h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Enter your credentials to access your dashboard.</p>
                    </div>

                    {error && !verifying && isLogin && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">Email</Label>
                            <div className="relative">
                                <Input id="email" name="email" type="email" placeholder="name@company.com" className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" required />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">Password</Label>
                                <Link href="#" className="text-xs font-medium text-brand-600 hover:text-brand-500">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" required />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-lg shadow-brand-500/20" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-10 text-xs" onClick={() => handleOAuth("github")}>
                            <Github className="mr-2 h-3 w-3" /> GitHub
                        </Button>
                        <Button variant="outline" className="h-10 text-xs" onClick={() => handleOAuth("google")}>
                            <Chrome className="mr-2 h-3 w-3 text-red-500" /> Google
                        </Button>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        Don't have an account?{" "}
                        <button onClick={() => { setIsLogin(false); setError(""); }} className="font-bold text-brand-600 hover:underline">
                            Sign up
                        </button>
                    </p>
                </div>

                {/* === BACK FACE (SIGN UP & VERIFICATION) === */}
                <div 
                    className="absolute inset-0 w-full h-full backface-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    {/* CONDITIONAL: VERIFICATION VS SIGN UP */}
                    {verifying ? (
                        // --- VERIFICATION MODE ---
                        <div className="h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Check your email</h1>
                                <p className="text-sm text-slate-500 mt-2">
                                    We sent a verification code to your email. Enter it below (Try: 123456).
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">Verification Code</Label>
                                    <div className="relative">
                                        <Input 
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="123456" 
                                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-lg tracking-widest text-center" 
                                            maxLength={6}
                                            required 
                                        />
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-lg" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
                                </Button>
                            </form>
                            
                            <button 
                                onClick={() => { setVerifying(false); setError(""); }}
                                className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to Sign Up
                            </button>
                        </div>
                    ) : (
                        // --- SIGN UP MODE ---
                        <>
                            <div className="mb-6 text-center">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Create Account</h1>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Start optimizing your web performance.</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">Email</Label>
                                    <div className="relative">
                                        <Input name="email" type="email" placeholder="name@company.com" className="pl-10 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" required />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">Password</Label>
                                    <div className="relative">
                                        <Input name="password" type="password" placeholder="Create a password" className="pl-10 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" required />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-10 bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-lg mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                                </Button>
                            </form>

                            <p className="mt-6 text-center text-xs text-slate-500">
                                Already have an account?{" "}
                                <button onClick={() => { setIsLogin(true); setError(""); }} className="font-bold text-brand-600 hover:underline">
                                    Log in
                                </button>
                            </p>
                        </>
                    )}
                </div>

            </motion.div>
        </div>

        {/* Footer Links (Left Side) */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between text-xs text-slate-500 hidden sm:flex">
            <span>© 2025 OmniOptimize</span>
            <div className="space-x-4">
                <Link href="#" className="hover:text-slate-800 dark:hover:text-slate-200">Privacy</Link>
                <Link href="#" className="hover:text-slate-800 dark:hover:text-slate-200">Terms</Link>
            </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: VISUAL --- */}
      <div className="hidden lg:block relative bg-slate-900 overflow-hidden">
        <Image 
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2534&auto=format&fit=crop"
            alt="Data Center Abstract"
            fill
            className="object-cover opacity-40 mix-blend-overlay"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-brand-900/20" />
        
        {/* Testimonial Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-md shadow-2xl"
            >
                <div className="flex justify-center mb-6">
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                            <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        ))}
                    </div>
                </div>
                <blockquote className="text-xl font-medium text-white mb-6 leading-relaxed">
                    "OmniOptimize is the first tool that actually speaks the language of developers. Our site speed increased by <span className="text-brand-400 font-bold">40%</span> in just two weeks."
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400 to-blue-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            JS
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="text-white font-bold text-sm">Jason Statham</div>
                        <div className="text-slate-400 text-xs">CTO at TechCorp</div>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-12 flex gap-8 text-slate-400 font-mono text-xs"
            >
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>System Operational</span>
                </div>
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    <span>256-bit Encryption</span>
                </div>
            </motion.div>
        </div>
      </div>

    </div>
  );
}