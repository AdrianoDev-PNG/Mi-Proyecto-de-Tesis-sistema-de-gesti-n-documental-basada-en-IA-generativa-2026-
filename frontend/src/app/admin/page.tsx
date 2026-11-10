"use client";

import { useState, useEffect } from "react";
import { UserPlus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { getAccessToken, getUser } from "../services/auth.service";
import { createUserService } from "./services/create-user.service";
import { CreateUserRequest, User } from "./types/type";
import { useToast } from "../hook/useToast";
import AdminHeader from "./components/Header";
import StatsCards from "./components/StatsCards";
import Toast from "../context/Toast";
import CreateUserForm from "./components/CreateUserForm";
import SearchFilters from "./components/SearchFilters";
import UsersTable from "./components/UsersTable";
import EditUserForm from "./components/EditUserForm";
import ConfirmationModal from "../components/ConfirmationModal";

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    active: 0,
    inactive: 0,
  });

  const handleCreateUser = async (formData: CreateUserRequest) => {
    setLoading(true);

    const result = await createUserService.createUser(formData);

    if (result.success) {
      showToast("success", "Usuario creado exitosamente");
      setShowForm(false);
      loadUsers();
    } else {
      showToast("error", result.error || "Error al crear usuario");
    }

    setLoading(false);
  };

  const handleEditUser = async (userId: string, data: { username?: string; email?: string; full_name?: string; role?: string }) => {
    setLoadingAction(userId);

    const result = await createUserService.editUser(userId, data);

    if (result.success) {
      showToast("success", "Usuario actualizado exitosamente");
      setEditingUser(null);
      loadUsers();
    } else {
      showToast("error", result.error || "Error al editar usuario");
    }

    setLoadingAction(null);
  };

  const handleToggleStatus = async (userId: string) => {
    setLoadingAction(userId);

    const result = await createUserService.toggleUserStatus(userId);

    if (result.success) {
      showToast("success", "Estado del usuario actualizado");
      loadUsers();
    } else {
      showToast("error", result.error || "Error al cambiar el estado");
    }

    setLoadingAction(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setLoadingAction(deletingUser.id);

    const result = await createUserService.deleteUser(deletingUser.id);

    if (result.success) {
      showToast("success", "Usuario eliminado exitosamente");
      setDeletingUser(null);
      loadUsers();
    } else {
      showToast("error", result.error || "Error al eliminar usuario");
    }

    setLoadingAction(null);
  };

  const handleOpenDeleteModal = (user: User) => {
    setDeletingUser(user);
  };

  const loadUsers = async () => {
    setLoading(true);

    try {
      const usuariosResult = await createUserService.listUsers('usuario');
      
      const soporteResult = await createUserService.listSupportUsers();

      if (usuariosResult.success && soporteResult.success) {
        const allUsers = [
          ...(usuariosResult.users || []),
          ...(soporteResult.users || [])
        ];
        
        setUsers(allUsers);

        setStats({
          total: allUsers.length,
          admins: allUsers.filter((u) => u.is_admin).length,
          active: allUsers.filter((u) => u.is_active).length,
          inactive: allUsers.filter((u) => !u.is_active).length,
        });
      } else {
        showToast("error", usuariosResult.error || soporteResult.error || "Error al cargar usuarios");
      }
    } catch {
      showToast("error", "Error al cargar usuarios");
    }

    setLoading(false);
  };

  useEffect(() => {
    const token = getAccessToken();
    const currentUser = getUser();
    
    if (!token || !currentUser) {
      router.push("/");
      return;
    }

    const role = currentUser.role?.toString().trim().toLowerCase();
    if (role !== "administrador") {
      showToast("error", "No tienes permiso para acceder a esta página");
      router.push("/user");
      return;
    }
    (async () => {
      setLoading(true);
      
      try {
        const usuariosResult = await createUserService.listUsers('usuario');
        
        const soporteResult = await createUserService.listSupportUsers();

        if (usuariosResult.success && soporteResult.success) {
          const allUsers = [
            ...(usuariosResult.users || []),
            ...(soporteResult.users || [])
          ];
          
          setUsers(allUsers);

          setStats({
            total: allUsers.length,
            admins: allUsers.filter((u) => u.is_admin).length,
            active: allUsers.filter((u) => u.is_active).length,
            inactive: allUsers.filter((u) => !u.is_active).length,
          });
        } else {
          showToast("error", usuariosResult.error || soporteResult.error || "Error al cargar usuarios");
        }
      } catch {
        showToast("error", "Error al cargar usuarios");
      }
      
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesRole =
      filterRole === "all" ||
      filterRole === user.role;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.is_active) ||
      (filterStatus === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
      }`}
    >
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}

      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards stats={stats} />

        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg ${
              theme === "dark"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            }`}
          >
            <UserPlus className="w-5 h-5" />
            {showForm ? "Cancelar" : "Crear Usuario"}
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className={`font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm disabled:opacity-50 border ${
              theme === "dark"
                ? "bg-white/5 hover:bg-white/10 border-white/20 text-white"
                : "bg-blue-50 hover:bg-blue-100 border-blue-200/50 text-slate-700"
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <CreateUserForm onSubmit={handleCreateUser} loading={loading} />
          </div>
        )}

        <div
          className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 ${
            theme === "dark" ? "bg-white/5 border-white/10" : "bg-blue-50/50 border-blue-200/30"
          }`}
        >
          <SearchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            totalUsers={users.length}
            filteredCount={filteredUsers.length}
          />

          <UsersTable
            users={users}
            searchQuery={searchQuery}
            filterRole={filterRole}
            filterStatus={filterStatus}
            onEdit={setEditingUser}
            onDelete={handleOpenDeleteModal}
            onToggleStatus={handleToggleStatus}
            loading={loadingAction}
          />
          <div
            className={`p-4 border-t transition-colors duration-300 ${
              theme === "dark"
                ? "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
                : "border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-transparent"
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <div
                className={`transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Mostrando{" "}
                <span
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {filteredUsers.length}
                </span>{" "}
                de{" "}
                <span
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {users.length}
                </span>{" "}
                usuarios
              </div>
            </div>
          </div>
        </div>
      </main>

      <div
        className={`mt-8 pb-8 text-center text-sm transition-colors duration-300 ${
          theme === "dark" ? "text-slate-500" : "text-slate-500"
        }`}
      >
        <p>Panel administrativo • Gestión de usuarios del sistema</p>
      </div>

      <EditUserForm
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
        loading={loadingAction === editingUser?.id}
      />

      <ConfirmationModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        subtitle="Esta acción no se puede deshacer"
        message="Estás a punto de eliminar el usuario"
        itemCount={1}
        itemLabel="usuario"
        isLoading={loadingAction === deletingUser?.id}
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
        confirmButtonVariant="danger"
        itemsList={[
          `Usuario: ${deletingUser?.username}`,
          "Todos los datos asociados",
          "Registros de la base de datos"
        ]}
      />
    </div>
  );
}