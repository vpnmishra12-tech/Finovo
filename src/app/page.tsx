
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Header } from '@/components/layout/header';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { ExpenseList } from '@/components/expenses/expense-list';
import { AddExpenseDrawer } from '@/components/expenses/add-expense-drawer';
import { Loader2, Sparkles, Wallet, ShieldCheck, Phone, CheckCircle2, Info } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Expense } from '@/lib/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const { user, loading, sendOtp, verifyOtp, isOtpSent } = useAuth();
  const { t } = useLanguage();
  const firestore = useFirestore();
  
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Memoized query for expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Expense>(expensesQuery);

  const handleSendOtp = async () => {
    // Basic validation
    if (phoneNumber.length < 13) return;
    await sendOtp(phoneNumber);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    await verifyOtp(otp);
    setIsVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Checking access...</p>
        </div>
      </div>
    );
  }

  // Landing Page for Unauthenticated Users
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 max-w-2xl mx-auto">
          <div className="p-4 bg-primary/10 rounded-3xl mb-4">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight">
              Control your money with <span className="text-primary">AI</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track expenses using voice, text, or bill scans. Log in with your phone to sync across devices.
            </p>
          </div>

          <Card className="w-full max-w-sm border-none shadow-2xl rounded-3xl overflow-hidden bg-card">
            <CardContent className="p-8 space-y-6">
              {!isOtpSent ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted border-none text-lg font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Info className="w-3 h-3" /> Important: Always include +91 prefix
                    </p>
                  </div>
                  <Button 
                    onClick={handleSendOtp}
                    className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                    disabled={phoneNumber.length < 13}
                  >
                    Send OTP <CheckCircle2 className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Enter OTP</label>
                    <Input 
                      type="number" 
                      placeholder="6-digit code" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-14 rounded-2xl bg-muted border-none text-center text-2xl font-bold tracking-[1em]"
                    />
                  </div>
                  <Button 
                    onClick={handleVerifyOtp}
                    className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                    disabled={otp.length !== 6 || isVerifying}
                  >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                  </Button>
                  <Button variant="link" onClick={() => window.location.reload()} className="w-full text-muted-foreground">
                    Edit phone number
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-6 pt-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard for Authenticated Users
  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">
            {t.welcome} 👋
          </p>
          <h2 className="text-3xl font-headline font-bold">{t.dashboard}</h2>
        </section>

        <BudgetSummary 
          userId={user.uid} 
          totalSpent={expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0} 
        />

        <SpendingChart expenses={expenses || []} />

        <ExpenseList expenses={expenses || []} isLoading={isExpensesLoading} />
      </main>
      
      <AddExpenseDrawer />
    </div>
  );
}
