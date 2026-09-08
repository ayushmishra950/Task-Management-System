import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Handshake, Loader, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { useLoginClientMutation } from "@/redux-toolkit/api/client/auth.api";
import { socket } from "@/socket/socket";

const ClientLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginClient, { isLoading: loading }] = useLoginClientMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill all the fields" });
      return;
    }

    try {
      const res = await loginClient({ email, password }).unwrap();

      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast({ title: "Login Successfully.", description: res?.message });

      if (!socket.connected) socket.connect();

      setEmail("");
      setPassword("");
      navigate("/client");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error?.data?.errors?.[0]?.message || error?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Client Login</title>
        <meta name="description" content="Client portal login" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <Handshake className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Client Portal</h1>
            <p className="text-muted-foreground mt-2">Raise project requests and track their progress</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in with the credentials your admin shared</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loading}
                      className="pr-10"
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

                <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                  {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
                  {loading ? "Signing In..." : null}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">© 2024 OfficeHub. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default ClientLogin;
