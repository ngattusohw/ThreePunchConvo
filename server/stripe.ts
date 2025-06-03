// This is your test secret API key.
import Stripe from "stripe";
import express from "express";
import { Express, Request, Response } from "express";
import { storage } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
});

const app = express();
app.use(express.static("public"));

export const registerStripeEndpoints = (app: Express) => {
  app.post("/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { email, clerkUserId } = req.body;
      
      if (!email) {
        return res.status(400).send({ 
          error: { message: "Missing required parameter: email" } 
        });
      }

      // First check if user has a stripeId in our database
      let customerId: string | undefined;
      
      if (clerkUserId) {
        try {
          // Get user from storage using external ID (Clerk ID)
          const localUser = await storage.getUserByExternalId(clerkUserId);
          
          // If we found a user with a stripeId, use that
          if (localUser && localUser.stripeId) {
            customerId = localUser.stripeId;
          }
        } catch (dbError) {
          console.error('Error checking database for user:', dbError);
        }
      }

      console.log("HELLO FROM CREATE CHECKOUT SESSION: ", customerId);
      
      // If no stripeId found, create a new customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
        });
        
        customerId = customer?.id;
        
        // Update the user with the new Stripe customer ID if we have a clerk ID
        if (clerkUserId) {
          try {
            const localUser = await storage.getUserByExternalId(clerkUserId);
            
            if (localUser) {
              await storage.updateUser(localUser.id, { stripeId: customerId });
              console.log(`Updated user ${localUser.id} with Stripe customer ID: ${customerId}`);
            }
          } catch (dbError) {
            // TODO this is an issue bc we dont want a user to then successfully checkout but not have an associated stripe id
            console.error('Error updating user with Stripe customer ID:', dbError);
          }
        }
      }

      console.log("customer id from create checkout session: ", customerId);
      // Create the checkout session with the customer ID
      const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: [
          {
            // Provide the exact Price ID (e.g. price_1234) of the product you want to sell
            price: "price_1RTZenQt7iN2KzepXaYJIwtM",
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: customerId,
        // customer_email: email,
        // TODO: change to production url
        return_url: `http://localhost:5000/return?session_id={CHECKOUT_SESSION_ID}`,
      });

      res.send({ clientSecret: session.client_secret });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(400).send({ error: { message: error.message } });
    }
  });

  app.get("/session-status", async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.send({
      status: session.status,
      customer_email: session.customer_details?.email
    });
  });

  app.post("/create-subscription", async (req: Request, res: Response) => {
    try {
      const { customerId, priceId, clerkUserId } = req.body;
      // this is the clerk id
      if (!customerId || !priceId) {
        return res.status(400).send({ 
          error: { message: "Missing required parameters: customerId or priceId" } 
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
              console.log(`Updated user ${user.id} with Stripe customer ID: ${customerId}`);
            } else if (user.stripeId !== customerId) {
              console.warn(`User ${user.id} already has a different Stripe customer ID: ${user.stripeId} (requested: ${customerId})`);
            }
          }
        } catch (dbError) {
          // Log but don't fail the request if database update fails
          console.error('Error updating user with Stripe customer ID:', dbError);
        }
      }
      
      res.send(subscription);
    } catch (error: any) {
      res.status(400).send({ error: { message: error.message } });
    }
  });

  app.post("/create-customer", async (req: Request, res: Response) => {
    try {
      const { name, email, clerkUserId } = req.body;
      
      if (!email) {
        return res.status(400).send({ 
          error: { message: "Missing required parameter: email" } 
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
            console.log(`Updated user ${user.id} with Stripe customer ID: ${customer.id}`);
          }
        } catch (dbError) {
          // TODO this is an issue bc we dont want a user to then successfully checkout but not have an associated stripe id
          console.error('Error updating user with Stripe customer ID:', dbError);
        }
      }
      
      res.send({ 
        customerId: customer.id,
        customer
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
          error: { message: "Missing required parameter: customerId" } 
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
      
      res.send(subscriptions);
    } catch (error: any) {
      res.status(400).send({ error: { message: error.message } });
    }
  });

  // Stripe webhook endpoint to handle events
  app.post("/webhook", express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret is not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify the event came from Stripe
      const rawBody = req.body;
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
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
  });
}

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
    let planType = 'FREE';
    
    // Get the first subscription item's price ID (assuming one product per subscription)
    const priceId = subscription.items.data[0]?.price.id;
    
    // Map price IDs to plan types
    // Update these price IDs to match your actual Stripe product price IDs
    switch (priceId) {
      case 'price_1RTZenQt7iN2KzepXaYJIwtM': // Example - replace with your actual price ID
        planType = 'BASIC';
        break;
      case 'price_premium': // Example - replace with your actual price ID
        planType = 'PRO';
        break;
      default:
        // Check subscription status
        if (subscription.status !== 'active') {
          planType = 'FREE';
        }
    }
    
    // Update the user's plan type
    await storage.updateUser(user.id, { planType });
    
    console.log(`Updated user ${user.id} plan to ${planType} based on subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
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
    await storage.updateUser(user.id, { planType: 'FREE' });
    
    console.log(`Downgraded user ${user.id} to FREE plan due to cancelled subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// TODO cancel subscription, resume subscription, update subscription, delete subscription