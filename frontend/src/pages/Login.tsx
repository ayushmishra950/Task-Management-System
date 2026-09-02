import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Briefcase, User, Shield, Users, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Helmet } from "react-helmet-async";
import {useLoginEmployeeMutation} from "@/redux-toolkit/api/employee/auth.api";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loginEmployee, {isLoading}] = useLoginEmployeeMutation();

  const roles: { role: UserRole; label: string; icon: React.ElementType; color: string }[] = [
    { role: 'super_admin', label: 'Super Admin', icon: Shield, color: 'bg-primary' },
    { role: 'admin', label: 'Admin', icon: Users, color: 'bg-info' },
    { role: 'employee', label: 'Employee', icon: User, color: 'bg-success' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !selectedRole) {
      toast({
        title: "Error",
        description: "Please fill all the fields",
      });
      return;
    }

    try {
      const res = await loginEmployee({email, password}).unwrap(); 
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast({title:"Login Successfully.", description:res?.message})
      setEmail("");
      setPassword("")
      navigate('/dashboard');                  
    } catch (error: any) {
      console.log(error)
      toast({
        title: "Login Failed",
        description: error?.data?.errors?.[0]?.message || error?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  return (
    <>   <Helmet>
      <title>Login Page</title>
      <meta name="description" content="This is the home page of our app" />
    </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <Briefcase className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">OfficeHub</h1>
            <p className="text-muted-foreground mt-2">Office Management System</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loading}
                      className="w-full pr-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !email || !password || !selectedRole}>
                  {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : 'Sign In'}
                  {loading ? 'Signing In...' : null}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            © 2024 OfficeHub. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
