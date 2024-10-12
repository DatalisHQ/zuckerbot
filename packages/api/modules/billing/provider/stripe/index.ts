import type { SubscriptionStatusType } from "database";
import Stripe from "stripe";
import type {
  CancelSubscription,
  CreateCheckoutLink,
  CreateCustomerPortalLink,
  GetAllPlans,
  PauseSubscription,
  ResumeSubscription,
  SubscriptionPlan,
} from "../../types";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

  if (!stripeSecretKey) {
    throw new Error("Missing env variable STRIPE_SECRET_KEY");
  }

  stripeClient = new Stripe(stripeSecretKey);

  return stripeClient;
}

export const getAllPlans: GetAllPlans = async function () {
  const stripeClient = getStripeClient();

  const response = await stripeClient.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const plans: SubscriptionPlan[] = [];

  response.data.forEach((price) => {
    const product = price.product as Stripe.Product;

    if (!plans.find((plan) => plan.id === product.id)) {
      plans.push({
        id: product.id,
        name: product.name,
        description: product.description,
        storeId: "",
        variants: [
          {
            id: price.id,
            interval: price.recurring?.interval ?? "year",
            interval_count: price.recurring?.interval_count ?? 0,
            price: price.unit_amount ?? 0,
            currency: price.currency,
          },
        ],
      });

      return;
    }

    const plan = plans.find((plan) => plan.id === product.id);

    plan?.variants.push({
      id: price.id,
      interval: price.recurring?.interval ?? "year",
      interval_count: price.recurring?.interval_count ?? 0,
      price: price.unit_amount ?? 0,
      currency: price.currency,
    });
  });

  return plans.filter((product) => product.variants.length > 0);
};

export const createCheckoutLink: CreateCheckoutLink = async function ({
  variantId,
  teamId,
  redirectUrl,
}) {
  const stripeClient = getStripeClient();

  const response = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    success_url: redirectUrl ?? "",
    line_items: [
      {
        quantity: 1,
        price: variantId,
      },
    ],
    subscription_data: {
      metadata: {
        team_id: teamId,
      },
    },
  });

  return response.url;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
  customerId,
  redirectUrl,
}) => {
  const stripeClient = getStripeClient();

  const response = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: redirectUrl ?? "",
  });

  return response.url;
};

export const pauseSubscription: PauseSubscription = async ({ id }) => {
  const stripeClient = getStripeClient();

  await stripeClient.subscriptions.update(id, {
    pause_collection: {
      behavior: "void",
    },
  });
};

export const cancelSubscription: CancelSubscription = async ({ id }) => {
  const stripeClient = getStripeClient();

  await stripeClient.subscriptions.cancel(id);
};

export const resumeSubscription: ResumeSubscription = async ({ id }) => {
  const stripeClient = getStripeClient();

  const response = await stripeClient.subscriptions.resume(id, {
    billing_cycle_anchor: "unchanged",
  });

  return {
    status: response.status as SubscriptionStatusType,
  };
};
