"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { supabase } from "../../../lib/supabase";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLoginSuccess(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a superadmin
      const { data: superadminData, error: superadminError } = await supabase
        .from('superadmins')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (superadminError || !superadminData) {
        await supabase.auth.signOut();
        throw new Error('You do not have superadmin privileges');
      }

      setLoginSuccess(true);
      const redirectTo = searchParams.get('redirectedFrom') || '/dashboard';
      window.location.href = redirectTo;
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!mounted) return;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) setError('Error checking session. Please try again.');
          return;
        }

        if (!mounted) return;

        if (session) {
          const { data: superadminData, error: superadminError } = await supabase
            .from('superadmins')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (!superadminError && superadminData) {
            const redirectTo = searchParams.get('redirectedFrom') || '/dashboard';
            window.location.href = redirectTo;
          } else {
            await supabase.auth.signOut();
            setError('You do not have superadmin privileges');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) setError('Error checking session. Please try again.');
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };

    checkSession();
    return () => { mounted = false; };
  }, [searchParams]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking session...</p>
          <p className="text-sm text-gray-500 mt-4">
            If stuck here, <button onClick={() => {
              supabase.auth.signOut();
              setIsCheckingSession(false);
            }} className="underline text-blue-600 hover:text-blue-700">clear session</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">MySocietyDetails</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">SuperAdmin Panel</p>
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              {loginSuccess && (
                <div className="p-3 text-sm rounded-md bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <p className="font-medium">Login Successful!</p>
                  <p className="mt-1">Redirecting to dashboard...</p>
                  <div className="mt-2 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                    <span>Redirecting...</span>
                  </div>
                </div>
              )}
              {!loginSuccess && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {!loginSuccess && (
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}