'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Eye, EyeOff, Lock, Mail, LoaderCircle } from 'lucide-react';
import { authApi, integrationApi } from '@/lib/api/api';
import { useUser } from '@/hooks/useUser';
import { useOAuth } from '@/hooks/useOAuth';
import { processIntegrations } from '@/lib/utils/integrationUtils';
import { toast } from 'sonner';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const { setName, setEmail, setAccessToken } = useUser();
  const {
    setNotionConnection,
    setAtlassianMCPConnection,
    setGitHubConnection,
    setFigmaConnection,
    setDataDogConnection,
    setGrafanaConnection,
    setNewRelicConnection,
    setSentryConnection,
    setPagerDutyConnection,
    setCloudWatchConnection,
    setUserFilesConnection,
  } = useOAuth();
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: emailInput,
        password: password,
      });

      if (response.data?.access_token) {
        toast.success('Login successful');
        setAccessToken(response.data.access_token);

        try {
          const user = await authApi.me(response.data.access_token);
          setName(user.data?.name ?? 'User');
          setEmail(user.data?.email ?? 'user@example.com');
        } catch {
          toast.error('Failed to load user details');
        }

        try {
          const integrations = await integrationApi.list(
            response.data.access_token
          );

          if (integrations.data) {
            processIntegrations(integrations.data, {
              setNotionConnection,
              setAtlassianMCPConnection,
              setGitHubConnection,
              setFigmaConnection,
              setDataDogConnection,
              setGrafanaConnection,
              setNewRelicConnection,
              setSentryConnection,
              setPagerDutyConnection,
              setCloudWatchConnection,
              setUserFilesConnection,
            });
          }
        } catch {
          toast.error('Failed to load integrations');
        }

        router.push(returnUrl);
      } else {
        toast.error('No access token received');
      }
    } catch {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='animate-in fade-in slide-in-from-bottom-4 w-full max-w-md space-y-8 duration-500'>
        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className='bg-card space-y-6 rounded-xl border p-8 shadow-lg'
        >
          {/* Email Field */}
          <div className='space-y-2'>
            <label
              htmlFor='email'
              className='text-foreground text-sm font-medium'
            >
              Email
            </label>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <Mail className='text-muted-foreground h-5 w-5' />
              </div>
              <Input
                id='email'
                type='email'
                placeholder='Enter email'
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className='pl-10'
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className='space-y-2'>
            <label
              htmlFor='password'
              className='text-foreground text-sm font-medium'
            >
              Password
            </label>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <Lock className='text-muted-foreground h-5 w-5' />
              </div>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                className='pr-10 pl-10'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 flex items-center pr-3'
              >
                {showPassword ? (
                  <EyeOff className='text-muted-foreground hover:text-foreground h-5 w-5 transition-colors' />
                ) : (
                  <Eye className='text-muted-foreground hover:text-foreground h-5 w-5 transition-colors' />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            className='w-full bg-[#11054c]'
            size='lg'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

const LoginFallback = () => <p>Loading...</p>;

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
