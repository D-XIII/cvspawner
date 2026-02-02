'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { FileText, Briefcase, GraduationCap, Wrench, ArrowRight, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import ScrollReveal from '@/components/animations/ScrollReveal'
import DemoCV from '@/components/home/DemoCV'
import DemoStats from '@/components/home/DemoStats'

const features = [
  {
    icon: Briefcase,
    title: 'Experiences',
    description: 'Track all your professional experiences with detailed descriptions and skills.',
    href: '/experiences',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: GraduationCap,
    title: 'Formations',
    description: 'Document your educational background, certifications, and achievements.',
    href: '/formations',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Wrench,
    title: 'Skills',
    description: 'Showcase your technical skills, soft skills, and language proficiencies.',
    href: '/skills',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FileText,
    title: 'CV Generator',
    description: 'Create a beautiful, one-page CV by selecting your best experiences.',
    href: '/generator',
    color: 'from-green-500 to-emerald-500',
  },
]

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Professional CV Generator
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Create Your</span>
              <br />
              <span className="gradient-text">Perfect CV</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto">
              Manage all your professional experiences, skills, and education in one place.
              Generate beautiful, one-page CVs tailored to each opportunity.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {session ? (
                <>
                  <Link href="/generator">
                    <Button size="lg" className="gap-2">
                      Start Creating
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="secondary" size="lg">
                      Setup Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg" className="gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="secondary" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                See It In Action
              </h2>
              <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                Generate professional CVs and track your job applications all in one place.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Demo CV */}
            <div className="flex justify-center">
              <DemoCV />
            </div>

            {/* Demo Stats */}
            <div className="max-w-md mx-auto lg:mx-0">
              <DemoStats />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Everything You Need
              </h2>
              <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                A complete toolkit to build and maintain your professional presence.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.1}>
                <Link href={feature.href}>
                  <Card hover className="h-full group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                Three simple steps to create your professional CV.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add Your Data',
                description: 'Enter your experiences, education, and skills into the platform.',
              },
              {
                step: '02',
                title: 'Select & Customize',
                description: 'Choose which items to include in your CV for each application.',
              },
              {
                step: '03',
                title: 'Export PDF',
                description: 'Generate a beautiful, one-page PDF ready to send to employers.',
              },
            ].map((item, index) => (
              <ScrollReveal key={item.step} delay={index * 0.15}>
                <div className="relative">
                  <div className="text-8xl font-bold text-primary/10 absolute -top-4 -left-2">
                    {item.step}
                  </div>
                  <div className="relative pt-12 pl-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/20 via-card to-accent/10">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Build Your CV?
            </h2>
            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
              {session
                ? 'Start adding your experiences and create a stunning CV that stands out.'
                : 'Join now and create a stunning CV that stands out from the crowd.'}
            </p>
            <Link href={session ? '/generator' : '/auth/signup'}>
              <Button size="lg" className="gap-2 animate-pulse-glow">
                <FileText className="w-5 h-5" />
                {session ? 'Create Your CV Now' : 'Get Started Free'}
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
