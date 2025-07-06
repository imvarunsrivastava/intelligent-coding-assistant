import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Code2, 
  MessageSquare, 
  Zap, 
  RefreshCw, 
  TestTube, 
  Bug, 
  FileText,
  Sparkles,
  Users,
  Star,
  CheckCircle
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { motion } from 'framer-motion'

const HomePage = () => {
  const features = [
    {
      icon: Code2,
      title: "Code Generation",
      description: "Transform natural language descriptions into working code in any programming language."
    },
    {
      icon: MessageSquare,
      title: "Code Explanation",
      description: "Get detailed explanations of complex code snippets and algorithms."
    },
    {
      icon: RefreshCw,
      title: "Smart Refactoring",
      description: "Improve code quality with AI-powered refactoring suggestions."
    },
    {
      icon: TestTube,
      title: "Test Generation",
      description: "Automatically generate comprehensive unit tests for your code."
    },
    {
      icon: Bug,
      title: "Debug Assistant",
      description: "Get help debugging errors with intelligent suggestions and fixes."
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Generate clear, comprehensive documentation for your code."
    }
  ]

  const stats = [
    { label: "Lines of Code Generated", value: "10M+" },
    { label: "Developers Helped", value: "50K+" },
    { label: "Languages Supported", value: "20+" },
    { label: "Accuracy Rate", value: "95%" }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Developer",
      company: "TechCorp",
      content: "This AI assistant has revolutionized my coding workflow. It's like having a senior developer pair programming with me 24/7.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Mike Johnson",
      role: "Full Stack Engineer",
      company: "StartupXYZ",
      content: "The code explanations are incredibly detailed. It's helped me understand complex algorithms and improve my coding skills.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez",
      role: "Software Architect",
      company: "BigTech Inc",
      content: "The refactoring suggestions are spot-on. It's saved our team countless hours and improved our code quality significantly.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container relative py-24 lg:py-32">
          <motion.div 
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary/20 transition-all">
                🎉 Now with GPT-4 and Claude support{' '}
                <Link to="/playground" className="font-semibold text-primary">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Try it now <ArrowRight className="inline h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="gradient-text">AI-Powered</span>
              <br />
              Coding Assistant
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Transform the way you code with our intelligent AI assistant. Generate, explain, refactor, 
              and debug code with natural language. Boost your productivity and learn faster.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" variant="gradient" asChild>
                <Link to="/playground">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Coding
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/chat">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Try AI Chat
                </Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div 
            className="mx-auto max-w-2xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to code smarter
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our AI assistant provides comprehensive coding support across all major programming languages.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  viewport={{ once: true }}
                >
                  <Card className="feature-card h-full">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <motion.div 
            className="mx-auto max-w-2xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              See it in action
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Watch how our AI assistant transforms natural language into working code.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-4xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Zap className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Interactive Demo</h3>
                    <p className="text-blue-100 mb-6">Experience the power of AI-assisted coding</p>
                    <Button variant="secondary" size="lg" asChild>
                      <Link to="/playground">
                        Try Live Demo
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div 
            className="mx-auto max-w-2xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by developers worldwide
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of developers who are already coding smarter with our AI assistant.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground mb-6">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container">
          <motion.div 
            className="mx-auto max-w-2xl text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform your coding experience?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of developers who are already coding smarter with AI assistance.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/playground">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link to="/pricing">
                  View Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage