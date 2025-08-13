import { Shield, Lock, Zap, Users } from 'lucide-react';

const trustSignals = [
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security"
  },
  {
    icon: Lock,
    title: "Data Protection", 
    description: "Your information stays private"
  },
  {
    icon: Users,
    title: "Global Community",
    description: "Students worldwide trust us"
  },
  {
    icon: Zap,
    title: "Always Available",
    description: "Study whenever you need"
  }
];

export function TrustSignals() {
  return (
    <div className="border-t bg-muted/30">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Trusted by Students & Institutions
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {trustSignals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium text-sm mb-1">{signal.title}</h4>
                <p className="text-xs text-muted-foreground">{signal.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center items-center gap-6 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Free Forever Plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}