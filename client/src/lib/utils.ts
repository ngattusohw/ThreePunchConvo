import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SUBSCRIPTION_STATUS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Make sure the date is valid before formatting
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diff < 60) {
    return `${diff}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else if (diff < 2592000) {
    return `${Math.floor(diff / 86400)}d ago`;
  } else {
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export function shortenNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Converts a date to a formatted event date
export function formatEventDate(date: Date | string | number): string {
  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Make sure the date is valid before formatting
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Formats a username for display
export function formatUsername(username: string, maxLength = 15): string {
  return username.length > maxLength
    ? username.substring(0, maxLength - 3) + "..."
    : username;
}

export function getSubscriptionStatus(subscriptions: any[]): string {
  if (subscriptions && subscriptions.length > 0) {
    // get the product for the subscription
    const subscription = subscriptions[0];
    const { plan } = subscription;
    const { product } = plan;

    if (product && SUBSCRIPTION_STATUS[product]) {
      return SUBSCRIPTION_STATUS[product];
    } else {
      return "";
    }
  } else {
    return "";
  }
}
