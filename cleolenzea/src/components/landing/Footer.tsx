const footerLinks = {
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Benefits", href: "#benefits" },
    { label: "Contact", href: "#contact" },
  ],
  treatments: [
    { label: "Body Awareness", href: "#services" },
    { label: "Nervous System Regulation", href: "#services" },
    { label: "Movement & Expression", href: "#services" },
    { label: "Trauma Release", href: "#services" },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden" style={{ background: "rgba(255,245,225,0.7)", borderTop: "1px solid rgba(212,165,116,0.1)" }}>
      <div className="container-wide section-padding pb-8 relative" style={{ zIndex: 2 }}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          <div>
            <span className="font-heading text-xl font-normal text-warm-charcoal block mb-3">Cleolenzea</span>
            <p className="text-warm-gray font-body text-sm leading-relaxed mb-5">
              Somatic therapy for embodied healing. Reconnect with your body&apos;s wisdom.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full border border-primary/15 flex items-center justify-center text-warm-charcoal hover:bg-primary hover:text-white hover:border-primary transition-all duration-200" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-primary/15 flex items-center justify-center text-warm-charcoal hover:bg-primary hover:text-white hover:border-primary transition-all duration-200" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-normal text-warm-charcoal mb-4 text-base">Navigation</h4>
            <ul className="space-y-2.5">
              {footerLinks.navigation.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-warm-gray hover:text-primary transition-colors font-body text-sm">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-normal text-warm-charcoal mb-4 text-base">Treatments</h4>
            <ul className="space-y-2.5">
              {footerLinks.treatments.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-warm-gray hover:text-primary transition-colors font-body text-sm">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-normal text-warm-charcoal mb-4 text-base">Follow</h4>
            <p className="text-warm-gray font-body text-sm mb-4">Get updates on somatic healing resources.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-primary/15 bg-white/60 text-warm-charcoal font-body text-sm placeholder:text-warm-gray/50 focus:outline-none focus:border-primary/40" />
              <button className="px-5 py-2.5 rounded-full bg-warm-charcoal text-white font-body text-sm font-medium uppercase tracking-wider hover:bg-primary transition-colors">Join</button>
            </div>
            <a href="mailto:hello@cleolenzea.com" className="inline-block text-warm-gray hover:text-primary transition-colors font-body text-sm mt-4">
              hello@cleolenzea.com
            </a>
          </div>
        </div>

        <div className="border-t border-primary/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-warm-gray text-xs font-body">&copy; 2026 Cleolenzea. All rights reserved.</p>
          <p className="text-warm-gray/50 text-xs font-body">Powered by Somove</p>
        </div>
      </div>

      <a href="#home" className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-warm-charcoal text-white flex items-center justify-center shadow-lg hover:bg-primary transition-all duration-300 z-40" aria-label="Back to top">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
      </a>
    </footer>
  );
}
