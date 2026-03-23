'use client';

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { validateLogin } from '@/app/actions/auth.actions';
import { mockUsers } from '@/lib/mock/mockUsers';
import { setSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 text-base"
    >
      {pending ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        'Sign In'
      )}
    </Button>
  );
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();
  
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await validateLogin(formData);
    if (result.success && result.data) {
      setSession(result.data as any);
      window.location.href = '/dashboard';
    }
    return result;
  }, null);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold font-urbanist text-gray-900 mb-2">Welcome Back</h2>
      <p className="text-gray-500 mb-8">Sign in to your YPIT workspace</p>

      <AnimatePresence>
        {state && !state.success && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{state.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <Input
              type="email"
              name="email"
              required
              placeholder="you@ypit.com"
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="••••••••"
              className="pl-10 pr-10 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <a href="#" className="text-sm text-primary hover:text-primary-light font-medium">
            Forgot password?
          </a>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <span className="font-medium">Demo Accounts</span>
          {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-600 space-y-2 max-h-48 overflow-y-auto">
                <p className="font-medium text-gray-800 mb-2">Password for all: ypit2026</p>
                {mockUsers.map(user => (
                  <div key={user.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                    <span className="font-medium">{user.role.replace('_', ' ')}</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{user.email}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Need help? Contact IT: <a href="mailto:it@ypit.com" className="text-primary hover:underline">it@ypit.com</a>
      </div>
    </motion.div>
  );
}
