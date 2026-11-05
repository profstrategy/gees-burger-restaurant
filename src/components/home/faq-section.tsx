'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api, type FaqItem } from '@/lib/api';
import faqFallback from '@/data/faq.json';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from '@/components/common/section-heading';

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>(faqFallback as FaqItem[]);
  const loggedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    api
      .getFaqs(controller.signal)
      .then((data) => {
        if (data.length > 0) {
          setFaqs(data);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  // Log a dev warning for any FAQ entry with needsClientConfirmation: true (hide nothing automatically)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    for (const faq of faqs) {
      if (faq.needsClientConfirmation && !loggedIdsRef.current.has(faq.id)) {
        loggedIdsRef.current.add(faq.id);
        console.warn(
          `[Gee's Burger FAQ] Entry "${faq.id}" ("${faq.question}") has needsClientConfirmation: true.`
        );
      }
    }
  }, [faqs]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionHeading
        kicker="Ordering · Pickup · Delivery"
        title="FREQUENTLY ASKED QUESTIONS"
      />

      <Accordion type="single" collapsible defaultValue="faq_1">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
