// This is your test secret API key.
import Stripe from "stripe";
import express from "express";
import { Express, Request, Response } from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
});

const app = express();
app.use(express.static("public"));

export const registerStripeEndpoints = (app: Express) => {
  app.post("/create-checkout-session", async (req: Request, res: Response) => {
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
      customer_email: req.body.email,
      // TODO: change to production url
      return_url: `http://localhost:5000/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.send({ clientSecret: session.client_secret });
  });

  app.get("/session-status", async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.send({
      status: session.status,
      customer_email: session.customer_details?.email
    });
  });
}