<script setup lang="ts">
  import type { FAQ } from "../types";

  const { t } = useTranslations();

  definePageMeta({
    layout: "marketing",
  });

  const faqItems: FAQ[] = [
    {
      question: t("faq.questions.freeTrial"),
      answer: t("faq.answers.freeTrial"),
    },
    {
      question: t("faq.questions.refundPolicy"),
      answer: t("faq.answers.refundPolicy"),
    },
    {
      question: t("faq.questions.cancelSubscription"),
      answer: t("faq.answers.cancelSubscription"),
    },
    {
      question: t("faq.questions.changePlan"),
      answer: t("faq.answers.changePlan"),
    },
    {
      question: "How does ZuckerBot work?",
      answer:
        "uses advanced AI to automate the ad creation process. Simply input your requirements, and our AI will generate ads that align with your brand and target audience.",
    },
    {
      question: "What are some upcoming features?",
      answer:
        "We are continuously working to enhance ZuckerBot with new features to better serve your ad automation needs. Upcoming features include: Automated Video Ad Creation: Generate high-quality video ads with AI, using your existing content and templates. Multi-Platform Integration: Expand beyond Facebook Ads to include integration with Google Ads, Instagram, and TikTok. Enhanced Audience Targeting: Utilize advanced AI algorithms to refine and optimize your audience targeting, ensuring your ads reach the most relevant users.",
    },
    {
      question: "How does ZuckerBot help eCommerce and marketing agencies?",
      answer:
        "ZuckerBot offers powerful tools tailored to the needs of eCommerce businesses and marketing agencies: For eCommerce Businesses: Easily create and manage ad campaigns that drive sales and increase brand visibility. Our AI-driven approach ensures your ads are optimized for engagement and conversion, helping you grow your business with minimal effort. For Marketing Agencies: Streamline your ad creation process and manage multiple client accounts with ease. ZuckerBot allows you to deliver high-performing ad campaigns efficiently, freeing up your team to focus on strategy and creative innovation.",
    },
    {
      question: "Where to contact us?",
      answer: "You can contact us at support@zuckerbot.ai.",
    },
  ];
</script>

<template>
  <section id="faq" class="bg-primary/5 py-16 lg:py-24">
    <div class="container max-w-3xl">
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold lg:text-5xl">
          {{ $t("faq.title") }}
        </h1>
        <p class="mt-2 text-lg opacity-50">
          {{ $t("faq.description") }}
        </p>
      </div>

      <Accordion type="single" collapsible class="flex flex-col gap-3">
        <AccordionItem
          v-for="(item, i) of faqItems"
          :key="i"
          :value="`faq-item-${i}`"
          class="bg-card rounded-sm border px-6 py-4"
        >
          <AccordionTrigger class="py-2 text-lg">
            {{ item.question }}
          </AccordionTrigger>
          <AccordionContent>{{ item.answer }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </section>
</template>
