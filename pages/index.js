import React from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Moon, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react'

const Index = () => {
  const router = useRouter()

  const sections = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview of all your activities and progress.',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      path: '/finance',
      label: 'Finance',
      icon: Wallet,
      description: 'Track your income, expenses, and financial goals.',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400'
    },
    {
      path: '/habits',
      label: 'Habits',
      icon: Target,
      description: 'Build and track your daily habits and routines.',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    },
    {
      path: '/sleep',
      label: 'Sleep',
      icon: Moon,
      description: 'Monitor your sleep patterns and quality.',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    },
    {
      path: '/journal',
      label: 'Journal',
      icon: BookOpen,
      description: 'Write and reflect on your daily thoughts and experiences.',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      path: '/mistakes',
      label: 'Mistakes',
      icon: AlertCircle,
      description: 'Learn from your mistakes and track improvements.',
      color: 'bg-red-500/10 text-red-600 dark:text-red-400'
    },
  ]

  const handleCardClick = (path) => {
    router.push(path)
  }

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Gridbook</h1>
          <p className="text-muted-foreground">
            Your personal dashboard for managing finance, habits, sleep, journal, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.path}
                onClick={() => handleCardClick(section.path)}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {section.label}
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  {section.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </Sidebar>
  )
}

export default Index
