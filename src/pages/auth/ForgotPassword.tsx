import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(true);
      // In dev mode the API returns the token directly
      if (response.data?.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pistage to-ever-green p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-calm-green flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-calm-green">PlantWise AI</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-calm-green">Reset Password</CardTitle>
            <CardDescription>
              {success
                ? 'Check your email for the reset link'
                : 'Enter your email to receive a password reset link'}
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <Alert className="border-early-green bg-early-green/10">
                <CheckCircle2 className="w-4 h-4 text-early-green" />
                <AlertDescription className="text-early-green">
                  If that email is registered, a password reset link has been generated.
                </AlertDescription>
              </Alert>

              {resetToken && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-calm-green mb-1">Dev Mode — Reset Token:</p>
                  <p className="text-xs break-all text-muted-foreground">{resetToken}</p>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="text-early-green text-sm hover:underline mt-2 inline-block"
                  >
                    Click here to reset password →
                  </Link>
                </div>
              )}
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-calm-green hover:bg-resting-green text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}

          <CardFooter>
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-early-green hover:underline mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
