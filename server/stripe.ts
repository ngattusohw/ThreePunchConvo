// This is your test secret API key.
import Stripe from "stripe";
import express from "express";
import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { requireAuth } from "@clerk/express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
});

const app = express();
app.use(express.static("public"));

export const registerStripeEndpoints = (app: Express) => {
  app.post(
    "/create-checkout-session",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { email, clerkUserId, plan } = req.body; // Add plan to destructuring
  
        if (!email || !clerkUserId) {
          return res.status(400).send({
            error: { message: "Missing required parameters: email and clerkUserId" },
          });
        }

        console.log("plan from create checkout session: ", plan);
  
        // Determine which price ID to use based on plan
        let priceId: string;
        if (plan === 'yearly') {
          priceId = process.env.STRIPE_PRICE_ID_YEARLY || "";
        } else {
          priceId = process.env.STRIPE_PRICE_ID_MONTHLY || "";
        }
  
        // Validate that we have the price ID
        if (!priceId) {
          return res.status(500).send({
            error: { message: `Missing Stripe price ID for ${plan} plan` },
          });
        }
  
        // First check if user has a stripeId in our database
        let customerId: string | undefined;
        let localUser;
  
        try {
          // Get user from storage using external ID (Clerk ID)
          localUser = await storage.getUserByExternalId(clerkUserId);
  
          // If we found a user with a stripeId, use that
          if (localUser && localUser.stripeId) {
            customerId = localUser.stripeId;
          }
        } catch (dbError) {
          console.error("Error checking database for user:", dbError);
          return res.status(500).send({
            error: { message: "Database error while checking user" },
          });
        }
  
        console.log("HELLO FROM CREATE CHECKOUT SESSION: ", customerId);
  
        // Check if customer already has an active subscription
        if (customerId) {
          try {
            const existingSubscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 1,
            });
  
            if (existingSubscriptions.data.length > 0) {
              return res.status(400).send({
                error: { 
                  message: "Customer already has an active subscription",
                  subscriptionId: existingSubscriptions.data[0].id 
                },
              });
            }
  
            // Check for pending/incomplete checkout sessions and expire them
            const existingSessions = await stripe.checkout.sessions.list({
              customer: customerId,
              status: 'open',
              limit: 10,
            });

            if (existingSessions.data.length > 0) {
              console.log(`Found ${existingSessions.data.length} existing open sessions, expiring them`);
              for (const session of existingSessions.data) {
                try {
                  await stripe.checkout.sessions.expire(session.id);
                  console.log("Expired existing session:", session.id);
                } catch (expireError) {
                  console.warn("Could not expire session:", session.id, expireError);
                }
              }
            }
          } catch (stripeError) {
            console.error("Error checking existing subscriptions/sessions:", stripeError);
            // Continue with session creation if we can't check existing ones
          }
        }
  
        // If no stripeId found, create a new customer
        if (!customerId) {
          // Check if customer already exists by email to prevent duplicates
          const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
          });
  
          if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0]?.id;
            console.log("Found existing Stripe customer by email:", customerId);
            
            // Update local user with existing Stripe customer ID
            if (localUser) {
              try {
                await storage.updateUser(localUser.id, {
                  stripeId: customerId,
                });
                console.log(
                  `Updated user ${localUser.id} with existing Stripe customer ID: ${customerId}`,
                );
              } catch (dbError) {
                console.error("Error updating user with existing Stripe customer ID:", dbError);
              }
            }
          } else {
            // Create new customer
            const customer = await stripe.customers.create({
              email,
              metadata: {
                clerkUserId: clerkUserId,
                userId: localUser?.id,
              }
            });
  
            customerId = customer?.id;
            console.log("Created new Stripe customer:", customerId);
  
            // Update the user with the new Stripe customer ID
            if (localUser) {
              try {
                await storage.updateUser(localUser.id, {
                  stripeId: customerId,
                });
                console.log(
                  `Updated user ${localUser.id} with new Stripe customer ID: ${customerId}`,
                );
              } catch (dbError) {
                console.error(
                  "Error updating user with Stripe customer ID:",
                  dbError,
                );
                return res.status(500).send({
                  error: { message: "Failed to link Stripe customer to user account" },
                });
              }
            }
          }
        }
  
        console.log("customer id from create checkout session: ", customerId);
        console.log("price id from create checkout session: ", priceId);
        // Add idempotency key to prevent duplicate sessions
        const idempotencyKey = `checkout_${clerkUserId}_${Date.now()}`;
        
        // Create the checkout session with the customer ID
        const session = await stripe.checkout.sessions.create({
          ui_mode: "custom",
          allow_promotion_codes: true,
          line_items: [
            {
              price: priceId, // Use the determined price ID
              quantity: 1,
            },
          ],
          mode: "subscription",
          customer: customerId,
          // Add metadata for tracking
          metadata: {
            clerkUserId: clerkUserId,
            userId: localUser?.id,
            plan: plan, // Add plan to metadata
          },
          // Prevent duplicate subscriptions
          subscription_data: {
            metadata: {
              clerkUserId: clerkUserId,
              userId: localUser?.id,
              plan: plan, // Add plan to subscription metadata
            },
          },
          return_url: `https://www.${process.env.EXTERNAL_URL || "threepunchconvo-production.up.railway.app"}/return?session_id={CHECKOUT_SESSION_ID}`,
        }, {
          idempotencyKey: idempotencyKey, // Stripe's built-in idempotency protection
        });
  
        res.send({ 
          clientSecret: session.client_secret,
          sessionId: session.id,
          isExisting: false 
        });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(400).send({ error: { message: error.message } });
      }
    },
  );
  
