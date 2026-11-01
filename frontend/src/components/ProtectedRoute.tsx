"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/AccessDenied";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirectUrl}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
            Verifying Plant Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <AccessDenied
        requiredPermission={requiredPermission}
        title="Permission Required"
        description="Your current role does not have authorization to perform or inspect this action."
      />
    );
  }

  // Check required role if specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDenied
        requiredRole={Array.isArray(requiredRole) ? requiredRole.join(" or ") : requiredRole}
        title="Role Elevation Required"
        description="This administrative section is restricted to specific higher-privilege plant roles."
      />
    );
  }

  return <>{children}</>;
};
