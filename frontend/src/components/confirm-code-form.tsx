import { cn } from "@/lib/utils";
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
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useState } from "react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import "@/lib/amplify-config";

export function ConfirmCodeForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: verificationCode,
      });
      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during verification"
      );
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      setError(null);
      await resendSignUpCode({ username: email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
          <form onSubmit={handleConfirmation}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Button type="submit" className="w-full">
                  Verify Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            Back to{" "}
            <Link to="/signup" className="underline underline-offset-4">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
