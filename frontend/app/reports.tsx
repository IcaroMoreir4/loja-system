import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
    const { dashboard, pendingCredits, fetchDashboard, fetchPendingCredits, isLoading } = useStore();

    useEffect(() => {
        fetchDashboard();
        fetchPendingCredits();
    }, []);

    const onRefresh = () => {
        fetchDashboard();
        fetchPendingCredits();
    };

    const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;

    const getPendingTotal = () => {
        return pendingCredits.reduce((acc, curr) => acc + (curr.total_value - curr.paid_amount), 0);
    };

    // Mock data for charts since we don't have historical points yet in API
    const barData = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
            {
                data: [
                    (dashboard?.total_sold_month || 0) * 0.2,
                    (dashboard?.total_sold_month || 0) * 0.3,
                    (dashboard?.total_sold_month || 0) * 0.1,
                    (dashboard?.total_sold_month || 0) * 0.4
                ]
            }
        ]
    };

    const pieData = [
        {
            name: 'Recebido',
            population: dashboard?.total_sold_month || 1, // Defaulting to 1 to prevent empty chart
            color: '#16a34a',
            legendFontColor: '#71717a',
            legendFontSize: 12
        },
        {
            name: 'A Receber (Fiado)',
            population: getPendingTotal(),
            color: '#ef4444',
            legendFontColor: '#71717a',
            legendFontSize: 12
        }
    ];

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(24, 24, 27, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Relatórios & Análises</Text>
                <Text style={styles.subtitle}>Visualize o crescimento e a saúde financeira do seu negócio.</Text>
            </View>

            <View style={styles.grid}>

                <Card style={styles.cardLarge}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Desempenho de Vendas (Mês)</CardTitle>
                        <MaterialIcons name="insert-chart" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
                        <BarChart
                            data={barData}
                            width={Math.min(screenWidth - 110, 500)} // max width for large screens
                            height={220}
                            yAxisLabel="R$"
                            yAxisSuffix=""
                            chartConfig={chartConfig}
                            verticalLabelRotation={0}
                            style={{ borderRadius: 8, paddingRight: 40 }}
                        />
                    </CardContent>
                </Card>

                <Card style={styles.cardLarge}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Composição da Receita</CardTitle>
                        <MaterialIcons name="pie-chart" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
                        <PieChart
                            data={pieData}
                            width={Math.min(screenWidth - 100, 500)}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"0"}
                            center={[10, 0]}
                            absolute
                        />
                    </CardContent>
                </Card>

                {/* Summary Mini Cards */}
                <Card style={styles.cardMini}>
                    <CardHeader style={styles.cardHeaderRowMini}>
                        <CardTitle style={styles.cardTitle}>Lucro Bruto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text style={[styles.cardValue, { color: '#16a34a' }]}>{formatCurrency(dashboard?.profit_month || 0)}</Text>
                    </CardContent>
                </Card>

                <Card style={styles.cardMini}>
                    <CardHeader style={styles.cardHeaderRowMini}>
                        <CardTitle style={styles.cardTitle}>Total a Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text style={[styles.cardValue, { color: '#ef4444' }]}>{formatCurrency(getPendingTotal())}</Text>
                    </CardContent>
                </Card>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f5' },
    contentContainer: { padding: 24, paddingBottom: 64 },

    header: { marginBottom: 24 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    cardLarge: { flexGrow: 1, minWidth: 280, maxWidth: '100%', flexBasis: '45%' },
    cardMini: { flexGrow: 1, minWidth: 150, maxWidth: '100%', flexBasis: '20%' },

    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
    cardHeaderRowMini: { paddingBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#09090b' },
    cardValue: { fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },
});
