"use client";

import { useState } from "react";
import { Clock, Check, X, Zap } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import Tabs from "@/components/Tabs";
import PostCard from "@/components/PostCard";
import ScheduledPostCard from "@/components/ScheduledPostCard";

// Mock data
const mockPendingPost = {
  id: "1",
  source: "GE - Futebol",
  timestamp: "20 min atras",
  avatar: "⚽",
  accountName: "FutNews Br",
  accountHandle: "@futnews_br",
  content:
    "🚨 O MENINO DA VILA TA VOLTANDO? Segundo fontes do GE, Neymar ja disse SIM ao Santos! #SantosFC #Neymar",
};

const mockScheduledPost = {
  id: "2",
  source: "TechCrunch",
  scheduledTime: "14:00",
  avatar: "FN",
  content:
    "A IA ta ficando cada vez mais humana. 🤖 A OpenAI lancou hoje um modelo focado em Raciocinio Logico. #AI",
};

const tabs = [
  { id: "queue", label: "Fila", count: 3 },
  { id: "scheduled", label: "Agendados" },
  { id: "published", label: "Publicados" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("queue");

  const handleApprove = (id: string) => {
    console.log("Approved:", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit:", id);
  };

  const handleDiscard = (id: string) => {
    console.log("Discard:", id);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-72 p-12 max-w-[1400px]">
        <Header
          title="Fila de Aprovacao"
          subtitle="Gerencie o conteudo gerado hoje."
          onFilterClick={() => console.log("Filters clicked")}
          onNewPostClick={() => console.log("New post clicked")}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <StatsCard
            icon={Clock}
            iconColor="amber"
            label="Pendentes"
            value={12}
            badge="Hoje"
          />
          <StatsCard
            icon={Check}
            iconColor="emerald"
            label="Aprovados"
            value={24}
            badge="+4"
          />
          <StatsCard icon={X} iconColor="red" label="Rejeitados" value={2} />
          <StatsCard
            icon={Zap}
            iconColor="sky"
            label="Performance IA"
            value="98%"
            variant="performance"
          />
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Post List */}
        <div className="space-y-6">
          {activeTab === "queue" && (
            <>
              <PostCard
                post={mockPendingPost}
                onApprove={handleApprove}
                onEdit={handleEdit}
                onDiscard={handleDiscard}
              />
              <ScheduledPostCard post={mockScheduledPost} />
            </>
          )}

          {activeTab === "scheduled" && (
            <ScheduledPostCard post={mockScheduledPost} />
          )}

          {activeTab === "published" && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg font-medium">Nenhum post publicado ainda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