app.get(
  "/check-subscription-status",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.query;

      if (!clerkUserId) {
        return res.status(400).send({
          error: { message: "Missing required parameter: clerkUserId" },
        });
      }

      // Get user from database
      const localUser = await storage.getUserByExternalId(clerkUserId as string);
      
      if (!localUser || !localUser.stripeId) {
        return res.send({ 
          hasActiveSubscription: false,
          hasStripeCustomer: false 
        });
      }

      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: localUser.stripeId,
        status: 'active',
        limit: 5,
      });

      // Check for pending checkout sessions
      const pendingSessions = await stripe.checkout.sessions.list({
        customer: localUser.stripeId,
        status: 'open',
        limit: 5,
      });

      // Get details of the most recent pending session if it exists
      let mostRecentPendingSession = null;
      if (pendingSessions.data.length > 0) {
        const session = pendingSessions.data[0];
        mostRecentPendingSession = {
          id: session.id,
          status: session.status,
          created: session.created,
          expiresAt: session.expires_at,
          clientSecret: session.client_secret, // Include client secret for direct use
        };
      }

      res.send({
        hasActiveSubscription: subscriptions.data.length > 0,
        hasStripeCustomer: true,
        activeSubscriptions: subscriptions.data.length,
        pendingSessions: pendingSessions.data.length,
        mostRecentPendingSession, // Include session details
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          created: sub.created,
        })),
      });
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      res.status(500).send({ error: { message: error.message } });
    }
  },
);

