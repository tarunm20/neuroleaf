import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Biology Major",
    content: "Neuroleaf transformed how I study. The AI-generated questions feel like having a personal tutor who knows exactly what I need to work on.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez", 
    role: "Business Student",
    content: "I upload my lecture notes and get comprehensive flashcards instantly. The test mode with personalized feedback has improved my exam scores significantly.",
    rating: 5,
  },
  {
    name: "Emily Johnson",
    role: "Psychology Major",
    content: "The AI understands complex academic material better than any other study tool I've used. It breaks down difficult concepts perfectly.",
    rating: 5,
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 rounded-lg border bg-card p-4 md:p-6 shadow-sm">
      <div className="flex gap-1">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <blockquote className="text-xs md:text-sm leading-relaxed text-muted-foreground">
        "{testimonial.content}"
      </blockquote>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary/10 text-xs md:text-sm font-medium">
          {testimonial.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="text-xs md:text-sm font-medium">{testimonial.name}</div>
          <div className="text-xs text-muted-foreground">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}

function SocialProofStats() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-semibold mb-2">Trusted by learners worldwide</h3>
        <p className="text-muted-foreground text-sm md:text-base">Join students who are studying smarter with AI</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center w-full max-w-4xl">
        <div>
          <div className="text-2xl md:text-3xl font-bold text-primary">Students</div>
          <div className="text-xs md:text-sm text-muted-foreground">Around the World</div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-primary">Thousands</div>
          <div className="text-xs md:text-sm text-muted-foreground">of Flashcards</div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-primary">Better</div>
          <div className="text-xs md:text-sm text-muted-foreground">Study Results</div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-primary">AI-Powered</div>
          <div className="text-xs md:text-sm text-muted-foreground">Learning</div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <div className="container mx-auto py-16 px-4">
      <SocialProofStats />
      
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}