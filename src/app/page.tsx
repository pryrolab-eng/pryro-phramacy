import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Users,
  Zap,
  Package,
  CreditCard,
  BarChart3,
  Stethoscope,
  FileText,
  Clock,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Pharmacy Management Solution
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Streamline your pharmacy operations with our comprehensive
              platform designed specifically for African markets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Package className="w-6 h-6" />,
                title: "Inventory Management",
                description:
                  "Track medications, expiry dates, and batch management with automated low stock alerts",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "POS System",
                description:
                  "Streamlined checkout with barcode scanning and insurance payment splitting",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Insurance Integration",
                description:
                  "Define providers, calculate coverage, and manage claim submissions seamlessly",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "RRA E-Invoicing",
                description:
                  "Automated compliance with Rwanda Revenue Authority e-invoicing requirements",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Multi-Tenant SaaS",
                description:
                  "Role-based access across admin, pharmacy, and POS interfaces",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics Dashboard",
                description:
                  "Comprehensive reporting and analytics for informed decision making",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Key Modules */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Stethoscope className="w-8 h-8" />,
                title: "Pharmacy Dashboard",
                description: "Intuitive inventory management",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "POS System",
                description: "Streamlined checkout process",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Insurance Module",
                description: "Complete coverage management",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Admin Controls",
                description: "Subscription & analytics",
              },
            ].map((module, index) => (
              <div
                key={index}
                className="text-center p-6 bg-blue-50 rounded-lg"
              >
                <div className="text-blue-600 mb-3 flex justify-center">
                  {module.icon}
                </div>
                <h4 className="font-semibold mb-2">{module.title}</h4>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Built for African Healthcare
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Designed with local requirements and regulations in mind
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold mb-2 text-blue-600">100%</div>
              <div className="text-gray-600 font-medium mb-2">Cloud-Based</div>
              <div className="text-sm text-gray-500">
                No infrastructure needed
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold mb-2 text-green-600">RRA</div>
              <div className="text-gray-600 font-medium mb-2">Compliant</div>
              <div className="text-sm text-gray-500">E-invoicing ready</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold mb-2 text-purple-600">
                24/7
              </div>
              <div className="text-gray-600 font-medium mb-2">Support</div>
              <div className="text-sm text-gray-500">Always available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Modern Technology Stack</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Built with Next.js 14, Supabase, and Tailwind CSS for optimal
            performance and scalability
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Next.js 14",
              "Supabase",
              "Tailwind CSS",
              "shadcn/ui",
              "TypeScript",
            ].map((tech, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-500 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transform Your Pharmacy Today
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join forward-thinking pharmacies across Africa who are modernizing
            their operations with Pyro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Free Trial
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center px-8 py-4 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              Schedule Demo
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Setup in under 30 minutes</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
