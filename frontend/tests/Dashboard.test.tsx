import React from 'react';
import { render } from '@testing-library/react-native';
// we mock the store to isolate tests
jest.mock('../store/useStore', () => ({
    useStore: () => ({
        dashboard: {
            total_sold_today: 150.50,
            total_sold_month: 2000.00,
            total_items_sold: 45,
            profit_month: 800.00,
            top_product: 'Camiseta Preta'
        },
        fetchDashboard: jest.fn(),
        isLoading: false
    })
}));

import Dashboard from '../app/index';

describe('Dashboard Screen', () => {
    it('renders correctly with mocked data', () => {
        const { getByText } = render(<Dashboard />);

        // Verify static labels
        expect(getByText('Vendido Hoje')).toBeTruthy();
        expect(getByText('Vendido no Mês')).toBeTruthy();
        expect(getByText('Produto Mais Vendido')).toBeTruthy();

        // Verify mocked dynamic data
        expect(getByText('R$ 150,50')).toBeTruthy();
        expect(getByText('R$ 2000,00')).toBeTruthy();
        expect(getByText('45')).toBeTruthy();
        expect(getByText('Camiseta Preta')).toBeTruthy();
    });
});
