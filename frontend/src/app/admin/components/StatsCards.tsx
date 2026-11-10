"use client";

import { Users, Shield, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface StatsCardsProps {
  stats: {
    total: number;
    admins: number;
    active: number;
    inactive: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { theme } = useTheme();

  const cards = [
    {
      title: "Total de Usuarios",
      value: stats.total,
      icon: Users,
      colorDark: "text-white bg-indigo-500/20 text-indigo-400",
      colorLight: "text-blue-900 bg-blue-100 text-blue-600",
    },
    {
      title: "Administradores",
      value: stats.admins,
      icon: Shield,
      colorDark: "text-purple-400 bg-purple-500/20 text-purple-400",
      colorLight: "text-cyan-600 bg-cyan-100 text-cyan-600",
    },
    {
      title: "Activos",
      value: stats.active,
      icon: CheckCircle,
      colorDark: "text-cyan-400 bg-cyan-500/20 text-cyan-400",
      colorLight: "text-blue-600 bg-blue-100 text-blue-600",
    },
    {
      title: "Inactivos",
      value: stats.inactive,
      icon: XCircle,
      colorDark: "text-amber-400 bg-amber-500/20 text-amber-400",
      colorLight: "text-orange-600 bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const [valueColor, iconBg, iconColor] = theme === "dark" 
          ? card.colorDark.split(" ")
          : card.colorLight.split(" ");

        return (
          <div
            key={index}
            className={`backdrop-blur-lg border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${
              theme === "dark"
                ? "bg-white/5 border-white/10 hover:bg-white/10"
                : "bg-blue-50/50 border-blue-200/30 hover:bg-blue-100/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {card.title}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 transition-colors duration-300 ${valueColor}`}
                >
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${iconBg}`}
              >
                <Icon className={`w-6 h-6 transition-colors duration-300 ${iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}