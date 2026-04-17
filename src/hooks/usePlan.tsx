import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanType = "basic" | "premium" | "platinum";

interface PlanInfo {
  plan: PlanType;
  loading: boolean;
  canUploadUnlimited: boolean;
  canViewDividends: boolean;
  canGenerateIR: boolean;
  canExportData: boolean;
  maxNotasPerMonth: number | null; // null = unlimited
}

const PLAN_FEATURES: Record<PlanType, Omit<PlanInfo, "plan" | "loading">> = {
  basic: {
    canUploadUnlimited: false,
    canViewDividends: false,
    canGenerateIR: false,
    canExportData: false,
    maxNotasPerMonth: 5,
  },
  premium: {
    canUploadUnlimited: true,
    canViewDividends: true,
    canGenerateIR: false,
    canExportData: false,
    maxNotasPerMonth: null,
  },
  platinum: {
    canUploadUnlimited: true,
    canViewDividends: true,
    canGenerateIR: true,
    canExportData: true,
    maxNotasPerMonth: null,
  },
};

export function usePlan(): PlanInfo {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("basic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("plan, status, expires_at")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          const isActive = data.status === "active" && 
            (!data.expires_at || new Date(data.expires_at) > new Date());
          setPlan(isActive ? (data.plan as PlanType) : "basic");
        }
      } catch {
        // Default to basic
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  return {
    plan,
    loading,
    ...PLAN_FEATURES[plan],
  };
}
