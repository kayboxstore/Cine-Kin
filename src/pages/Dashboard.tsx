import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  FiUsers, FiShoppingCart, FiCheckCircle,
  FiClock, FiTrash2, FiRefreshCw, FiLogOut,
  FiShield, FiAlertTriangle
} from "react-icons/fi";
import SEO from "@/components/SEO";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [activeTab, setActiveTab] = useState<"orders" | "customers">("orders");

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: orderStats, refetch: refetchOrderStats } = trpc.admin.orderStats.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: customerStats, refetch: refetchCustomerStats } = trpc.admin.customerStats.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: ordersList, refetch: refetchOrders } = trpc.admin.orderList.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: customersList, refetch: refetchCustomers } = trpc.admin.customerList.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );

  const updateOrderStatus = trpc.admin.orderUpdateStatus.useMutation({
    onSuccess: () => { refetchOrders(); refetchOrderStats(); },
  });
  const deleteOrder = trpc.admin.orderDelete.useMutation({
    onSuccess: () => { refetchOrders(); refetchOrderStats(); },
  });
  const updateCustomerStatus = trpc.admin.customerUpdateStatus.useMutation({
    onSuccess: () => { refetchCustomers(); refetchCustomerStats(); },
  });
  const deleteCustomer = trpc.admin.customerDelete.useMutation({
    onSuccess: () => { refetchCustomers(); refetchCustomerStats(); },
  });

  const refreshAll = () => {
    refetchOrderStats();
    refetchCustomerStats();
    refetchOrders();
    refetchCustomers();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated - will be redirected by useAuth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white/50 text-lg">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <FiShield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-white mb-2">Accès refusé</h1>
          <p className="text-white/45 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[#5a6b4e] text-white rounded-xl hover:bg-[#4d5d42] transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO title="Dashboard Admin" description="Tableau de bord d'administration Ciné Kin Premium" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Gestion des commandes et clients</p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#5a6b4e]/20 flex items-center justify-center">
                    <FiUsers className="w-3.5 h-3.5 text-[#6b7c5c]" />
                  </div>
                )}
                <span className="text-white/70 text-sm">{user.name || "Admin"}</span>
                <span className="px-1.5 py-0.5 bg-[#5a6b4e]/15 text-[#6b7c5c] text-[10px] font-bold rounded uppercase">
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Déconnexion"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
            <button
              onClick={refreshAll}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Rafraîchir"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Commandes", value: orderStats?.total ?? 0, icon: FiShoppingCart, color: "text-[#6b7c5c]", bg: "bg-[#5a6b4e]/10" },
            { label: "En attente", value: orderStats?.pending ?? 0, icon: FiClock, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Clients", value: customerStats?.total ?? 0, icon: FiUsers, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Actifs", value: customerStats?.active ?? 0, icon: FiCheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          ].map((stat, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.02]">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-display font-bold text-2xl text-white">{stat.value}</div>
              <div className="text-white/40 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "orders" ? "bg-[#5a6b4e] text-white" : "bg-white/[0.03] text-white/45 hover:text-white/65"
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "customers" ? "bg-[#5a6b4e] text-white" : "bg-white/[0.03] text-white/45 hover:text-white/65"
            }`}
          >
            Clients
          </button>
        </div>

        {/* Orders Table */}
        {activeTab === "orders" && (
          <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">ID</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Client</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Plan</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Prix</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Statut</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Date</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList && ordersList.length > 0 ? (
                    ordersList.map((order) => (
                      <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="text-white/60 text-sm px-4 py-3">#{order.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">{order.customerName}</div>
                          <div className="text-white/35 text-xs">{order.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">{order.planName}</div>
                          <div className="text-white/35 text-xs capitalize">{order.planType}</div>
                        </td>
                        <td className="text-white text-sm px-4 py-3">{order.price}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus.mutate({
                                id: order.id,
                                status: e.target.value as "pending" | "active" | "expired" | "cancelled",
                              })
                            }
                            className="bg-white/[0.05] text-white text-xs rounded-lg px-2 py-1 border border-white/[0.08]"
                          >
                            <option value="pending">En attente</option>
                            <option value="active">Actif</option>
                            <option value="expired">Expiré</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </td>
                        <td className="text-white/40 text-xs px-4 py-3">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { if (confirm("Supprimer ?")) deleteOrder.mutate({ id: order.id }); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-white/30 text-sm py-12">
                        Aucune commande
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Table */}
        {activeTab === "customers" && (
          <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">ID</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Nom</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Contact</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Plan</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Statut</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Date</th>
                    <th className="text-left text-white/40 text-xs font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customersList && customersList.length > 0 ? (
                    customersList.map((customer) => (
                      <tr key={customer.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="text-white/60 text-sm px-4 py-3">#{customer.id}</td>
                        <td className="text-white text-sm px-4 py-3">{customer.name}</td>
                        <td className="px-4 py-3">
                          <div className="text-white/60 text-sm">{customer.email}</div>
                          <div className="text-white/35 text-xs">{customer.phone}</div>
                        </td>
                        <td className="text-white text-sm px-4 py-3">{customer.planName}</td>
                        <td className="px-4 py-3">
                          <select
                            value={customer.status}
                            onChange={(e) =>
                              updateCustomerStatus.mutate({
                                id: customer.id,
                                status: e.target.value as "active" | "expired" | "suspended",
                              })
                            }
                            className="bg-white/[0.05] text-white text-xs rounded-lg px-2 py-1 border border-white/[0.08]"
                          >
                            <option value="active">Actif</option>
                            <option value="expired">Expiré</option>
                            <option value="suspended">Suspendu</option>
                          </select>
                        </td>
                        <td className="text-white/40 text-xs px-4 py-3">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { if (confirm("Supprimer ?")) deleteCustomer.mutate({ id: customer.id }); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-white/30 text-sm py-12">
                        Aucun client
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
