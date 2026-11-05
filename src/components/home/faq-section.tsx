'use client';

import React, { useEffect, useState } from 'react';
import { api, type FaqItem } from '@/lib/api';
import faqFallback from '@/data/faq.json';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>(faqFallback as FaqItem[]);

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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F8E010]">
          Ordering · Pickup · Delivery
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-[#F8E010] text-balance">
          FREQUENTLY ASKED QUESTIONS
        </h2>
      </div>

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
