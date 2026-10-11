import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Mail, Shield } from "lucide-react";

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await base44.entities.User.list();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {users.length} registered {users.length === 1 ? "user" : "users"}
        </p>
      </div>

      {/* Privacy notice */}
      <div className="bg-accent rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-accent-foreground">
          For privacy, only email addresses and account roles are shown. Private profile data, documents, and application answers are not accessible to administrators.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email"
          className="h-11 pl-9"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                {(user.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium text-foreground truncate text-sm">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Joined {new Date(user.created_date).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                user.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
              }`}>
                {user.role || "user"}
              </span>
            </div>
          ))
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? "No users match your search." : "No users registered yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}