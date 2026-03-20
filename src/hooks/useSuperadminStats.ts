import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
}

export function useSuperadminStats() {
  return useQuery<DashboardStats>({
    queryKey: ['superadmin-dashboard-stats'],
    queryFn: async () => {
      // Fetch all stats with optimized queries in parallel
      const [totalServicesRes, activeServicesRes, totalBookingsRes, pendingBookingsRes] = await Promise.all([
        supabase
          .from('services')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('service_bookings')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('service_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      return {
        totalServices: totalServicesRes.count || 0,
        activeServices: activeServicesRes.count || 0,
        totalBookings: totalBookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