app.get(
  "/get-existing-checkout-session",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.query;

      if (!clerkUserId) {
        return res.status(400).send({
          error: { message: "Missing required parameter: clerkUserId" },
        });
      }

      // Get user from database
      const localUser = await storage.getUserByExternalId(clerkUserId as string);
      
      if (!localUser || !localUser.stripeId) {
        return res.status(404).send({ 
          error: { message: "User or Stripe customer not found" }
        });
      }

      // Get the most recent open checkout session
      const sessions = await stripe.checkout.sessions.list({
        customer: localUser.stripeId,
        status: 'open',
        limit: 1,
      });

      if (sessions.data.length === 0) {
        return res.status(404).send({
          error: { message: "No open checkout sessions found" }
        });
      }

      const session = sessions.data[0];
      
      // Return the session details
      res.send({
        clientSecret: session.client_secret,
        sessionId: session.id,
        status: session.status,
        created: session.created,
        expiresAt: session.expires_at,
      });
      
    } catch (error: any) {
      console.error("Error retrieving existing checkout session:", error);
      res.status(500).send({ error: { message: error.message } });
    }
  },
);

  app.get("/session-status", async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.send({
      status: session.status,
      customer_email: session.customer_details?.email,
    });
  });

  app.post(
    "/create-subscription",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { customerId, priceId, clerkUserId } = req.body;
        // this is the clerk id
        if (!customerId || !priceId) {
          return res.status(400).send({
            error: {
              message: "Missing required parameters: customerId or priceId",
            },
          });
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
        });

        // If Clerk user ID is provided, make sure the Stripe customer ID is associated with the user
        if (clerkUserId) {
          try {
            // Get the user from the database
            const user = await storage.getUserByExternalId(clerkUserId);

            if (user) {
              // Only update if the user doesn't already have a stripeId
              if (!user.stripeId) {
                // Update the user with the Stripe customer ID
                await storage.updateUser(user.id, { stripeId: customerId });
                console.log(
                  `Updated user ${user.id} with Stripe customer ID: ${customerId}`,
                );
              } else if (user.stripeId !== customerId) {
                console.warn(
                  `User ${user.id} already has a different Stripe customer ID: ${user.stripeId} (requested: ${customerId})`,
                );
              }
            }
          } catch (dbError) {
            // Log but don't fail the request if database update fails
            console.error(
              "Error updating user with Stripe customer ID:",
              dbError,
            );
          }
        }

        res.send(subscription);
      } catch (error: any) {
        res.status(400).send({ error: { message: error.message } });
      }
    },
  );

  app.post("/create-customer", async (req: Request, res: Response) => {
    try {
      const { name, email, clerkUserId } = req.body;

      if (!email) {
        return res.status(400).send({
          error: { message: "Missing required parameter: email" },
        });
      }

      // Create the Stripe customer
      const customer = await stripe.customers.create({
        name,
        email,
      });

      // If Clerk user ID is provided, update the user record with the Stripe customer ID
      if (clerkUserId) {
        try {
          // Get the user from the database
          const user = await storage.getUserByExternalId(clerkUserId);

          if (user) {
            // Update the user with the Stripe customer ID
            await storage.updateUser(user.id, { stripeId: customer.id });
            console.log(
              `Updated user ${user.id} with Stripe customer ID: ${customer.id}`,
            );
          }
        } catch (dbError) {
          // TODO this is an issue bc we dont want a user to then successfully checkout but not have an associated stripe id
          console.error(
            "Error updating user with Stripe customer ID:",
            dbError,
          );
        }
      }

      res.send({
        customerId: customer.id,
        customer,
      });
    } catch (error: any) {
      res.status(400).send({ error: { message: error.message } });
    }
  });

  app.get("/get-subscriptions", async (req: Request, res: Response) => {
    try {
      const { customerId, status } = req.query;

      if (!customerId) {
        return res.status(400).send({
          error: { message: "Missing required parameter: customerId" },
        });
      }

      const params: Stripe.SubscriptionListParams = {
        customer: customerId as string,
        limit: 10,
      };

      if (status) {
        params.status = status as Stripe.SubscriptionListParams["status"];
      }

      const subscriptions = await stripe.subscriptions.list(params);

      // Return in the format expected by the frontend
      res.json({ subscriptions: subscriptions.data });
    } catch (error: any) {
      res.status(400).send({ error: { message: error.message } });
    }
  });

  // Get available subscription plans/products from Stripe
  app.get("/get-plans", async (req: Request, res: Response) => {
    try {
      // Fetch all products
      const products = await stripe.products.list({
        active: true,
        expand: ["data.default_price"],
      });

      // Map products to plans with their prices
      const plans = products.data.map((product) => {
        const defaultPrice = product.default_price as Stripe.Price | null;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          planType: product.metadata?.planType,
          features: product.metadata?.features
            ? JSON.parse(product.metadata.features)
            : [],
          price: defaultPrice?.unit_amount,
        };
      });

      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).send({ error: { message: error.message } });
    }
  });

  // Create customer portal session for billing management
  app.post(
    "/create-portal-session",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { customerId } = req.body;

        if (!customerId) {
          return res.status(400).send({
            error: { message: "Missing required parameter: customerId" },
          });
        }

        // Create a customer portal session
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: process.env.EXTERNAL_URL
            ? `https://${process.env.EXTERNAL_URL}/forum`
            : "https://threepunchconvo.com/forum",
        });

        res.send({ url: session.url });
      } catch (error: any) {
        console.error("Error creating portal session:", error);
        res.status(500).send({ error: { message: error.message } });
      }
    },
  );

  // Stripe webhook endpoint to handle events
  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret is not configured");
        return res.status(500).send("Webhook secret not configured");
      }

      let event: Stripe.Event;

      try {
        // Verify the event came from Stripe
        const rawBody = req.body;
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      try {
        switch (event.type) {
          case "customer.subscription.created":
          case "customer.subscription.updated":
            await handleSubscriptionChange(
              event.data.object as Stripe.Subscription,
            );
            break;
          case "customer.subscription.deleted":
            await handleSubscriptionCancelled(
              event.data.object as Stripe.Subscription,
            );
            break;
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.send({ received: true });
      } catch (err: any) {
        console.error(`Error handling webhook event: ${err.message}`);
        res.status(500).send(`Webhook handler error: ${err.message}`);
      }
    },
  );
};

