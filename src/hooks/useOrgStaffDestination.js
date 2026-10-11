import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useOrgStaffDestination(enabled = true) {
  const [state, setState] = useState({
    loading: enabled,
    destination: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, destination: null, error: null });
      return;
    }

    let cancelled = false;

    async function checkStaffAssignment() {
      setState({ loading: true, destination: null, error: null });

      try {
        const result = await base44.functions.invoke("getOrgSession", {});
        const data = result?.data || result;
        const slug = data?.organization?.slug;

        if (!slug) {
          throw new Error("Organization staff account is missing a workspace.");
        }

        if (!cancelled) {
          setState({
            loading: false,
            destination: `/org/${slug}`,
            error: null,
          });
        }
      } catch (err) {
        const status = Number(err?.response?.status || err?.status || 0);

        if (status === 403) {
          if (!cancelled) {
            setState({ loading: false, destination: null, error: null });
          }
          return;
        }

        if (!cancelled) {
          setState({
            loading: false,
            destination: null,
            error:
              err?.response?.data?.error ||
              err?.message ||
              "Unable to determine account access.",
          });
        }
      }
    }

    checkStaffAssignment();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}