import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const posts = [
  {
    category: "Somatic",
    date: "May 5, 2024",
    title: "The Science of Somatic Therapy: Understanding Body-Based Healing",
    excerpt: "Explore how somatic therapy bridges neuroscience and ancient wisdom for modern healing.",
  },
  {
    category: "Trauma",
    date: "May 5, 2024",
    title: "The Benefits of Somatic Therapy: Physical, Emotional, and Mental",
    excerpt: "Discover the wide-ranging benefits of working with your body's innate healing capacity.",
  },
  {
    category: "Healing",
    date: "May 5, 2024",
    title: "My Somatic Journey: A Path to Self-Discovery",
    excerpt: "A personal account of transformation through body-based awareness practices.",
  },
];

export function Blog() {
  return (
    <section id="blog" className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <SectionHeading
            eyebrow="Blogs"
            title="Recent Articles & Insights"
          />
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {posts.map((post, i) => (
            <AnimatedSection key={post.title} delay={i * 150}>
              <div className="section-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div
                  className="h-40 sm:h-48 rounded-[20px] mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(212,165,116,0.15), rgba(139,168,136,0.1))" }}
                />
                <div className="flex items-center gap-3 mb-3">
                  <span className="pill-badge-accent text-[10px]">{post.category}</span>
                  <span className="text-warm-gray text-xs font-body">{post.date}</span>
                </div>
                <h4 className="font-heading text-base sm:text-lg font-normal text-warm-charcoal mb-2 leading-snug">
                  {post.title}
                </h4>
                <p className="text-warm-gray font-body text-sm leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
