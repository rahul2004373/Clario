import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex h-16 items-center px-6 border-b border-border/40">
        <div className="flex items-center gap-2 font-bold text-xl">
          <BotMessageSquare className="w-6 h-6 text-primary" />
          <span>Clairo</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl mb-6">
          Build Custom AI Chatbots <br className="hidden sm:block" /> in Minutes
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
          Upload your data, customize your bot, and deploy it to your website instantly.
          No coding required.
        </p>
        <div className="flex gap-4">
          <Link to="/signup">
            <Button size="lg" className="h-12 px-8">Get Started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
