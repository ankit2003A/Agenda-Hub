import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { googleSignIn } = useAuth();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // In a real app, you would register the user with a backend service
        console.log("Registering new user:", { firstName, lastName, email, password });
        
        toast.success("Registration successful! Please sign in.");
        
        // Redirect to login page after a short delay to allow toast to be seen
        setTimeout(() => {
            navigate("/login");
        }, 1500);
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-lg mx-auto glass">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" placeholder="Max" required value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                required
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" required type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" type="submit">
              Create an account
            </Button>
            <Button className="w-full" variant="outline" type="button" onClick={googleSignIn}>
              Sign up with Google
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?
            <Link className="underline ml-1" to="/login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 