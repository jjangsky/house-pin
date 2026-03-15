import { useEffect, useRef } from "react";

export default function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const targets = el.querySelectorAll(".scroll-hidden");
    targets.forEach((target) => observer.observe(target));
    if (el.classList.contains("scroll-hidden")) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