// Function to handle subscription created or updated events
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the user with this Stripe customer ID
    const user = await storage.getUserByStripeId(customerId);

    if (!user) {
      console.error(`No user found with Stripe customer ID: ${customerId}`);
      return;
    }

    // Determine the plan type based on the subscription
    let planType = "FREE";

    // Get the first subscription item's price ID (assuming one product per subscription)
    const priceId = subscription.items.data[0]?.price.id;

    // Map price IDs to plan types - check all possible price IDs
    switch (priceId) {
      case process.env.STRIPE_PRICE_ID: // Legacy/existing price ID
      case process.env.STRIPE_PRICE_ID_MONTHLY: // New monthly price ID
      case process.env.STRIPE_PRICE_ID_YEARLY: // New yearly price ID
        planType = "BASIC";
        break;
      default:
        // Check subscription status
        if (subscription.status !== "active") {
          planType = "FREE";
        }
    }

    // Update the user's plan type
    await storage.updateUser(user.id, { planType });

    console.log(
      `Updated user ${user.id} plan to ${planType} based on subscription ${subscription.id} with price ID ${priceId}`,
    );
  } catch (error) {
    console.error("Error handling subscription change:", error);
    throw error;
  }
}

// Function to handle subscription cancelled events
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the user with this Stripe customer ID
    const user = await storage.getUserByStripeId(customerId);

    if (!user) {
      console.error(`No user found with Stripe customer ID: ${customerId}`);
      return;
    }

    // Downgrade the user to FREE plan
    await storage.updateUser(user.id, { planType: "FREE" });

    console.log(
      `Downgraded user ${user.id} to FREE plan due to cancelled subscription ${subscription.id}`,
    );
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
    throw error;
  }
}

// Function to handle user deleted events
export async function handleUserDeleted(stripeId: string) {
  try {
    // Mark user as disabled and remove payment method
    await stripe.customers.update(stripeId, {
      invoice_settings: {
        default_payment_method: null,
      },
      metadata: {
        disabled: "true",
        disabledAt: new Date().toISOString(),
      },
    });

    // Find and cancel all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeId,
      status: "active",
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }
  } catch (error) {
    console.error(`Error handling user deleted: ${error}`);
    throw error;
  }
}

// TODO cancel subscription, resume subscription, update subscription, delete subscription
