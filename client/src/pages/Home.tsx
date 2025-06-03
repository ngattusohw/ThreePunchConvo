import React from 'react';
import { Link } from "wouter";
import ForumCategories from "@/components/forum/ForumCategories";
import ForumContent from "@/components/forum/ForumContent";
import EventsSidebar from "@/components/sidebar/EventsSidebar";
import TopUsersSidebar from "@/components/sidebar/TopUsersSidebar";

export default function Home() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Sidebar - Categories */}
        <ForumCategories />

        {/* Center - Forum Content */}
        <ForumContent category="general" />

        {/* Right Sidebar - Schedule and Rankings */}
        <aside className="hidden sidebar:block w-96 flex-shrink-0 space-y-6">
          {/* Upcoming Events */}
          {/* <EventsSidebar /> */}
          
          {/* Top Users */}
          <TopUsersSidebar />
        </aside>
      </div>
    </div>
  );
}
