import React from "react";
import { Link } from "wouter";
import ForumCategories from "@/components/forum/ForumCategories";
import ForumContent from "@/components/forum/ForumContent";
import EventsSidebar from "@/components/sidebar/EventsSidebar";
import TopUsersSidebar from "@/components/sidebar/TopUsersSidebar";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Sidebar - Categories */}
        <ForumCategories />

        {/* Center - Forum Content */}
        <ForumContent category="general" />

        {/* Right Sidebar - Schedule and Rankings */}
        <aside className="hidden w-96 flex-shrink-0 space-y-6 sidebar:block">
          {/* Upcoming Events */}
          {/* <EventsSidebar /> */}

          {/* Top Users */}
          <TopUsersSidebar />
        </aside>
      </div>
    </div>
  );
}
