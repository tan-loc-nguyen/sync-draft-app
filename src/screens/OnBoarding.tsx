import {Button} from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClockIcon, EditingIcon, GroupIcon, MergeIcon } from '@/assets/icons'
import Logo from "@/components/Logo"
import useAuth from "@/hook/useAuth";

export default function OnBoarding() {
  const { login, signup } = useAuth();

  const handleLoginAndSignup = async (where: string) => {
    if (where === 'signup') {
      await signup();
    } else {
      await login();
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Logo />
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Button onClick={() => handleLoginAndSignup('login')}>
                Log in
              </Button>
            </li>
            <li>
              <Button onClick={() => handleLoginAndSignup('signup')}>
                Sign up
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Collaborative Document Editing for Academic Teams
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sync Draft streamlines your research workflow with real-time collaboration, 
            version control, and seamless merging of ideas.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <EditingIcon />
                <span>Real-time Editing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Collaborate with your team in real-time, seeing changes as they happen.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GroupIcon />
                <span>Team Collaboration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Invite team members by sharing a link with ease.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MergeIcon />
                <span>Version Control</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track changes, create drafts, and merge revisions seamlessly.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClockIcon />
                <span>Asynchronous Work</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work on your own time and sync changes when you're ready.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your academic writing?</h2>
          <Button onClick={() => handleLoginAndSignup('login')}>
            Get Started
          </Button>
        </section>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Sync Draft. All rights reserved.
        </div>
      </footer>
    </div>
  )
}