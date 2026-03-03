import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MaterialIcons } from '@expo/vector-icons';

export default function Dashboard() {
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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Visão Geral</Text>
                <Text style={styles.subtitle}>Acompanhe o desempenho da sua loja hoje.</Text>
            </View>

            <View style={styles.grid}>

                {/* Receita Hoje */}
                <Card style={styles.card}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Vendido Hoje</CardTitle>
                        <MaterialIcons name="attach-money" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent>
                        {isLoading && !dashboard ? <ActivityIndicator color="#18181b" /> : (
                            <Text style={styles.cardValue}>{formatCurrency(dashboard?.total_sold_today || 0)}</Text>
                        )}
                        <Text style={styles.cardDesc}>Total bruto registrado no dia</Text>
                    </CardContent>
                </Card>

                {/* Receita Mês */}
                <Card style={styles.card}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Vendido no Mês</CardTitle>
                        <MaterialIcons name="date-range" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent>
                        <Text style={styles.cardValue}>{formatCurrency(dashboard?.total_sold_month || 0)}</Text>
                        <Text style={styles.cardDesc}>Receita acumulada neste mês</Text>
                    </CardContent>
                </Card>

                {/* Lucro Estimado */}
                <Card style={styles.card}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Lucro Estimado</CardTitle>
                        <MaterialIcons name="trending-up" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent>
                        <Text style={[styles.cardValue, { color: '#16a34a' }]}>{formatCurrency(dashboard?.profit_month || 0)}</Text>
                        <Text style={styles.cardDesc}>Baseado na Venda - Custo</Text>
                    </CardContent>
                </Card>

                {/* Produtos Vendidos */}
                <Card style={styles.card}>
                    <CardHeader style={styles.cardHeaderRow}>
                        <CardTitle style={styles.cardTitle}>Peças Vendidas</CardTitle>
                        <MaterialIcons name="shopping-bag" size={20} color="#71717a" />
                    </CardHeader>
                    <CardContent>
                        <Text style={styles.cardValue}>{dashboard?.total_items_sold || 0}</Text>
                        <Text style={styles.cardDesc}>Destaque: {dashboard?.top_product || 'Nenhum'}</Text>
                    </CardContent>
                </Card>

            </View>

            {/* Alertas */}
            {pendingCredits.length > 0 && (
                <Card style={styles.alertCard}>
                    <View style={styles.alertRow}>
                        <MaterialIcons name="warning" size={24} color="#ef4444" />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={styles.alertTitle}>Fiados Pendentes</Text>
                            <Text style={styles.alertDesc}>Você tem {pendingCredits.length} fiados aguardando pagamento.</Text>
                        </View>
                    </View>
                </Card>
            )}

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
    card: { flexGrow: 1, minWidth: 250, maxWidth: '100%', flexBasis: '45%' },

    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
    cardTitle: { fontSize: 14, fontWeight: '500', color: '#71717a' },
    cardValue: { fontSize: 32, fontWeight: 'bold', color: '#09090b', letterSpacing: -1 },
    cardDesc: { fontSize: 12, color: '#a1a1aa', marginTop: 4 },

    alertCard: { backgroundColor: '#fef2f2', borderColor: '#fecaca', padding: 16 },
    alertRow: { flexDirection: 'row', alignItems: 'center' },
    alertTitle: { fontSize: 16, fontWeight: '600', color: '#991b1b' },
    alertDesc: { fontSize: 14, color: '#b91c1c', marginTop: 2 }
});
