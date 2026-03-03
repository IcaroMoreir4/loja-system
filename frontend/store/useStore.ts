import { create } from 'zustand';
import { api } from '../services/api';

export interface Product {
    id: number;
    name: string;
    variation?: string;
    quantity: number;
    selling_price: number;
    cost_price: number;
}

export interface DashboardData {
    total_sold_today: number;
    total_sold_month: number;
    total_items_sold: number;
    profit_month: number;
    top_product: string;
}

interface StoreState {
    products: Product[];
    dashboard: DashboardData | null;
    pendingCredits: any[];
    isLoading: boolean;
    fetchProducts: () => Promise<void>;
    fetchDashboard: () => Promise<void>;
    fetchPendingCredits: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
    products: [],
    dashboard: null,
    pendingCredits: [],
    isLoading: false,

    fetchProducts: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/products');
            set({ products: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching products:', error);
            set({ isLoading: false });
        }
    },

    fetchDashboard: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/reports/dashboard');
            set({ dashboard: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            set({ isLoading: false });
        }
    },

    fetchPendingCredits: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/reports/pending-credits');
            set({ pendingCredits: data, isLoading: false });
        } catch (error) {
            console.error('Error fetching pending credits:', error);
            set({ isLoading: false });
        }
    }
}));
