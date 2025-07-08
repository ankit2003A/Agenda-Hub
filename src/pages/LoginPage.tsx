import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import React from 'react';
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    login({ email, password });
    // The login function in AuthContext will handle navigation
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/b4f88ccc253c40990b44d592f47a115c.jpg')" }}>
      <Card className="w-full max-w-md mx-auto glass">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="m@example.com" required type="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link className="ml-auto inline-block text-sm underline" to="#">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" name="password" required type="password" />
            </div>
            <Button className="w-full" type="submit">
              Sign In
            </Button>
            <Button className="w-full" variant="outline" type="button" onClick={googleSignIn}>
              Sign in with Google
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Don't have an account?
            <Link className="underline ml-1" to="/signup">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 