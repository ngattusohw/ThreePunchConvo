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
          
          {/* Community Ad */}
          <div className="bg-dark-gray rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="text-white font-bold mb-2">Join Our Discord</h3>
              <p className="text-gray-300 text-sm mb-3">Connect with other MMA fans in our community Discord server!</p>
              <a href="https://discord.gg/3punchconvo" target="_blank" rel="noopener noreferrer" className="block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded text-center text-sm transition">
                Join Community
              </a>
              {/* <p className="text-gray-500 text-xs mt-2 text-center">5,400+ members online now</p> */}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
